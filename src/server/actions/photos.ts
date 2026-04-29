'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';
import { uploadPhoto, deletePhotoFromStorage } from '@/lib/storage/photos';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/types/photo';

const photoMetadataSchema = z.object({
  patient_id: z.string().uuid(),
  category: z.enum(['general', 'before', 'during', 'after', 'xray', 'intraoral', 'smile', 'microscope', 'study_model', 'document']),
  tooth_numbers: z.array(z.string()).optional().nullable(),
  taken_at: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  appointment_id: z.string().uuid().optional().nullable(),
  treatment_plan_id: z.string().uuid().optional().nullable(),
});

function clean(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = String(v).trim();
  return t.length === 0 ? null : t;
}

// Sube una foto: recibe FormData con file + metadata JSON
export async function uploadPatientPhoto(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const file = formData.get('file');
  const metadataRaw = formData.get('metadata');

  if (!file || !(file instanceof File)) {
    return { ok: false as const, error: 'Archivo invalido' };
  }

  // Validar tamano
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false as const, error: 'Archivo muy grande (max 10MB)' };
  }

  // Validar tipo
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { ok: false as const, error: 'Tipo no permitido. Solo JPG, PNG, WEBP, HEIC' };
  }

  // Parsear metadata
  let metadata;
  try {
    metadata = JSON.parse(String(metadataRaw || '{}'));
  } catch {
    return { ok: false as const, error: 'Metadata invalida' };
  }

  const parsed = photoMetadataSchema.safeParse(metadata);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message || 'Datos invalidos' };
  }

  const data = parsed.data;

  // Subir archivo
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const uploadRes = await uploadPhoto({
    tenantId: profile.tenant.id,
    patientId: data.patient_id,
    fileName: file.name,
    fileBuffer: buffer,
    contentType: file.type,
  });

  if (!uploadRes.ok) {
    return { ok: false as const, error: uploadRes.error };
  }

  // Insertar metadata en BD
  const supabase = await createServerSupabase();
  const payload: Record<string, unknown> = {
    tenant_id: profile.tenant.id,
    patient_id: data.patient_id,
    storage_path: uploadRes.path,
    storage_url: uploadRes.url,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type,
    category: data.category,
    is_deleted: false,
  };

  if (data.tooth_numbers && data.tooth_numbers.length > 0) {
    payload.tooth_numbers = data.tooth_numbers;
  }
  const cleanTaken = clean(data.taken_at);
  if (cleanTaken) payload.taken_at = cleanTaken;
  const cleanNotes = clean(data.notes);
  if (cleanNotes) payload.notes = cleanNotes;
  if (data.appointment_id) payload.appointment_id = data.appointment_id;
  if (data.treatment_plan_id) payload.treatment_plan_id = data.treatment_plan_id;

  const { data: created, error } = await supabase
    .from('patient_photos')
    .insert(payload)
    .select('id')
    .single();

  if (error || !created) {
    console.error('[uploadPatientPhoto] insert error:', error);
    // Rollback: borrar el archivo subido
    await deletePhotoFromStorage(uploadRes.path);
    return { ok: false as const, error: 'Error al guardar metadata: ' + (error?.message || '') };
  }

  revalidatePath('/dental/patients/' + data.patient_id + '/gallery');
  return { ok: true as const, id: created.id as string, url: uploadRes.url };
}

// Actualizar metadata
const updateSchema = z.object({
  id: z.string().uuid(),
  category: z.enum(['general', 'before', 'during', 'after', 'xray', 'intraoral', 'smile', 'microscope', 'study_model', 'document']).optional(),
  tooth_numbers: z.array(z.string()).optional().nullable(),
  taken_at: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export async function updatePhotoMetadata(input: z.input<typeof updateSchema>) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return { ok: false as const, error: 'No autorizado' };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'Datos invalidos' };

  const supabase = await createServerSupabase();
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.category) updateData.category = parsed.data.category;
  if (parsed.data.tooth_numbers !== undefined) {
    updateData.tooth_numbers = parsed.data.tooth_numbers && parsed.data.tooth_numbers.length > 0 ? parsed.data.tooth_numbers : null;
  }
  if (parsed.data.taken_at !== undefined) updateData.taken_at = clean(parsed.data.taken_at);
  if (parsed.data.notes !== undefined) updateData.notes = clean(parsed.data.notes);

  const { data: existing } = await supabase
    .from('patient_photos')
    .select('patient_id')
    .eq('id', parsed.data.id)
    .eq('tenant_id', profile.tenant.id)
    .single();

  const { error } = await supabase
    .from('patient_photos')
    .update(updateData)
    .eq('id', parsed.data.id)
    .eq('tenant_id', profile.tenant.id);

  if (error) {
    return { ok: false as const, error: 'Error: ' + error.message };
  }

  if (existing?.patient_id) {
    revalidatePath('/dental/patients/' + existing.patient_id + '/gallery');
  }
  return { ok: true as const };
}

// Eliminar (soft delete por defecto)
export async function deletePatientPhoto(id: string, hardDelete: boolean = false) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return { ok: false as const, error: 'No autorizado' };

  const supabase = await createServerSupabase();

  // Cargar la foto para tener storage_path y patient_id
  const { data: photo } = await supabase
    .from('patient_photos')
    .select('id, storage_path, patient_id')
    .eq('id', id)
    .eq('tenant_id', profile.tenant.id)
    .single();

  if (!photo) return { ok: false as const, error: 'Foto no encontrada' };

  if (hardDelete) {
    // Borrar del storage
    await deletePhotoFromStorage(photo.storage_path as string);
    // Borrar de BD
    const { error } = await supabase
      .from('patient_photos')
      .delete()
      .eq('id', id)
      .eq('tenant_id', profile.tenant.id);
    if (error) return { ok: false as const, error: error.message };
  } else {
    // Soft delete
    const { error } = await supabase
      .from('patient_photos')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', profile.tenant.id);
    if (error) return { ok: false as const, error: error.message };
  }

  if (photo.patient_id) {
    revalidatePath('/dental/patients/' + photo.patient_id + '/gallery');
  }
  return { ok: true as const };
}
