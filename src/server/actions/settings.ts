'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';

const generalSchema = z.object({
  name: z.string().min(2).max(200),
  address: z.string().max(500).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().max(200).optional().nullable().or(z.literal('')),
});

export async function updateGeneralSettings(input: z.input<typeof generalSchema>) {
  console.log('[settings.general] inicio - input:', input);

  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    console.error('[settings.general] no profile/tenant');
    return { ok: false as const, error: 'No autorizado' };
  }

  console.log('[settings.general] profile role:', profile.role?.name, 'tenant:', profile.tenant.id);

  if (profile.role?.name !== 'admin' && !profile.is_superadmin) {
    console.error('[settings.general] role no admin:', profile.role?.name);
    return { ok: false as const, error: 'Solo el administrador puede editar (rol actual: ' + (profile.role?.name || 'desconocido') + ')' };
  }

  const parsed = generalSchema.safeParse(input);
  if (!parsed.success) {
    console.error('[settings.general] schema error:', parsed.error.issues);
    return { ok: false as const, error: parsed.error.issues[0]?.message || 'Datos invalidos' };
  }

  console.log('[settings.general] parsed ok, ejecutando update...');

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from('tenants')
    .update({
      name: parsed.data.name.trim(),
      brand_name: parsed.data.name.trim(),
      address: parsed.data.address?.trim() || null,
      phone: parsed.data.phone?.trim() || null,
      email: parsed.data.email?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.tenant.id);

  if (error) {
    console.error('[settings.general] supabase error:', error);
    return { ok: false as const, error: error.message };
  }

  console.log('[settings.general] update exitoso');

  revalidatePath('/dental/settings');
  return { ok: true as const };
}

const brandingSchema = z.object({
  logo_url: z.string().max(1000).optional().nullable(),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export async function updateBrandingSettings(input: z.input<typeof brandingSchema>) {
  console.log('[settings.branding] inicio - input:', input);

  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    console.error('[settings.branding] no profile/tenant');
    return { ok: false as const, error: 'No autorizado' };
  }

  console.log('[settings.branding] profile role:', profile.role?.name);

  if (profile.role?.name !== 'admin' && !profile.is_superadmin) {
    console.error('[settings.branding] role no admin:', profile.role?.name);
    return { ok: false as const, error: 'Solo el administrador puede editar (rol actual: ' + (profile.role?.name || 'desconocido') + ')' };
  }

  const parsed = brandingSchema.safeParse(input);
  if (!parsed.success) {
    console.error('[settings.branding] schema error:', parsed.error.issues);
    return { ok: false as const, error: parsed.error.issues[0]?.message || 'Datos invalidos' };
  }

  console.log('[settings.branding] parsed ok, ejecutando update...');

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from('tenants')
    .update({
      logo_url: parsed.data.logo_url || null,
      brand_logo_url: parsed.data.logo_url || null,
      primary_color: parsed.data.primary_color,
      brand_primary_color: parsed.data.primary_color,
      secondary_color: parsed.data.secondary_color,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.tenant.id);

  if (error) {
    console.error('[settings.branding] supabase error:', error);
    return { ok: false as const, error: error.message };
  }

  console.log('[settings.branding] update exitoso');

  revalidatePath('/dental/settings');
  return { ok: true as const };
}

export async function uploadSettingsImage(formData: FormData, kind: 'logo' | 'photo') {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return { ok: false as const, error: 'No autorizado' };

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return { ok: false as const, error: 'Archivo invalido' };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { ok: false as const, error: 'Maximo 5MB' };
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { ok: false as const, error: 'Solo JPG, PNG, WEBP' };
  }

  const supabase = await createServerSupabase();
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now();
  const storagePath = profile.tenant.id + '/branding/' + kind + '_' + timestamp + '.' + ext;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from('patient-files')
    .upload(storagePath, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    return { ok: false as const, error: 'Error al subir: ' + uploadError.message };
  }

  const { data: urlData } = supabase.storage.from('patient-files').getPublicUrl(storagePath);
  return { ok: true as const, url: urlData.publicUrl };
}
