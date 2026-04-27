'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';
import type { ToothData, OdontogramData } from '@/lib/types/odontogram';

// ─────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────
const updateToothSchema = z.object({
  patient_id: z.string().uuid(),
  tooth: z.object({
    number: z.number().int().min(11).max(85),
    status: z.enum([
      'present',
      'missing',
      'extraction',
      'implant',
      'crown',
      'provisional',
      'unerupted',
      'fractured',
    ]),
    faces: z.record(
      z.string(),
      z.enum([
        'caries',
        'resin',
        'amalgam',
        'sealant',
        'endodontic',
        'inlay',
        'fracture',
        'restoration_to_replace',
      ])
    ),
    notes: z.string().max(2000).optional().nullable(),
  }),
});

const setViewModeSchema = z.object({
  patient_id: z.string().uuid(),
  view_mode: z.enum(['auto', 'adult', 'child', 'mixed']),
});

const resetSchema = z.object({
  patient_id: z.string().uuid(),
});

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
type Metadata = Record<string, unknown> & { odontogram?: OdontogramData };

async function loadMetadata(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  patientId: string,
  tenantId: string
): Promise<{ ok: boolean; metadata?: Metadata; error?: string }> {
  const { data, error } = await supabase
    .from('patients')
    .select('metadata')
    .eq('id', patientId)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) {
    return { ok: false, error: 'Paciente no encontrado' };
  }

  return {
    ok: true,
    metadata: (data.metadata || {}) as Metadata,
  };
}

// ─────────────────────────────────────────────────────────────
// updateTooth — guarda o actualiza una pieza completa
// ─────────────────────────────────────────────────────────────
export async function updateTooth(input: z.infer<typeof updateToothSchema>) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const parsed = updateToothSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: 'Datos invalidos' };
  }

  const { patient_id, tooth } = parsed.data;
  const supabase = await createServerSupabase();

  const loaded = await loadMetadata(supabase, patient_id, profile.tenant.id);
  if (!loaded.ok || !loaded.metadata) {
    return { ok: false as const, error: loaded.error || 'Error' };
  }

  const author =
    `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Usuario';

  const currentOdonto: OdontogramData = loaded.metadata.odontogram || { teeth: {} };

  const updatedTooth: ToothData = {
    ...tooth,
    notes: tooth.notes || undefined,
    faces: tooth.faces as ToothData['faces'],
    updated_at: new Date().toISOString(),
    updated_by: author,
  };

  const newOdonto: OdontogramData = {
    ...currentOdonto,
    teeth: {
      ...currentOdonto.teeth,
      [String(tooth.number)]: updatedTooth,
    },
    updated_at: new Date().toISOString(),
  };

  const newMetadata = {
    ...loaded.metadata,
    odontogram: newOdonto,
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
    return { ok: false as const, error: 'Error al guardar pieza' };
  }

  revalidatePath(`/dental/patients/${patient_id}`);
  return { ok: true as const };
}

// ─────────────────────────────────────────────────────────────
// setViewMode — cambia el modo de visualización
// ─────────────────────────────────────────────────────────────
export async function setOdontogramViewMode(
  input: z.infer<typeof setViewModeSchema>
) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const parsed = setViewModeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: 'Datos invalidos' };
  }

  const { patient_id, view_mode } = parsed.data;
  const supabase = await createServerSupabase();

  const loaded = await loadMetadata(supabase, patient_id, profile.tenant.id);
  if (!loaded.ok || !loaded.metadata) {
    return { ok: false as const, error: loaded.error || 'Error' };
  }

  const currentOdonto: OdontogramData = loaded.metadata.odontogram || { teeth: {} };

  const newOdonto: OdontogramData = {
    ...currentOdonto,
    view_mode,
    updated_at: new Date().toISOString(),
  };

  const newMetadata = {
    ...loaded.metadata,
    odontogram: newOdonto,
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
    return { ok: false as const, error: 'Error al cambiar vista' };
  }

  revalidatePath(`/dental/patients/${patient_id}`);
  return { ok: true as const };
}

// ─────────────────────────────────────────────────────────────
// resetOdontogram — borra todo el odontograma
// ─────────────────────────────────────────────────────────────
export async function resetOdontogram(input: z.infer<typeof resetSchema>) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: 'Datos invalidos' };
  }

  const { patient_id } = parsed.data;
  const supabase = await createServerSupabase();

  const loaded = await loadMetadata(supabase, patient_id, profile.tenant.id);
  if (!loaded.ok || !loaded.metadata) {
    return { ok: false as const, error: loaded.error || 'Error' };
  }

  const newMetadata = { ...loaded.metadata };
  delete newMetadata.odontogram;

  const { error } = await supabase
    .from('patients')
    .update({
      metadata: newMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq('id', patient_id)
    .eq('tenant_id', profile.tenant.id);

  if (error) {
    return { ok: false as const, error: 'Error al resetear' };
  }

  revalidatePath(`/dental/patients/${patient_id}`);
  return { ok: true as const };
}