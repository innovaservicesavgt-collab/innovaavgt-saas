import { NextResponse } from 'next/server';
import { resend, EMAIL_FROM } from '@/lib/resend';
import { requireVertical } from '@/lib/vertical';
import { EventReminderEmail } from '@/emails/event-reminder';
import { createServerSupabase } from '@/lib/supabase/server';

type EventoConJoins = {
  titulo: string;
  tipo: string;
  fecha_hora: string;
  lugar: string | null;
  case: {
    id: string;
    numero_interno: string;
    client: { nombre: string } | null;
  } | null;
};

export async function GET(request: Request) {
  try {
    const profile = await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { searchParams } = new URL(request.url);
    const urgenciaParam = searchParams.get('urgencia');
    const urgencia: 'hoy' | 'un_dia' | 'tres_dias' =
      urgenciaParam === 'hoy' ? 'hoy'
      : urgenciaParam === 'un_dia' ? 'un_dia'
      : 'tres_dias';

    const { data: eventRaw } = await supabase
      .from('legal_events')
      .select(`
        titulo,
        tipo,
        fecha_hora,
        lugar,
        case:legal_cases (
          id,
          numero_interno,
          client:legal_clients (nombre)
        )
      `)
      .eq('completado', false)
      .order('fecha_hora', { ascending: true })
      .limit(1)
      .maybeSingle();

    const event = eventRaw as EventoConJoins | null;

    const useEvent = event ?? {
      titulo: 'Audiencia de primera declaración (ejemplo)',
      tipo: 'AUDIENCIA',
      fecha_hora: new Date(Date.now() + 86400000).toISOString(),
      lugar: 'Torre de Tribunales, Sala 5',
      case: {
        id: '00000000-0000-0000-0000-000000000000',
        numero_interno: '2026-DEMO-0001',
        client: { nombre: 'Cliente Demo' },
      },
    };

    const tiposLabel: Record<string, string> = {
      AUDIENCIA: 'Audiencia',
      PLAZO_LEGAL: 'Plazo legal',
      MEMORIAL: 'Memorial',
      OFICIO: 'Oficio',
      DILIGENCIA: 'Diligencia',
      REUNION_CLIENTE: 'Reunión con cliente',
      OTRO: 'Evento',
    };

    const fecha = new Date(useEvent.fecha_hora);
    const fechaHoraFormateada = fecha.toLocaleString('es-GT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const abogadoNombre = `${profile.first_name} ${profile.last_name}`.trim() || 'Abogado';

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: profile.email,
      subject: getEmailSubject(urgencia, useEvent.titulo),
      react: EventReminderEmail({
        abogadoNombre,
        tituloEvento: useEvent.titulo,
        tipoEvento: tiposLabel[useEvent.tipo] ?? 'Evento',
        fechaHora: fechaHoraFormateada,
        lugar: useEvent.lugar,
        numeroExpediente: useEvent.case?.numero_interno ?? 'N/A',
        clienteNombre: useEvent.case?.client?.nombre ?? null,
        appUrl,
        expedienteId: useEvent.case?.id ?? '',
        urgencia,
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Correo enviado exitosamente',
      to: profile.email,
      urgencia,
      usoEventoReal: !!event,
      data,
    });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json(
      { success: false, error: 'Error al enviar correo' },
      { status: 500 }
    );
  }
}

function getEmailSubject(urgencia: string, titulo: string): string {
  switch (urgencia) {
    case 'hoy':
      return `🚨 HOY: ${titulo}`;
    case 'un_dia':
      return `⚠️ Mañana: ${titulo}`;
    case 'tres_dias':
    default:
      return `🔔 En 3 días: ${titulo}`;
  }
}