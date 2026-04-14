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
    const { data, error } = await supabase.from('appointments').insert({
      tenant_id: profile.tenant_id,
      patient_id: body.patient_id,
      professional_id: body.professional_id,
      service_id: body.service_id || null,
      appointment_date: body.appointment_date,
      start_time: body.start_time,
      end_time: body.end_time,
      duration_minutes: body.duration_minutes,
      reason: body.reason || null,
      notes: body.notes || null,
      price: body.price || null,
      status: 'scheduled',
      source: 'manual',
      created_by: user.id,
      confirmation_token: crypto.randomUUID(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error' }, { status: 500 });
  }
}
