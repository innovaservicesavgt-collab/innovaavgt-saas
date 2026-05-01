'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';

const professionalSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  title: z.string().max(20).optional().nullable(),
  first_name: z.string().min(2).max(100),
  last_name: z.string().min(2).max(100),
  specialty: z.string().max(200).optional().nullable(),
  email: z.string().email().max(200).optional().nullable().or(z.literal('')),
  phone: z.string().max(50).optional().nullable(),
  license_number: z.string().max(100).optional().nullable(),
  photo_url: z.string().max(1000).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  is_active: z.boolean().default(true),
});

export type ProfessionalInput = z.input<typeof professionalSchema>;

export async function saveProfessional(input: ProfessionalInput) {
  console.log('[settings.team] saveProfessional - input:', input);

  const profile = await getCurrentProfile();
  if (!profile?.tenant) return { ok: false as const, error: 'No autorizado' };

  if (profile.role?.name !== 'admin' && !profile.is_superadmin) {
    return { ok: false as const, error: 'Solo el administrador puede editar' };
  }

  const parsed = professionalSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message || 'Datos invalidos' };
  }

  const data = parsed.data;
  const supabase = await createServerSupabase();

  if (data.id) {
    // UPDATE
    const payload: Record<string, unknown> = {
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      is_active: data.is_active,
      updated_at: new Date().toISOString(),
    };
    if (data.title) payload.title = data.title;
    if (data.specialty) payload.specialty = data.specialty;
    if (data.email) payload.email = data.email.trim().toLowerCase();
    if (data.phone) payload.phone = data.phone.trim();
    if (data.license_number) payload.license_number = data.license_number.trim();
    if (data.photo_url) payload.photo_url = data.photo_url;
    if (data.color) payload.color = data.color;

    const { error } = await supabase
      .from('professionals')
      .update(payload)
      .eq('id', data.id)
      .eq('tenant_id', profile.tenant.id);

    if (error) return { ok: false as const, error: error.message };
  } else {
    // INSERT
    const payload: Record<string, unknown> = {
      tenant_id: profile.tenant.id,
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      is_active: data.is_active,
    };
    if (data.title) payload.title = data.title;
    if (data.specialty) payload.specialty = data.specialty;
    if (data.email) payload.email = data.email.trim().toLowerCase();
    if (data.phone) payload.phone = data.phone.trim();
    if (data.license_number) payload.license_number = data.license_number.trim();
    if (data.photo_url) payload.photo_url = data.photo_url;
    if (data.color) payload.color = data.color;

    const { error } = await supabase.from('professionals').insert(payload);
    if (error) return { ok: false as const, error: error.message };
  }

  revalidatePath('/dental/settings');
  return { ok: true as const };
}

export async function toggleProfessionalActive(id: string, newState: boolean) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return { ok: false as const, error: 'No autorizado' };

  if (profile.role?.name !== 'admin' && !profile.is_superadmin) {
    return { ok: false as const, error: 'Solo el administrador puede editar' };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from('professionals')
    .update({ is_active: newState, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', profile.tenant.id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/dental/settings');
  return { ok: true as const };
}
