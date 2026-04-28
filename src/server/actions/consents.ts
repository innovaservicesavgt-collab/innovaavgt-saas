'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';

const createConsentSchema = z.object({
  patient_id: z.string().uuid(),
  professional_id: z.string().uuid().nullable().optional(),
  treatment_plan_id: z.string().uuid().nullable().optional(),
  treatment_type: z.string().min(1).max(200),
  treatment_description: z.string().min(10).max(5000),
  risks: z.string().max(5000).optional().nullable(),
  alternatives: z.string().max(3000).optional().nullable(),
  estimated_cost: z.number().optional().nullable(),
  estimated_duration: z.string().max(200).optional().nullable(),
  legal_text: z.string().min(50),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreateConsentInput = z.input<typeof createConsentSchema>;

const signConsentSchema = z.object({
  consent_id: z.string().uuid(),
  signed_by_name: z.string().min(2).max(200),
  signed_by_document: z.string().max(50).optional().nullable(),
});

function clean(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = String(v).trim();
  return t.length === 0 ? null : t;
}

export async function createConsent(input: CreateConsentInput) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const parsed = createConsentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message || 'Datos invalidos',
    };
  }

  const data = parsed.data;
  const supabase = await createServerSupabase();

  const { data: numData } = await supabase.rpc('generate_consent_number', {
    p_tenant_id: profile.tenant.id,
  });

  const payload: Record<string, unknown> = {
    tenant_id: profile.tenant.id,
    patient_id: data.patient_id,
    treatment_type: data.treatment_type.trim(),
    treatment_description: data.treatment_description.trim(),
    legal_text: data.legal_text.trim(),
    is_signed: false,
    status: 'pending',
    issued_at: new Date().toISOString(),
  };

  if (numData) payload.consent_number = numData;
  if (data.professional_id) payload.professional_id = data.professional_id;
  if (data.treatment_plan_id) payload.treatment_plan_id = data.treatment_plan_id;
  const cleanRisks = clean(data.risks);
  if (cleanRisks) payload.risks = cleanRisks;
  const cleanAlt = clean(data.alternatives);
  if (cleanAlt) payload.alternatives = cleanAlt;
  if (data.estimated_cost && data.estimated_cost > 0) payload.estimated_cost = data.estimated_cost;
  const cleanDur = clean(data.estimated_duration);
  if (cleanDur) payload.estimated_duration = cleanDur;
  const cleanNotes = clean(data.notes);
  if (cleanNotes) payload.notes = cleanNotes;

  console.log('[createConsent] payload keys:', Object.keys(payload));

  const { data: created, error } = await supabase
    .from('consents')
    .insert(payload)
    .select('id')
    .single();

  if (error || !created) {
    console.error('[createConsent] error:', error);
    return {
      ok: false as const,
      error: 'Error: ' + (error?.message || ''),
    };
  }

  revalidatePath('/dental/patients/' + data.patient_id + '/documents');
  return { ok: true as const, id: created.id as string };
}

export async function signConsent(input: z.input<typeof signConsentSchema>) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return { ok: false as const, error: 'No autorizado' };

  const parsed = signConsentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: 'Datos invalidos' };
  }

  const supabase = await createServerSupabase();
  const updateData: Record<string, unknown> = {
    is_signed: true,
    signed_at: new Date().toISOString(),
    signed_by_name: parsed.data.signed_by_name.trim(),
    status: 'signed',
    updated_at: new Date().toISOString(),
  };
  const cleanDoc = clean(parsed.data.signed_by_document);
  if (cleanDoc) updateData.signed_by_document = cleanDoc;

  const { error } = await supabase
    .from('consents')
    .update(updateData)
    .eq('id', parsed.data.consent_id)
    .eq('tenant_id', profile.tenant.id);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath('/dental/consents/' + parsed.data.consent_id);
  return { ok: true as const };
}

export async function cancelConsent(id: string, reason?: string) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return { ok: false as const, error: 'No autorizado' };

  const supabase = await createServerSupabase();
  const updateData: Record<string, unknown> = {
    status: 'cancelled',
    updated_at: new Date().toISOString(),
  };
  if (reason) updateData.notes = reason;

  const { error } = await supabase
    .from('consents')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', profile.tenant.id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/dental/consents/' + id);
  return { ok: true as const };
}
