'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';

// ─────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────
const upsertServiceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Nombre requerido').max(200),
  description: z.string().max(2000).optional().nullable(),
  duration_minutes: z.number().int().min(5).max(480),
  price: z.number().min(0).optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  buffer_minutes: z.number().int().min(0).max(120).optional().nullable(),
  requires_confirmation: z.boolean().optional().nullable(),
  is_active: z.boolean().optional(),
});

const toggleSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean(),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});

function clean(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

// ─────────────────────────────────────────────────────────────
// createService
// ─────────────────────────────────────────────────────────────
export async function createService(input: z.infer<typeof upsertServiceSchema>) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const parsed = upsertServiceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message || 'Datos invalidos',
    };
  }

  const supabase = await createServerSupabase();
  const data = parsed.data;

  const { data: created, error } = await supabase
    .from('services')
    .insert({
      tenant_id: profile.tenant.id,
      name: data.name.trim(),
      description: clean(data.description),
      duration_minutes: data.duration_minutes,
      price: data.price ?? null,
      currency: 'GTQ',
      category: clean(data.category),
      color: clean(data.color) || '#10B981',
      buffer_minutes: data.buffer_minutes ?? 0,
      requires_confirmation: data.requires_confirmation ?? false,
      is_active: data.is_active ?? true,
    })
    .select('id')
    .single();

  if (error || !created) {
    return { ok: false as const, error: 'Error al crear servicio' };
  }

  revalidatePath('/dental/services');
  return { ok: true as const, id: created.id };
}

// ─────────────────────────────────────────────────────────────
// updateService
// ─────────────────────────────────────────────────────────────
export async function updateService(input: z.infer<typeof upsertServiceSchema>) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const parsed = upsertServiceSchema.safeParse(input);
  if (!parsed.success || !parsed.data.id) {
    return {
      ok: false as const,
      error: parsed.success
        ? 'ID requerido'
        : parsed.error.issues[0]?.message || 'Datos invalidos',
    };
  }

  const supabase = await createServerSupabase();
  const { id, ...data } = parsed.data;

  const { error } = await supabase
    .from('services')
    .update({
      name: data.name.trim(),
      description: clean(data.description),
      duration_minutes: data.duration_minutes,
      price: data.price ?? null,
      category: clean(data.category),
      color: clean(data.color) || '#10B981',
      buffer_minutes: data.buffer_minutes ?? 0,
      requires_confirmation: data.requires_confirmation ?? false,
      is_active: data.is_active ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('tenant_id', profile.tenant.id);

  if (error) {
    return { ok: false as const, error: 'Error al actualizar servicio' };
  }

  revalidatePath('/dental/services');
  revalidatePath(`/dental/services/${id}/edit`);
  return { ok: true as const };
}

// ─────────────────────────────────────────────────────────────
// toggleServiceActive
// ─────────────────────────────────────────────────────────────
export async function toggleServiceActive(input: z.infer<typeof toggleSchema>) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const parsed = toggleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: 'Datos invalidos' };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from('services')
    .update({
      is_active: parsed.data.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
    .eq('tenant_id', profile.tenant.id);

  if (error) {
    return { ok: false as const, error: 'Error al cambiar estado' };
  }

  revalidatePath('/dental/services');
  return { ok: true as const };
}

// ─────────────────────────────────────────────────────────────
// deleteService (solo si nunca se uso en cotizaciones o citas)
// ─────────────────────────────────────────────────────────────
export async function deleteService(input: z.infer<typeof deleteSchema>) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: 'ID invalido' };
  }

  const supabase = await createServerSupabase();

  // Verificar si esta en uso
  const { count: appointmentCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('service_id', parsed.data.id);

  const { count: itemCount } = await supabase
    .from('quotation_items')
    .select('*', { count: 'exact', head: true })
    .eq('service_id', parsed.data.id);

  if ((appointmentCount || 0) > 0 || (itemCount || 0) > 0) {
    return {
      ok: false as const,
      error:
        'No se puede eliminar: el servicio esta en uso en citas o cotizaciones. Mejor desactivalo.',
    };
  }

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', parsed.data.id)
    .eq('tenant_id', profile.tenant.id);

  if (error) {
    return { ok: false as const, error: 'Error al eliminar servicio' };
  }

  revalidatePath('/dental/services');
  return { ok: true as const };
}