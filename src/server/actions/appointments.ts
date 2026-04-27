'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';

// ─────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────
const moveSchema = z.object({
  id: z.string().uuid(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
});

const updateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    'scheduled',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'no_show',
  ]),
  cancellation_reason: z.string().optional().nullable(),
});

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function normalizeTime(t: string): string {
  // Asegura formato HH:MM:SS
  return t.length === 5 ? `${t}:00` : t;
}

function diffMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

// ─────────────────────────────────────────────────────────────
// moveAppointment — para drag & drop y resize
// ─────────────────────────────────────────────────────────────
export async function moveAppointment(input: z.infer<typeof moveSchema>) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: 'Datos inválidos' };
  }

  const { id, appointment_date, start_time, end_time } = parsed.data;

  const supabase = await createServerSupabase();

  // Verificar que la cita pertenece al tenant
  const { data: existing } = await supabase
    .from('appointments')
    .select('id, tenant_id, professional_id')
    .eq('id', id)
    .eq('tenant_id', profile.tenant.id)
    .single();

  if (!existing) {
    return { ok: false as const, error: 'Cita no encontrada' };
  }

  const startNorm = normalizeTime(start_time);
  const endNorm = normalizeTime(end_time);
  const duration = diffMinutes(startNorm, endNorm);

  if (duration <= 0) {
    return { ok: false as const, error: 'La duración debe ser mayor a 0' };
  }

  // Validar conflictos con el mismo profesional (mismo día, solapamiento)
  if (existing.professional_id) {
    const { data: conflicts } = await supabase
      .from('appointments')
      .select('id, start_time, end_time')
      .eq('tenant_id', profile.tenant.id)
      .eq('professional_id', existing.professional_id)
      .eq('appointment_date', appointment_date)
      .neq('id', id)
      .not('status', 'in', '(cancelled,no_show)');

    if (conflicts) {
      const overlaps = conflicts.some((c) => {
        const cStart = c.start_time as string;
        const cEnd = c.end_time as string;
        return startNorm < cEnd && endNorm > cStart;
      });

      if (overlaps) {
        return { ok: false as const, error: 'Conflicto de horario con otra cita' };
      }
    }
  }

  // Actualizar
  const { error: updateErr } = await supabase
    .from('appointments')
    .update({
      appointment_date,
      start_time: startNorm,
      end_time: endNorm,
      duration_minutes: duration,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('tenant_id', profile.tenant.id);

  if (updateErr) {
    return { ok: false as const, error: 'Error al actualizar la cita' };
  }

  revalidatePath('/dental/calendar');
  revalidatePath('/dental/dashboard');
  revalidatePath('/dental/appointments');

  return { ok: true as const };
}

// ─────────────────────────────────────────────────────────────
// updateAppointmentStatus
// ─────────────────────────────────────────────────────────────
export async function updateAppointmentStatus(
  input: z.infer<typeof updateStatusSchema>
) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const parsed = updateStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: 'Datos inválidos' };
  }

  const { id, status, cancellation_reason } = parsed.data;

  const supabase = await createServerSupabase();

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'cancelled' && cancellation_reason) {
    updates.cancellation_reason = cancellation_reason;
  }

  const { error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', profile.tenant.id);

  if (error) {
    return { ok: false as const, error: 'Error al actualizar estado' };
  }

  revalidatePath('/dental/calendar');
  revalidatePath('/dental/dashboard');
  revalidatePath('/dental/appointments');

  return { ok: true as const };
}