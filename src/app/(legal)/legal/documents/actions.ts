'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireVertical } from '@/lib/vertical';
import { documentMetaSchema } from './schema';
import { ActionResult } from './types';
import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from './constants';
import { createSystemAction } from '@/lib/legal/system-actions';


/**
 * Subir un documento a Supabase Storage y guardar metadata en BD
 * 
 * Estructura de paths: {tenant_id}/{case_id}/{timestamp}-{nombre-sanitizado}.ext
 */
export async function uploadDocument(formData: FormData): Promise<ActionResult> {
  try {
    const profile = await requireVertical('legal');

    // Extraer campos del FormData
    const file = formData.get('file') as File | null;
    const nombre = formData.get('nombre') as string | null;
    const tipo = formData.get('tipo') as string | null;
    const case_id = formData.get('case_id') as string | null;

    // Validar archivo
    if (!file) {
      return { success: false, error: 'No se recibió ningún archivo' };
    }

    if (file.size === 0) {
      return { success: false, error: 'El archivo está vacío' };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { 
        success: false, 
        error: `El archivo excede el límite de ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB` 
      };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return { 
        success: false, 
        error: `Tipo de archivo no permitido: ${file.type}` 
      };
    }

    // Validar metadata
    const parsed = documentMetaSchema.safeParse({ nombre, tipo, case_id });
    if (!parsed.success) {
      return { 
        success: false, 
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos' 
      };
    }

    const supabase = await createServerSupabase();

    // Sanitizar nombre y construir path único
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() ?? 'bin';
    const nombreSanitizado = parsed.data.nombre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
    
    const storagePath = `${profile.tenant_id}/${parsed.data.case_id}/${timestamp}-${nombreSanitizado}.${extension}`;

    // Subir archivo a Storage
    const { error: uploadError } = await supabase.storage
      .from('legal-documents')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError);
      return { 
        success: false, 
        error: `Error al subir archivo: ${uploadError.message}` 
      };
    }

    // Guardar metadata en BD
    const { data: inserted, error: dbError } = await supabase
      .from('legal_documents')
      .insert({
        tenant_id: profile.tenant_id,
        case_id: parsed.data.case_id,
        nombre: parsed.data.nombre.trim(),
        tipo: parsed.data.tipo,
        storage_path: storagePath,
        tamano_bytes: file.size,
        mime_type: file.type,
        uploaded_by: profile.id,
      })
      .select('id')
      .single();

    if (dbError || !inserted) {
      // Si falla BD, borrar el archivo que subimos
      await supabase.storage.from('legal-documents').remove([storagePath]);
      console.error('Error saving document metadata:', dbError);
      return { 
        success: false, 
        error: 'No se pudo guardar el documento' 
      };
    }

    revalidatePath('/legal/documents');
    revalidatePath(`/legal/cases/${parsed.data.case_id}`);
    
    return { 
      success: true, 
      message: 'Documento subido exitosamente',
      documentId: inserted.id,
    };
  } catch (err) {
    console.error('Unexpected error in uploadDocument:', err);
    return { success: false, error: 'Error inesperado al subir el documento' };
  }
}

/**
 * Generar URL firmada de descarga (temporal, 60 segundos)
 * NOTA: No retornamos URL pública porque el bucket es privado.
 * La URL firmada es válida solo 60 segundos y solo para el usuario actual.
 */
export async function getDownloadUrl(documentId: string): Promise<ActionResult> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    // Obtener el path del documento (las policies RLS garantizan aislamiento)
    const { data: doc, error } = await supabase
      .from('legal_documents')
      .select('storage_path, nombre, mime_type')
      .eq('id', documentId)
      .single();

    if (error || !doc) {
      return { success: false, error: 'Documento no encontrado' };
    }

    // Generar URL firmada válida 60 segundos
    const { data: urlData, error: urlError } = await supabase.storage
      .from('legal-documents')
      .createSignedUrl(doc.storage_path, 60, {
        download: doc.nombre, // Fuerza descarga con nombre original
      });

    if (urlError || !urlData) {
      return { success: false, error: 'No se pudo generar el enlace de descarga' };
    }

    return { 
      success: true, 
      message: 'URL generada',
      url: urlData.signedUrl 
    };
  } catch (err) {
    console.error('Unexpected error in getDownloadUrl:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * URL firmada para previsualizar (sin forzar descarga)
 * Útil para PDFs e imágenes que se pueden ver en el navegador
 */
export async function getPreviewUrl(documentId: string): Promise<ActionResult> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { data: doc, error } = await supabase
      .from('legal_documents')
      .select('storage_path, mime_type')
      .eq('id', documentId)
      .single();

    if (error || !doc) {
      return { success: false, error: 'Documento no encontrado' };
    }

    const { data: urlData, error: urlError } = await supabase.storage
      .from('legal-documents')
      .createSignedUrl(doc.storage_path, 300); // 5 minutos para preview

    if (urlError || !urlData) {
      return { success: false, error: 'No se pudo generar preview' };
    }

    return { 
      success: true, 
      message: 'URL generada',
      url: urlData.signedUrl 
    };
  } catch (err) {
    console.error('Unexpected error in getPreviewUrl:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * Eliminar documento (archivo físico + registro BD)
 */
export async function deleteDocument(documentId: string): Promise<ActionResult> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    // Obtener el path antes de borrar
    const { data: doc, error: fetchError } = await supabase
      .from('legal_documents')
      .select('storage_path, case_id')
      .eq('id', documentId)
      .single();

    if (fetchError || !doc) {
      return { success: false, error: 'Documento no encontrado' };
    }

    // Borrar archivo de Storage
    const { error: storageError } = await supabase.storage
      .from('legal-documents')
      .remove([doc.storage_path]);

    if (storageError) {
      console.error('Error removing from storage:', storageError);
      // Continuar de todas formas para borrar el registro
    }

    // Borrar registro de BD
    const { error: dbError } = await supabase
      .from('legal_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      return { success: false, error: 'No se pudo eliminar el documento' };
    }

    revalidatePath('/legal/documents');
    revalidatePath(`/legal/cases/${doc.case_id}`);

    return { success: true, message: 'Documento eliminado' };
  } catch (err) {
    console.error('Unexpected error in deleteDocument:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * Actualizar metadata del documento (nombre o tipo, no el archivo)
 */
export async function updateDocumentMeta(
  documentId: string,
  nombre: string,
  tipo: string
): Promise<ActionResult> {
  try {
    await requireVertical('legal');

    const parsed = documentMetaSchema.safeParse({ 
      nombre, 
      tipo, 
      case_id: '00000000-0000-0000-0000-000000000000', // placeholder, no lo actualizamos
    });

    if (!parsed.success) {
      return { 
        success: false, 
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos' 
      };
    }

    const supabase = await createServerSupabase();

    const { data: doc, error } = await supabase
      .from('legal_documents')
      .update({
        nombre: parsed.data.nombre.trim(),
        tipo: parsed.data.tipo,
      })
      .eq('id', documentId)
      .select('case_id')
      .single();

    if (error || !doc) {
      return { success: false, error: 'No se pudo actualizar el documento' };
    }

    revalidatePath('/legal/documents');
    revalidatePath(`/legal/cases/${doc.case_id}`);

    return { success: true, message: 'Documento actualizado' };
  } catch (err) {
    console.error('Unexpected error in updateDocumentMeta:', err);
    return { success: false, error: 'Error inesperado' };
  }
}