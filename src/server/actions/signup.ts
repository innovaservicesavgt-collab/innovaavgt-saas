'use server';

import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isDisposableEmail, isValidPassword } from '@/lib/types/signup';

const signupSchema = z.object({
  vertical: z.enum(['dental', 'legal']),
  plan_id: z.string().uuid(),
  tenant_name: z.string().min(2, 'Nombre muy corto').max(200),
  first_name: z.string().min(2, 'Nombre muy corto').max(100),
  last_name: z.string().min(2, 'Apellido muy corto').max(100),
  email: z.string().email('Email invalido').max(200),
  phone: z.string().max(50).optional().nullable(),
  password: z.string().min(8, 'Minimo 8 caracteres').max(100),
  accept_terms: z.boolean(),
});

export type SignupInput = z.input<typeof signupSchema>;

export async function publicSignup(input: SignupInput) {
  console.log('[publicSignup] inicio - email:', input.email, 'vertical:', input.vertical);

  // 1. Validar schema
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    console.error('[publicSignup] schema error:', parsed.error.issues);
    return { ok: false as const, error: parsed.error.issues[0]?.message || 'Datos invalidos' };
  }
  const data = parsed.data;

  // 2. Validaciones de negocio
  if (!data.accept_terms) {
    return { ok: false as const, error: 'Debes aceptar los terminos y condiciones' };
  }

  const emailLower = data.email.toLowerCase().trim();
  if (!emailLower.includes('@') || !emailLower.includes('.')) {
    return { ok: false as const, error: 'Email invalido' };
  }

  if (isDisposableEmail(emailLower)) {
    return { ok: false as const, error: 'No se permiten emails temporales o desechables' };
  }

  const pwdCheck = isValidPassword(data.password);
  if (!pwdCheck.ok) {
    return { ok: false as const, error: pwdCheck.error || 'Contrasena debil' };
  }

  // 3. Validar que el plan existe y esta disponible (con cliente normal, RLS permite leer plans publicos)
  const supabaseAnon = await createServerSupabase();
  const { data: plan, error: planError } = await supabaseAnon
    .from('plans')
    .select('id, vertical, is_self_service, is_active, code')
    .eq('id', data.plan_id)
    .single();

  if (planError || !plan) {
    console.error('[publicSignup] plan error:', planError);
    return { ok: false as const, error: 'Plan no encontrado' };
  }
  if (!plan.is_active) return { ok: false as const, error: 'Este plan no esta disponible' };
  if (!plan.is_self_service) return { ok: false as const, error: 'Este plan requiere contacto comercial' };
  if (plan.vertical !== data.vertical) return { ok: false as const, error: 'El plan no coincide con el vertical' };

  console.log('[publicSignup] plan validado:', plan.code);

  // 4. Usar ADMIN client para crear usuario (esto es CRITICO - misma logica que el seed)
  const adminClient = getAdminSupabase();

  // 5. Verificar si el email ya existe
  const { data: existingUsers } = await adminClient.auth.admin.listUsers();
  const usersTyped = (existingUsers as { users?: Array<{ email?: string; id: string }> } | null)?.users || [];
  const existing = usersTyped.find((u) => u.email === emailLower);

  if (existing) {
    console.log('[publicSignup] email ya existe:', emailLower);
    return { ok: false as const, error: 'Ya existe una cuenta con ese email. Inicia sesion en lugar de crear una nueva.' };
  }

  // 6. Crear usuario via Admin API (NO envia email automaticamente cuando email_confirm es false)
  // Pero ANTES de crear, configuramos para que envie magic link de confirmacion
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000');
  const confirmRedirectUrl = baseUrl + '/signup/confirmed';

  console.log('[publicSignup] creando usuario via admin API...');

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: emailLower,
    password: data.password,
    email_confirm: false,  // Requiere confirmacion
    user_metadata: {
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      tenant_name: data.tenant_name.trim(),
    },
  });

  if (authError || !authData?.user) {
    console.error('[publicSignup] error al crear usuario:', authError);
    const msg = authError?.message?.toLowerCase() || '';
    if (msg.includes('already')) {
      return { ok: false as const, error: 'Ya existe una cuenta con ese email' };
    }
    return { ok: false as const, error: 'Error al crear cuenta: ' + (authError?.message || 'desconocido') };
  }

  const userId = authData.user.id;
  console.log('[publicSignup] usuario creado:', userId);

  // 7. Llamar signup_create_tenant (con admin client - bypassa RLS)
  const { data: rpcResult, error: rpcError } = await adminClient.rpc('signup_create_tenant', {
    p_user_id: userId,
    p_user_email: emailLower,
    p_user_first_name: data.first_name.trim(),
    p_user_last_name: data.last_name.trim(),
    p_user_phone: data.phone?.trim() || null,
    p_tenant_name: data.tenant_name.trim(),
    p_vertical: data.vertical,
    p_plan_id: data.plan_id,
  });

  if (rpcError) {
    console.error('[publicSignup] error rpc create_tenant:', rpcError);
    // Limpieza: eliminar usuario que se creo si no se pudo configurar el tenant
    await adminClient.auth.admin.deleteUser(userId);
    return { ok: false as const, error: 'Error al configurar tu cuenta: ' + rpcError.message };
  }

  console.log('[publicSignup] tenant creado:', rpcResult);

  // 8. Generar magic link para confirmacion (Supabase enviara email)
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: emailLower,
    options: {
      redirectTo: confirmRedirectUrl,
    },
  });

  if (linkError) {
    console.error('[publicSignup] error magic link:', linkError);
    // No es fatal - el usuario ya esta creado, solo no se envio email
    // Devolvemos exito pero con flag para que el cliente sepa
    return {
      ok: true as const,
      email: emailLower,
      tenantId: (rpcResult as { tenant_id?: string })?.tenant_id || '',
      needsEmailConfirmation: true,
      emailSent: false,
      warning: 'Tu cuenta fue creada pero no se pudo enviar el email de confirmacion. Contacta a soporte.',
    };
  }

  console.log('[publicSignup] magic link generado, email enviado por Supabase');

  return {
    ok: true as const,
    email: emailLower,
    tenantId: (rpcResult as { tenant_id?: string })?.tenant_id || '',
    needsEmailConfirmation: true,
    emailSent: true,
  };
}

// Cargar planes publicos (sin cambios)
export async function getPublicPlans(vertical: 'dental' | 'legal') {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('plans')
    .select('id, code, vertical, name, monthly_price, trial_days, description, features, max_users, max_branches, storage_mb, is_active, is_self_service, is_public')
    .eq('vertical', vertical)
    .eq('is_active', true)
    .eq('is_self_service', true)
    .eq('is_public', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[getPublicPlans] error:', error);
    return [];
  }
  return data || [];
}
