import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
    if (!profile?.tenant_id) return NextResponse.json({ error: 'Sin tenant' }, { status: 403 });

    const body = await request.json();
    const { data: quotation, error } = await supabase.from('quotations').insert({
      tenant_id: profile.tenant_id, patient_id: body.patient_id, status: 'draft',
      subtotal: body.subtotal, discount_percent: body.discount_percent, discount_amount: body.discount_amount,
      total: body.total, notes: body.notes, created_by: user.id,
      quotation_number: 'COT-' + Date.now().toString().slice(-6),
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (body.items?.length) {
      await supabase.from('quotation_items').insert(
        body.items.map((item: any) => ({ quotation_id: quotation.id, service_id: item.service_id || null, description: item.description, quantity: item.quantity, unit_price: item.unit_price, total: item.total }))
      );
    }
    return NextResponse.json(quotation, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
