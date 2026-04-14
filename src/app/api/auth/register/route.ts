import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

const s = z.object({
  businessName: z.string().min(2), slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  businessType: z.string(), phone: z.string().optional(),
  firstName: z.string().min(2), lastName: z.string().min(2),
  email: z.string().email(), password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = s.parse(body);

    const { data: ex } = await supabaseAdmin.from('tenants').select('id').eq('slug', data.slug).single();
    if (ex) return NextResponse.json({ error: 'Subdominio ya en uso' }, { status: 409 });

    const { data: tenant, error: te } = await supabaseAdmin.from('tenants').insert({
      name: data.businessName, slug: data.slug, business_type: data.businessType,
      email: data.email, phone: data.phone || null, plan: 'trial',
      plan_expires_at: new Date(Date.now() + 14*24*60*60*1000).toISOString(),
    }).select().single();
    if (te) return NextResponse.json({ error: 'Error creando negocio' }, { status: 500 });

    await supabaseAdmin.from('branches').insert({ tenant_id: tenant.id, name: 'Principal', is_main: true });

    const { error: ae } = await supabaseAdmin.auth.admin.createUser({
      email: data.email, password: data.password, email_confirm: true,
      user_metadata: { first_name: data.firstName, last_name: data.lastName, tenant_id: tenant.id, role: 'admin' },
    });
    if (ae) {
      await supabaseAdmin.from('branches').delete().eq('tenant_id', tenant.id);
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id);
      return NextResponse.json({ error: 'Error creando cuenta' }, { status: 500 });
    }

    return NextResponse.json({ success: true, tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name }, redirectUrl: '/login' });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
