import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const amount = Number(body.amount);
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });

    const validMethods = ['cash','card','transfer','check','other'];
    const method = validMethods.includes(body.payment_method) ? body.payment_method : 'other';

    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert({
        tenant_id: id,
        amount,
        payment_method: method,
        status: 'paid',
        notes: (body.notes || '').slice(0, 500),
        receipt_number: 'REC-' + Date.now().toString().slice(-6),
        paid_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error' }, { status: 500 });
  }
}