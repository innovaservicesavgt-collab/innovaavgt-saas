'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getCurrentProfile } from '@/lib/tenant';
import { DAY_TO_INT, type ScheduleData } from '@/lib/types/onboarding';

const step1Schema = z.object({
  name: z.string().min(2).max(200),
  address: z.string().max(500).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  logo_url: z.string().max(1000).optional().nullable(),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#2563eb'),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#1e40af'),
});

export async function saveOnboardingStep1(input: z.input<typeof step1Schema>) {
  console.log('[onboarding.step1] >>> INICIO');
  const profile = await getCurrentProfile();
  if (!profile?.tenant) { console.error('[onboarding.step1] sin tenant'); return { ok: false as const, error: 'No autorizado' }; }

  const parsed = step1Schema.safeParse(input);
  if (!parsed.success) { console.error('[onboarding.step1] parse error:', parsed.error.issues); return { ok: false as const, error: parsed.error.issues[0]?.message || 'Datos invalidos' }; }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from('tenants')
    .update({
      name: parsed.data.name.trim(),
      brand_name: parsed.data.name.trim(),
      address: parsed.data.address?.trim() || null,
      phone: parsed.data.phone?.trim() || null,
      logo_url: parsed.data.logo_url || null,
      brand_logo_url: parsed.data.logo_url || null,
      primary_color: parsed.data.primary_color,
      brand_primary_color: parsed.data.primary_color,
      secondary_color: parsed.data.secondary_color,
      onboarding_step: 2,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.tenant.id)
    .select('id, onboarding_step');

  if (error) { console.error('[onboarding.step1] db error:', error); return { ok: false as const, error: error.message }; }
  if (!data || data.length === 0) { console.error('[onboarding.step1] update afecto 0 filas'); return { ok: false as const, error: 'Tenant no encontrado' }; }

  console.log('[onboarding.step1] OK');
  revalidatePath('/onboarding');
  return { ok: true as const };
}

const step2Schema = z.object({
  title: z.string().max(20).optional().nullable(),
  first_name: z.string().min(2).max(100),
  last_name: z.string().min(2).max(100),
  specialty: z.string().max(200).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().max(50).optional().nullable(),
  license_number: z.string().max(100).optional().nullable(),
  photo_url: z.string().max(1000).optional().nullable(),
});

export async function saveOnboardingStep2(input: z.input<typeof step2Schema>) {
  console.log('[onboarding.step2] >>> INICIO');
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return { ok: false as const, error: 'No autorizado' };

  const parsed = step2Schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message || 'Datos invalidos' };

  const supabase = getAdminSupabase();
  const { data: existing } = await supabase.from('professionals').select('id').eq('tenant_id', profile.tenant.id).eq('profile_id', profile.id).maybeSingle();

  const payload: Record<string, unknown> = {
    tenant_id: profile.tenant.id,
    profile_id: profile.id,
    first_name: parsed.data.first_name.trim(),
    last_name: parsed.data.last_name.trim(),
    is_active: true,
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.title) payload.title = parsed.data.title.trim();
  if (parsed.data.specialty) payload.specialty = parsed.data.specialty.trim();
  if (parsed.data.email) payload.email = parsed.data.email.trim().toLowerCase();
  if (parsed.data.phone) payload.phone = parsed.data.phone.trim();
  if (parsed.data.license_number) payload.license_number = parsed.data.license_number.trim();
  if (parsed.data.photo_url) payload.photo_url = parsed.data.photo_url;

  if (existing) {
    const { error } = await supabase.from('professionals').update(payload).eq('id', (existing as { id: string }).id);
    if (error) { console.error('[onboarding.step2] update error:', error); return { ok: false as const, error: error.message }; }
  } else {
    const { error } = await supabase.from('professionals').insert(payload);
    if (error) { console.error('[onboarding.step2] insert error:', error); return { ok: false as const, error: error.message }; }
  }

  const { data: stepData, error: stepError } = await supabase
    .from('tenants').update({ onboarding_step: 3, updated_at: new Date().toISOString() })
    .eq('id', profile.tenant.id).select('onboarding_step');

  if (stepError || !stepData || stepData.length === 0) { console.error('[onboarding.step2] step error:', stepError); return { ok: false as const, error: 'No se pudo avanzar' }; }
  console.log('[onboarding.step2] OK');
  revalidatePath('/onboarding');
  return { ok: true as const };
}

