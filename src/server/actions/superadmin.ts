'use server';

import { getAdminSupabase } from '@/lib/supabase/admin';
import { getCurrentProfile } from '@/lib/tenant';
import type { TenantSummary } from '@/lib/types/superadmin';

export async function getAllTenantsWithMetrics(): Promise<{
  ok: true;
  tenants: TenantSummary[];
} | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile?.is_superadmin) {
    return { ok: false as const, error: 'Solo superadmin' };
  }

  // Usar cliente admin que bypassa RLS
  const supabase = getAdminSupabase();

  const { data: tenants, error } = await supabase
    .from('tenants')
    .select(`
      id, name, slug, email, phone, vertical,
      is_active, is_onboarding_complete, onboarding_completed_at,
      tenant_status, payment_status, created_at,
      plan:plans!plan_id(code, name, monthly_price)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[superadmin] error tenants:', error);
    return { ok: false as const, error: error.message };
  }

  const tenantsTyped = tenants as Array<Record<string, unknown>> | null;
  if (!tenantsTyped || tenantsTyped.length === 0) {
    return { ok: true as const, tenants: [] };
  }

  const tenantIds = tenantsTyped.map((t) => t.id as string);

  // Cargar suscripciones (admin client bypasa RLS)
  const { data: subs, error: subsError } = await supabase
    .from('subscriptions')
    .select('tenant_id, status, trial_ends_at, current_period_end')
    .in('tenant_id', tenantIds);

  if (subsError) {
    console.error('[superadmin] error subs:', subsError);
  }

  console.log('[superadmin] subs cargadas:', subs?.length || 0);

  const subsMap = new Map();
  (subs || []).forEach((s) => {
    const sTyped = s as { tenant_id: string; status: string; trial_ends_at: string | null; current_period_end: string | null };
    subsMap.set(sTyped.tenant_id, {
      status: sTyped.status,
      trial_ends_at: sTyped.trial_ends_at,
      current_period_end: sTyped.current_period_end,
    });
  });

  // Contar metricas
  const userCounts = new Map<string, number>();
  const professionalCounts = new Map<string, number>();
  const patientCounts = new Map<string, number>();
  const appointmentCounts = new Map<string, number>();
  const serviceCounts = new Map<string, number>();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('tenant_id')
    .in('tenant_id', tenantIds);
  (profiles || []).forEach((p) => {
    const pTyped = p as { tenant_id: string | null };
    if (pTyped.tenant_id) userCounts.set(pTyped.tenant_id, (userCounts.get(pTyped.tenant_id) || 0) + 1);
  });

  const { data: professionals } = await supabase
    .from('professionals')
    .select('tenant_id')
    .in('tenant_id', tenantIds);
  (professionals || []).forEach((p) => {
    const pTyped = p as { tenant_id: string };
    professionalCounts.set(pTyped.tenant_id, (professionalCounts.get(pTyped.tenant_id) || 0) + 1);
  });

  try {
    const { data: patients } = await supabase
      .from('patients')
      .select('tenant_id')
      .in('tenant_id', tenantIds);
    (patients || []).forEach((p) => {
      const pTyped = p as { tenant_id: string };
      patientCounts.set(pTyped.tenant_id, (patientCounts.get(pTyped.tenant_id) || 0) + 1);
    });
  } catch {}

  try {
    const { data: appts } = await supabase
      .from('appointments')
      .select('tenant_id')
      .in('tenant_id', tenantIds);
    (appts || []).forEach((a) => {
      const aTyped = a as { tenant_id: string };
      appointmentCounts.set(aTyped.tenant_id, (appointmentCounts.get(aTyped.tenant_id) || 0) + 1);
    });
  } catch {}

  const { data: services } = await supabase
    .from('services')
    .select('tenant_id')
    .in('tenant_id', tenantIds);
  (services || []).forEach((s) => {
    const sTyped = s as { tenant_id: string };
    serviceCounts.set(sTyped.tenant_id, (serviceCounts.get(sTyped.tenant_id) || 0) + 1);
  });

  const result: TenantSummary[] = tenantsTyped.map((t) => {
    const tTyped = t as {
      id: string; name: string; slug: string; email: string; phone: string | null; vertical: string;
      is_active: boolean | null; is_onboarding_complete: boolean | null; onboarding_completed_at: string | null;
      tenant_status: string | null; payment_status: string | null; created_at: string | null;
      plan: { code: string; name: string; monthly_price: number } | { code: string; name: string; monthly_price: number }[] | null;
    };
    const planObj = Array.isArray(tTyped.plan) ? tTyped.plan[0] : tTyped.plan;
    const sub = subsMap.get(tTyped.id);

    return {
      id: tTyped.id,
      name: tTyped.name,
      slug: tTyped.slug,
      email: tTyped.email,
      phone: tTyped.phone,
      vertical: tTyped.vertical,
      is_active: tTyped.is_active ?? true,
      is_onboarding_complete: tTyped.is_onboarding_complete,
      onboarding_completed_at: tTyped.onboarding_completed_at,
      tenant_status: tTyped.tenant_status,
      payment_status: tTyped.payment_status,
      plan_code: planObj?.code || null,
      plan_name: planObj?.name || null,
      monthly_price: planObj?.monthly_price || null,
      subscription_status: sub?.status || null,
      trial_ends_at: sub?.trial_ends_at || null,
      current_period_end: sub?.current_period_end || null,
      created_at: tTyped.created_at || new Date().toISOString(),
      user_count: userCounts.get(tTyped.id) || 0,
      professional_count: professionalCounts.get(tTyped.id) || 0,
      patient_count: patientCounts.get(tTyped.id) || 0,
      appointment_count: appointmentCounts.get(tTyped.id) || 0,
      service_count: serviceCounts.get(tTyped.id) || 0,
    };
  });

  const trialCount = result.filter((t) => t.subscription_status === 'trial' || (t.trial_ends_at && new Date(t.trial_ends_at) > new Date())).length;
  console.log('[superadmin] retorno', result.length, 'tenants. En trial:', trialCount);

  return { ok: true as const, tenants: result };
}

// ─── SUSPENDER TENANT ────────────────────────────────────────

export async function suspendTenant(tenantId: string, reason: string) {
  const profile = await getCurrentProfile();
  if (!profile?.is_superadmin) {
    return { ok: false as const, error: 'Solo superadmin' };
  }

  if (!reason || reason.trim().length < 5) {
    return { ok: false as const, error: 'La razon debe tener al menos 5 caracteres' };
  }

  if (tenantId === profile.tenant?.id) {
    return { ok: false as const, error: 'No puedes suspender tu propio tenant' };
  }

  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from('tenants')
    .update({
      is_active: false,
      suspended_at: new Date().toISOString(),
      suspension_reason: reason.trim(),
      suspended_by: profile.id,
      tenant_status: 'suspended',
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenantId);

  if (error) {
    console.error('[superadmin.suspend] error:', error);
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}

// ─── REACTIVAR TENANT ────────────────────────────────────────

export async function reactivateTenant(tenantId: string) {
  const profile = await getCurrentProfile();
  if (!profile?.is_superadmin) {
    return { ok: false as const, error: 'Solo superadmin' };
  }

  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from('tenants')
    .update({
      is_active: true,
      reactivated_at: new Date().toISOString(),
      reactivated_by: profile.id,
      tenant_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenantId);

  if (error) {
    console.error('[superadmin.reactivate] error:', error);
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}

// ─── DETALLES DE UN TENANT ESPECIFICO ────────────────────────

export async function getTenantDetails(tenantId: string) {
  const profile = await getCurrentProfile();
  if (!profile?.is_superadmin) {
    return { ok: false as const, error: 'Solo superadmin' };
  }

  const supabase = getAdminSupabase();

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*, plan:plans!plan_id(code, name, monthly_price, currency, trial_days, max_users, max_branches, storage_mb)')
    .eq('id', tenantId)
    .single();

  if (tenantError || !tenant) {
    return { ok: false as const, error: 'Tenant no encontrado' };
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  let suspendedByProfile = null;
  const tenantData = tenant as { suspended_by?: string | null };
  if (tenantData.suspended_by) {
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', tenantData.suspended_by)
      .maybeSingle();
    suspendedByProfile = data as { first_name: string; last_name: string; email: string } | null;
  }

  const [profilesRes, professionalsRes, servicesRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('professionals').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('services').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
  ]);

  let patientCount = 0;
  let appointmentCount = 0;
  try {
    const { count: pCount } = await supabase.from('patients').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId);
    patientCount = pCount || 0;
  } catch {}
  try {
    const { count: aCount } = await supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId);
    appointmentCount = aCount || 0;
  } catch {}

  return {
    ok: true as const,
    tenant,
    subscription,
    suspendedByProfile,
    metrics: {
      users: profilesRes.count || 0,
      professionals: professionalsRes.count || 0,
      patients: patientCount,
      appointments: appointmentCount,
      services: servicesRes.count || 0,
    },
  };
}
