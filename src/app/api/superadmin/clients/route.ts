import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();

    // Validaciones
    if (!body.name || !body.slug || !body.email) {
      return NextResponse.json(
        { error: 'Nombre, slug y correo son obligatorios' },
        { status: 400 }
      );
    }

    // Verificar slug único
    const { data: existing } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('slug', body.slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Este subdominio ya está en uso' },
        { status: 409 }
      );
    }

    // Crear tenant
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: body.name,
        legal_name: body.legalName || null,
        slug: body.slug,
        email: body.email,
        phone: body.phone || null,
        representative_name: body.representativeName || null,
        country: body.country || 'Guatemala',
        city: body.city || null,
        postal_code: body.postalCode || null,
        address: body.address || null,
        monthly_fee: Number(body.monthlyFee) || 0,
        currency: body.currency || 'GTQ',
        payment_status: body.paymentStatus || 'current',
        tenant_status: body.tenantStatus || 'trial',
        next_due_date: body.nextDueDate || null,
        notes: (body.notes || '').slice(0, 500),
        logo_url: body.logoUrl || null,
        plan: body.plan || 'trial',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Crear sucursal principal
    await supabaseAdmin.from('branches').insert({
      tenant_id: tenant.id,
      name: 'Principal',
      is_main: true,
    });

    // Si hay datos de admin, crear usuario
    if (body.adminEmail && body.adminPassword) {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: body.adminEmail,
        password: body.adminPassword,
        email_confirm: true,
      });

      if (authUser?.user) {
        // Actualizar profile con tenant_id
        await supabaseAdmin
          .from('profiles')
          .update({
            tenant_id: tenant.id,
            first_name: body.adminName?.split(' ')[0] || '',
            last_name: body.adminName?.split(' ').slice(1).join(' ') || '',
          })
          .eq('id', authUser.user.id);

        // Asignar rol admin
        const { data: adminRole } = await supabaseAdmin
          .from('roles')
          .select('id')
          .eq('name', 'admin')
          .eq('tenant_id', tenant.id)
          .single();

        if (!adminRole) {
          const { data: newRole } = await supabaseAdmin
            .from('roles')
            .insert({ tenant_id: tenant.id, name: 'admin', description: 'Administrador' })
            .select()
            .single();

          if (newRole) {
            await supabaseAdmin
              .from('profiles')
              .update({ role_id: newRole.id })
              .eq('id', authUser.user.id);
          }
        } else {
          await supabaseAdmin
            .from('profiles')
            .update({ role_id: adminRole.id })
            .eq('id', authUser.user.id);
        }
      }
    }

    return NextResponse.json(tenant, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 });
  }
}