const serviceSchema = z.object({
  template_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  category: z.string().max(100).optional().nullable(),
  price: z.number().min(0),
  duration_minutes: z.number().int().positive(),
});
const step3Schema = z.object({ services: z.array(serviceSchema).min(3, 'Selecciona al menos 3 servicios') });

export async function saveOnboardingStep3(input: z.input<typeof step3Schema>) {
  console.log('[onboarding.step3] >>> INICIO con', input.services?.length, 'servicios');
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return { ok: false as const, error: 'No autorizado' };

  const parsed = step3Schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message || 'Datos invalidos' };

  const supabase = getAdminSupabase();
  const { data: existingServices } = await supabase.from('services').select('id').eq('tenant_id', profile.tenant.id);
  if (existingServices && existingServices.length > 0) {
    const ids = (existingServices as Array<{ id: string }>).map((s) => s.id);
    const { count: usedInAppts } = await supabase.from('appointments').select('id', { count: 'exact', head: true }).in('service_id', ids);
    const { count: usedInQuotes } = await supabase.from('quotation_items').select('id', { count: 'exact', head: true }).in('service_id', ids);
    if ((usedInAppts || 0) === 0 && (usedInQuotes || 0) === 0) {
      await supabase.from('services').delete().eq('tenant_id', profile.tenant.id);
    }
  }

  const inserts = parsed.data.services.map((s) => ({
    tenant_id: profile.tenant!.id,
    name: s.name.trim(),
    category: s.category?.trim() || null,
    price: s.price,
    currency: 'GTQ',
    duration_minutes: s.duration_minutes,
    buffer_minutes: 0,
    is_active: true,
    requires_confirmation: false,
  }));
  const { error: insertError } = await supabase.from('services').insert(inserts);
  if (insertError) { console.error('[onboarding.step3] insert error:', insertError); return { ok: false as const, error: insertError.message }; }

  const { data: stepData, error: stepError } = await supabase
    .from('tenants').update({ onboarding_step: 4, updated_at: new Date().toISOString() })
    .eq('id', profile.tenant.id).select('onboarding_step');
  if (stepError || !stepData || stepData.length === 0) return { ok: false as const, error: 'No se pudo avanzar' };
  console.log('[onboarding.step3] OK');
  revalidatePath('/onboarding');
  return { ok: true as const };
}

