'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';

const medicationSchema = z.object({
  name: z.string().min(1).max(200),
  presentation: z.string().max(200).optional().default(''),
  dose: z.string().max(100).optional().default(''),
  frequency: z.string().max(100).optional().default(''),
  duration: z.string().max(100).optional().default(''),
  instructions: z.string().max(500).optional().default(''),
});

const createPrescriptionSchema = z.object({
  patient_id: z.string().uuid(),
  professional_id: z.string().uuid().nullable().optional(),
  diagnosis: z.string().max(2000).optional().nullable(),
  medications: z.array(medicationSchema).min(1, 'Debe agregar al menos un medicamento'),
  recommendations: z.string().max(5000).optional().nullable(),
  next_visit_date: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreatePrescriptionInput = z.input<typeof createPrescriptionSchema>;

function clean(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = String(v).trim();
  return t.length === 0 ? null : t;
}

export async function createPrescription(input: CreatePrescriptionInput) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const parsed = createPrescriptionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message || 'Datos invalidos',
    };
  }

  const data = parsed.data;
  const supabase = await createServerSupabase();

  const { data: numData } = await supabase.rpc('generate_prescription_number', {
    p_tenant_id: profile.tenant.id,
  });

  const payload: Record<string, unknown> = {
    tenant_id: profile.tenant.id,
    patient_id: data.patient_id,
    medications: data.medications,
    status: 'active',
    issued_at: new Date().toISOString(),
  };

  if (numData) payload.prescription_number = numData;
  if (data.professional_id) payload.professional_id = data.professional_id;
  const cleanDiag = clean(data.diagnosis);
  if (cleanDiag) payload.diagnosis = cleanDiag;
  const cleanRec = clean(data.recommendations);
  if (cleanRec) payload.recommendations = cleanRec;
  const cleanNext = clean(data.next_visit_date);
  if (cleanNext) payload.next_visit_date = cleanNext;
  const cleanNotes = clean(data.notes);
  if (cleanNotes) payload.notes = cleanNotes;

  console.log('[createPrescription] payload keys:', Object.keys(payload));

  const { data: created, error } = await supabase
    .from('prescriptions')
    .insert(payload)
    .select('id')
    .single();

  if (error || !created) {
    console.error('[createPrescription] error:', error);
    return {
      ok: false as const,
      error: 'Error: ' + (error?.message || 'desconocido'),
    };
  }

  revalidatePath('/dental/patients/' + data.patient_id + '/documents');
  return { ok: true as const, id: created.id as string };
}

export async function cancelPrescription(id: string, reason?: string) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return { ok: false as const, error: 'No autorizado' };

  const supabase = await createServerSupabase();
  const updateData: Record<string, unknown> = {
    status: 'cancelled',
    updated_at: new Date().toISOString(),
  };
  if (reason) updateData.notes = reason;

  const { error } = await supabase
    .from('prescriptions')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', profile.tenant.id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/dental/prescriptions/' + id);
  return { ok: true as const };
}
