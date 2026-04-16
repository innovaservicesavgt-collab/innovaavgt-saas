import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

const updateClientSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  legalName: z.string().optional().nullable(),
  slug: z.string().min(2, 'El slug es obligatorio'),
  email: z.string().email('Correo inválido'),
  phone: z.string().optional().nullable(),
  representativeName: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  monthlyFee: z.coerce.number().min(0),
  currency: z.string().default('GTQ'),
  paymentStatus: z.string().default('current'),
  tenantStatus: z.string().default('active'),
  nextDueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  adminName: z.string().optional().nullable(),
  adminEmail: z.string().optional().nullable(),
  adminRole: z.string().optional().nullable(),
});

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateClientSchema.parse(body);

    const normalizedSlug = normalizeSlug(parsed.slug);

    const { data: slugRows, error: slugError } = await supabaseAdmin
      .from('tenants')
      .select('id, slug')
      .eq('slug', normalizedSlug);

    if (slugError) {
      return NextResponse.json(
        { error: `Error validando slug: ${slugError.message}` },
        { status: 500 }
      );
    }

    const slugTakenByAnother = (slugRows || []).some((row) => row.id !== id);

    if (slugTakenByAnother) {
      return NextResponse.json(
        { error: 'Ya existe otro cliente con ese slug' },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('tenants')
      .update({
        name: parsed.name,
        legal_name: parsed.legalName || null,
        slug: normalizedSlug,
        subdomain: `${normalizedSlug}.innovaservicesav.com`,
        email: parsed.email,
        phone: parsed.phone || null,
        representative_name: parsed.representativeName || null,
        country: parsed.country || null,
        city: parsed.city || null,
        postal_code: parsed.postalCode || null,
        address: parsed.address || null,
        monthly_fee: parsed.monthlyFee,
        currency: parsed.currency,
        payment_status: parsed.paymentStatus,
        tenant_status: parsed.tenantStatus,
        next_due_date: parsed.nextDueDate || null,
        notes: parsed.notes || null,
        logo_url: parsed.logoUrl || null,
        admin_name: parsed.adminName || null,
        admin_email: parsed.adminEmail || null,
        admin_role: parsed.adminRole || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `No se pudo actualizar el cliente: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, client: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}