const step4Schema = z.object({
  days: z.object({ monday: z.boolean(), tuesday: z.boolean(), wednesday: z.boolean(), thursday: z.boolean(), friday: z.boolean(), saturday: z.boolean(), sunday: z.boolean() }),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  has_lunch_break: z.boolean(),
  lunch_start: z.string().regex(/^\d{2}:\d{2}$/),
  lunch_end: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function saveOnboardingStep4(input: ScheduleData) {
  console.log('[onboarding.step4] >>> INICIO');
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return { ok: false as const, error: 'No autorizado' };

  const parsed = step4Schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message || 'Datos invalidos' };

  const data = parsed.data;
  const activeDays = (Object.keys(data.days) as Array<keyof typeof data.days>).filter((d) => data.days[d]);
  if (activeDays.length === 0) return { ok: false as const, error: 'Selecciona al menos un dia' };

  const supabase = getAdminSupabase();
  await supabase.from('schedules').delete().eq('tenant_id', profile.tenant.id).is('professional_id', null);

  const inserts: Record<string, unknown>[] = [];
  for (const day of activeDays) {
    const dayInt = DAY_TO_INT[day];
    if (data.has_lunch_break) {
      inserts.push({ tenant_id: profile.tenant.id, professional_id: null, day_of_week: dayInt, start_time: data.start_time + ':00', end_time: data.lunch_start + ':00', is_active: true, slot_duration: 30 });
      inserts.push({ tenant_id: profile.tenant.id, professional_id: null, day_of_week: dayInt, start_time: data.lunch_end + ':00', end_time: data.end_time + ':00', is_active: true, slot_duration: 30 });
    } else {
      inserts.push({ tenant_id: profile.tenant.id, professional_id: null, day_of_week: dayInt, start_time: data.start_time + ':00', end_time: data.end_time + ':00', is_active: true, slot_duration: 30 });
    }
  }
  const { error: insertError } = await supabase.from('schedules').insert(inserts);
  if (insertError) { console.error('[onboarding.step4] insert error:', insertError); return { ok: false as const, error: insertError.message }; }

  const { data: stepData, error: stepError } = await supabase
    .from('tenants').update({ onboarding_step: 5, updated_at: new Date().toISOString() })
    .eq('id', profile.tenant.id).select('onboarding_step');
  if (stepError || !stepData || stepData.length === 0) return { ok: false as const, error: 'No se pudo avanzar' };
  console.log('[onboarding.step4] OK');
  revalidatePath('/onboarding');
  return { ok: true as const };
}

export async function completeOnboarding() {
  console.log('[completeOnboarding] >>> INICIO');
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return { ok: false as const, error: 'No autorizado' };

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from('tenants')
    .update({ is_onboarding_complete: true, onboarding_completed_at: new Date().toISOString(), onboarding_step: 5, updated_at: new Date().toISOString() })
    .eq('id', profile.tenant.id)
    .select('id, is_onboarding_complete, vertical');

  if (error) { console.error('[completeOnboarding] error:', error); return { ok: false as const, error: error.message }; }
  if (!data || data.length === 0) return { ok: false as const, error: 'No se pudo completar' };

  const tenantData = data[0] as { is_onboarding_complete: boolean; vertical: string };
  console.log('[completeOnboarding] OK. is_onboarding_complete:', tenantData.is_onboarding_complete);

  const vertical = tenantData.vertical || profile.tenant.vertical || 'dental';
  const redirectPath = vertical === 'legal' ? '/legal/dashboard' : '/dental/dashboard';

  revalidatePath('/dental/dashboard');
  revalidatePath('/legal/dashboard');
  revalidatePath('/onboarding');

  return { ok: true as const, vertical, redirectPath };
}

export async function goToOnboardingStep(step: number) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return { ok: false as const, error: 'No autorizado' };
  if (step < 1 || step > 5) return { ok: false as const, error: 'Paso invalido' };

  const supabase = getAdminSupabase();
  const currentStep = (profile.tenant as { onboarding_step?: number }).onboarding_step || 1;
  if (step > currentStep) return { ok: false as const, error: 'No puedes saltar pasos' };

  await supabase.from('tenants').update({ onboarding_step: step, updated_at: new Date().toISOString() }).eq('id', profile.tenant.id);
  revalidatePath('/onboarding');
  return { ok: true as const };
}

export async function uploadOnboardingImage(formData: FormData, kind: 'logo' | 'photo') {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return { ok: false as const, error: 'No autorizado' };

  const file = formData.get('file');
  if (!file || !(file instanceof File)) return { ok: false as const, error: 'Archivo invalido' };
  if (file.size > 5 * 1024 * 1024) return { ok: false as const, error: 'Maximo 5MB' };

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) return { ok: false as const, error: 'Solo JPG, PNG, WEBP' };

  const supabase = await createServerSupabase();
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now();
  const storagePath = profile.tenant.id + '/branding/' + kind + '_' + timestamp + '.' + ext;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const { error: uploadError } = await supabase.storage.from('patient-files').upload(storagePath, buffer, { contentType: file.type, cacheControl: '3600', upsert: false });
  if (uploadError) return { ok: false as const, error: uploadError.message };

  const { data: urlData } = supabase.storage.from('patient-files').getPublicUrl(storagePath);
  return { ok: true as const, url: urlData.publicUrl };
}

export async function getServiceTemplates(vertical: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('service_templates')
    .select('id, vertical, category, name, default_price, default_duration_minutes')
    .eq('vertical', vertical).eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) { console.error('[getServiceTemplates] error:', error); return []; }
  return data || [];
}
