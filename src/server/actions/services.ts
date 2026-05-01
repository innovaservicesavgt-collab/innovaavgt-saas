'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';

const serviceSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().min(2).max(200),
  description: z.string().max(500).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  price: z.number().min(0).max(999999),
  duration_minutes: z.number().int().positive().max(600),
  buffer_minutes: z.number().int().min(0).max(120).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  requires_confirmation: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export type ServiceInput = z.input<typeof serviceSchema>;

export async function saveService(input: ServiceInput) {
  console.log('[settings.services] saveService - input:', input);

  const profile = await getCurrentProfile();
  if (!profile?.tenant) return { ok: false as const, error: 'No autorizado' };

  if (profile.role?.name !== 'admin' && !profile.is_superadmin) {
    return { ok: false as const, error: 'Solo el administrador puede editar' };
  }

  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message || 'Datos invalidos' };
  }

  const data = parsed.data;
  const supabase = await createServerSupabase();

  if (data.id) {
    const payload: Record<string, unknown> = {
      name: data.name.trim(),
      price: data.price,
      duration_minutes: data.duration_minutes,
      is_active: data.is_active,
      requires_confirmation: data.requires_confirmation,
      updated_at: new Date().toISOString(),
    };
    if (data.description !== undefined) payload.description = data.description?.trim() || null;
    if (data.category) payload.category = data.category.trim();
    if (data.buffer_minutes !== undefined) payload.buffer_minutes = data.buffer_minutes;
    if (data.color) payload.color = data.color;

    const { error } = await supabase
      .from('services')
      .update(payload)
      .eq('id', data.id)
      .eq('tenant_id', profile.tenant.id);

    if (error) return { ok: false as const, error: error.message };
  } else {
    const payload: Record<string, unknown> = {
      tenant_id: profile.tenant.id,
      name: data.name.trim(),
      price: data.price,
      currency: 'GTQ',
      duration_minutes: data.duration_minutes,
      is_active: data.is_active,
      requires_confirmation: data.requires_confirmation,
    };
    if (data.description) payload.description = data.description.trim();
    if (data.category) payload.category = data.category.trim();
    if (data.buffer_minutes !== undefined) payload.buffer_minutes = data.buffer_minutes;
    if (data.color) payload.color = data.color;

    const { error } = await supabase.from('services').insert(payload);
    if (error) return { ok: false as const, error: error.message };
  }

  revalidatePath('/dental/settings');
  return { ok: true as const };
}

export async function toggleServiceActive(id: string, newState: boolean) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return { ok: false as const, error: 'No autorizado' };

  if (profile.role?.name !== 'admin' && !profile.is_superadmin) {
    return { ok: false as const, error: 'Solo el administrador puede editar' };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from('services')
    .update({ is_active: newState, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', profile.tenant.id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/dental/settings');
  return { ok: true as const };
}

export async function quickUpdateServicePrice(id: string, newPrice: number) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return { ok: false as const, error: 'No autorizado' };

  if (profile.role?.name !== 'admin' && !profile.is_superadmin) {
    return { ok: false as const, error: 'Solo el administrador puede editar' };
  }

  if (newPrice < 0 || newPrice > 999999) {
    return { ok: false as const, error: 'Precio invalido' };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from('services')
    .update({ price: newPrice, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', profile.tenant.id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/dental/settings');
  return { ok: true as const };
}

// ─── WRAPPERS DE COMPATIBILIDAD ──────────────────────────────
// Para que el componente viejo src/components/services/service-form.tsx
// siga funcionando sin tener que tocarlo.

export async function createService(input: ServiceInput) {
  return saveService({ ...input, id: null });
}

export async function updateService(id: string, input: ServiceInput) {
  return saveService({ ...input, id });
}
