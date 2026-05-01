import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SEED_SECRET = 'innova-seed-2026-test-only';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.secret !== SEED_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      email = 'prueba.wizard@test.local',
      password = 'TestSprint7!',
      first_name = 'Prueba',
      last_name = 'Wizard',
      tenant_name = 'Clinica de Prueba Wizard',
      vertical = 'dental',
      plan_code = 'dental_pro',
    } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        error: 'Faltan variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY',
      }, { status: 500 });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Limpiar usuario existente si lo hay
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existing = existingUsers?.users.find((u) => u.email === email);

    if (existing) {
      console.log('[seed] usuario existente, eliminando:', existing.id);

      const tenantsResp = await adminClient.from('tenants').select('id').eq('email', email);
      const tenantIds = tenantsResp.data?.map((t) => t.id) || [];

      if (tenantIds.length > 0) {
        await adminClient.from('subscriptions').delete().in('tenant_id', tenantIds);
        await adminClient.from('tenants').delete().eq('email', email);
      }
      await adminClient.from('profiles').delete().eq('id', existing.id);
      await adminClient.auth.admin.deleteUser(existing.id);
    }

    // Crear usuario via Admin API
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name, last_name, tenant_name },
    });

    if (authError || !authData.user) {
      console.error('[seed] auth error:', authError);
      return NextResponse.json({
        error: 'Error creando usuario auth: ' + (authError?.message || 'unknown'),
      }, { status: 500 });
    }

    // Buscar plan
    const { data: plan } = await adminClient
      .from('plans')
      .select('id')
      .eq('code', plan_code)
      .single();

    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado: ' + plan_code }, { status: 500 });
    }

    // Vincular tenant
    const { data: rpcResult, error: rpcError } = await adminClient.rpc('signup_create_tenant', {
      p_user_id: authData.user.id,
      p_user_email: email,
      p_user_first_name: first_name,
      p_user_last_name: last_name,
      p_user_phone: '+502 5555-1234',
      p_tenant_name: tenant_name,
      p_vertical: vertical,
      p_plan_id: plan.id,
    });

    if (rpcError) {
      console.error('[seed] rpc error:', rpcError);
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({
        error: 'Error creando tenant: ' + rpcError.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario de prueba creado correctamente',
      credentials: { email, password, tenant_name, vertical },
      tenant: rpcResult,
      user_id: authData.user.id,
      next_step: 'Login en /login con esas credenciales. Te llevara al wizard.',
    });

  } catch (err) {
    console.error('[seed] excepcion:', err);
    return NextResponse.json({
      error: 'Excepcion: ' + (err instanceof Error ? err.message : String(err)),
    }, { status: 500 });
  }
}
