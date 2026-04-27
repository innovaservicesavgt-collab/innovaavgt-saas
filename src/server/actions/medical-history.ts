'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';
import type { MedicalHistoryData, EvolutionNote } from '@/lib/types/medical-history';

// ─────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────
const medicalHistorySchema = z.object({
  patient_id: z.string().uuid(),
  data: z.object({
    medical_history: z
      .object({
        diseases: z.string().nullable().optional(),
        surgeries: z.string().nullable().optional(),
        current_medications: z.string().nullable().optional(),
        structured_allergies: z.array(z.string()).nullable().optional(),
        is_pregnant: z.boolean().nullable().optional(),
        blood_pressure: z.string().nullable().optional(),
        other: z.string().nullable().optional(),
      })
      .optional(),
    dental_history: z
      .object({
        last_visit_elsewhere: z.string().nullable().optional(),
        previous_treatments: z.string().nullable().optional(),
        complications: z.string().nullable().optional(),
      })
      .optional(),
    habits: z
      .object({
        smoker: z.boolean().nullable().optional(),
        alcohol: z.enum(['no', 'ocasional', 'frecuente']).nullable().optional(),
        bruxism: z.boolean().nullable().optional(),
        other: z.string().nullable().optional(),
      })
      .optional(),
  }),
});

const addNoteSchema = z.object({
  patient_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

const deleteNoteSchema = z.object({
  patient_id: z.string().uuid(),
  note_id: z.string(),
});

// ─────────────────────────────────────────────────────────────
// updateMedicalHistory
// ─────────────────────────────────────────────────────────────
export async function updateMedicalHistory(
  input: z.infer<typeof medicalHistorySchema>
) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const parsed = medicalHistorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: 'Datos invalidos' };
  }

  const { patient_id, data } = parsed.data;
  const supabase = await createServerSupabase();

  // Cargar metadata actual para no sobreescribir notas evolutivas
  const { data: current } = await supabase
    .from('patients')
    .select('metadata')
    .eq('id', patient_id)
    .eq('tenant_id', profile.tenant.id)
    .single();

  if (!current) {
    return { ok: false as const, error: 'Paciente no encontrado' };
  }

  const currentMeta = (current.metadata || {}) as MedicalHistoryData;

  const newMetadata = {
    ...currentMeta,
    ...data,
    // Preservar las notas evolutivas existentes
    evolution_notes: currentMeta.evolution_notes || [],
  };

  const { error } = await supabase
    .from('patients')
    .update({
      metadata: newMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq('id', patient_id)
    .eq('tenant_id', profile.tenant.id);

  if (error) {
    return { ok: false as const, error: 'Error al guardar' };
  }

  revalidatePath(`/dental/patients/${patient_id}`);
  return { ok: true as const };
}

// ─────────────────────────────────────────────────────────────
// addEvolutionNote
// ─────────────────────────────────────────────────────────────
export async function addEvolutionNote(input: z.infer<typeof addNoteSchema>) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const parsed = addNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: 'La nota no puede estar vacia' };
  }

  const { patient_id, content } = parsed.data;
  const supabase = await createServerSupabase();

  const { data: current } = await supabase
    .from('patients')
    .select('metadata')
    .eq('id', patient_id)
    .eq('tenant_id', profile.tenant.id)
    .single();

  if (!current) {
    return { ok: false as const, error: 'Paciente no encontrado' };
  }

  const currentMeta = (current.metadata || {}) as MedicalHistoryData;
  const existingNotes = currentMeta.evolution_notes || [];

  const author =
    `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Usuario';

  const newNote: EvolutionNote = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    author,
    content,
  };

  const newMetadata = {
    ...currentMeta,
    evolution_notes: [newNote, ...existingNotes],
  };

  const { error } = await supabase
    .from('patients')
    .update({
      metadata: newMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq('id', patient_id)
    .eq('tenant_id', profile.tenant.id);

  if (error) {
    return { ok: false as const, error: 'Error al agregar nota' };
  }

  revalidatePath(`/dental/patients/${patient_id}`);
  return { ok: true as const };
}

// ─────────────────────────────────────────────────────────────
// deleteEvolutionNote
// ─────────────────────────────────────────────────────────────
export async function deleteEvolutionNote(
  input: z.infer<typeof deleteNoteSchema>
) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const parsed = deleteNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: 'Datos invalidos' };
  }

  const { patient_id, note_id } = parsed.data;
  const supabase = await createServerSupabase();

  const { data: current } = await supabase
    .from('patients')
    .select('metadata')
    .eq('id', patient_id)
    .eq('tenant_id', profile.tenant.id)
    .single();

  if (!current) {
    return { ok: false as const, error: 'Paciente no encontrado' };
  }

  const currentMeta = (current.metadata || {}) as MedicalHistoryData;
  const filtered = (currentMeta.evolution_notes || []).filter(
    (n) => n.id !== note_id
  );

  const newMetadata = {
    ...currentMeta,
    evolution_notes: filtered,
  };

  const { error } = await supabase
    .from('patients')
    .update({
      metadata: newMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq('id', patient_id)
    .eq('tenant_id', profile.tenant.id);

  if (error) {
    return { ok: false as const, error: 'Error al eliminar nota' };
  }

  revalidatePath(`/dental/patients/${patient_id}`);
  return { ok: true as const };
}