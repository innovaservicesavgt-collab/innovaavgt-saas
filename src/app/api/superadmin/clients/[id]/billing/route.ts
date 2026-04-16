import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const updates: any = {};
    if (typeof body.billing_notes === 'string') updates.billing_notes = body.billing_notes.slice(0, 500);
    if (['monthly','quarterly','yearly'].includes(body.billing_period)) updates.billing_period = body.billing_period;

    const { data, error } = await supabaseAdmin
      .from('tenants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error' }, { status: 500 });
  }
}
