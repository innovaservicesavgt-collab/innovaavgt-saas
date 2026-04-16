import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
   await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const message = (body.message || '').slice(0, 2000);

    // Aquí iría la integración con email service (Resend, SendGrid, etc.)
    // Por ahora solo registramos en audit_logs
    await supabaseAdmin.from('audit_logs').insert({
      tenant_id: id,
      action: 'send_reminder',
      entity_type: 'billing',
      new_data: { message_length: message.length, sent_at: new Date().toISOString() },
    });

    return NextResponse.json({ success: true, message: 'Recordatorio registrado' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error' }, { status: 500 });
  }
}
