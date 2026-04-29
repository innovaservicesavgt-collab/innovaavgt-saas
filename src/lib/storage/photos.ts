// Helper para subir fotos a Supabase Storage

import { STORAGE_BUCKET } from '@/lib/types/photo';
import { createServerSupabase } from '@/lib/supabase/server';

// Sube un archivo y devuelve el path
export async function uploadPhoto(params: {
  tenantId: string;
  patientId: string;
  fileName: string;
  fileBuffer: Buffer;
  contentType: string;
}): Promise<{ ok: true; path: string; url: string } | { ok: false; error: string }> {
  const supabase = await createServerSupabase();

  // Path: tenant_id/patients/patient_id/photos/timestamp_random.ext
  const ext = params.fileName.split('.').pop() || 'jpg';
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  const storagePath = params.tenantId + '/patients/' + params.patientId + '/photos/' + timestamp + '_' + random + '.' + safeExt;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, params.fileBuffer, {
      contentType: params.contentType,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('[uploadPhoto] error:', uploadError);
    return { ok: false, error: 'Error al subir: ' + uploadError.message };
  }

  // Obtener URL publica (el bucket es publico)
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  return {
    ok: true,
    path: storagePath,
    url: urlData.publicUrl,
  };
}

// Elimina un archivo del storage
export async function deletePhotoFromStorage(storagePath: string): Promise<boolean> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);

  if (error) {
    console.error('[deletePhotoFromStorage] error:', error);
    return false;
  }
  return true;
}
