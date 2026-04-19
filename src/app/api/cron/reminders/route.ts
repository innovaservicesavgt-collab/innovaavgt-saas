import { NextResponse } from 'next/server';
import { resend, EMAIL_FROM } from '@/lib/resend';
import { createAdminSupabase } from '@/lib/supabase/admin';
import { EventReminderEmail } from '@/emails/event-reminder';

// Tipos
type Urgencia = 'tres_dias' | 'un_dia' | 'hoy';

type EventoParaRecordatorio = {
  id: string;
  titulo: string;
  tipo: string;
  fecha_hora: string;
  lugar: string | null;
  tenant_id: string;
  recordatorio_3d_enviado: boolean;
  recordatorio_1d_enviado: boolean;
  recordatorio_hoy_enviado: boolean;
  case: {
    id: string;
    numero_interno: string;
    client: { nombre: string } | null;
  } | null;
  created_by_profile: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
};

const TIPOS_LABEL: Record<string, string> = {
  AUDIENCIA: 'Audiencia',
  PLAZO_LEGAL: 'Plazo legal',
  MEMORIAL: 'Memorial',
  OFICIO: 'Oficio',
  DILIGENCIA: 'Diligencia',
  REUNION_CLIENTE: 'Reunión con cliente',
  OTRO: 'Evento',
};

/**
 * Endpoint que corre diariamente a las 7 AM (Vercel Cron).
 * Envía recordatorios a abogados sobre eventos próximos.
 */
export async function GET(request: Request) {
  // 🔒 Verificar autenticación del cron
  const authHeader = request.headers.get('authorization');
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedToken) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const stats = {
    procesados: 0,
    enviados: 0,
    saltados: 0,
    errores: 0,
    errorList: [] as string[],
  };

  try {
    const supabase = createAdminSupabase();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    // Rangos de fechas para buscar
    const ahora = new Date();
    const inicioHoy = new Date(ahora);
    inicioHoy.setHours(0, 0, 0, 0);

    const finHoy = new Date(ahora);
    finHoy.setHours(23, 59, 59, 999);

    const inicioManana = new Date(inicioHoy);
    inicioManana.setDate(inicioManana.getDate() + 1);

    const finManana = new Date(inicioManana);
    finManana.setHours(23, 59, 59, 999);

    const inicio3Dias = new Date(inicioHoy);
    inicio3Dias.setDate(inicio3Dias.getDate() + 3);

    const fin3Dias = new Date(inicio3Dias);
    fin3Dias.setHours(23, 59, 59, 999);

    // Buscar eventos que necesiten recordatorio
    // Son eventos: no completados + dentro de los próximos 3 días + algún recordatorio sin enviar
    const { data: eventos, error: fetchError } = await supabase
      .from('legal_events')
      .select(`
        id,
        titulo,
        tipo,
        fecha_hora,
        lugar,
        tenant_id,
        recordatorio_3d_enviado,
        recordatorio_1d_enviado,
        recordatorio_hoy_enviado,
        case:legal_cases (
          id,
          numero_interno,
          client:legal_clients (id, nombre)
        ),
        created_by_profile:profiles!created_by (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('completado', false)
      .gte('fecha_hora', inicioHoy.toISOString())
      .lte('fecha_hora', fin3Dias.toISOString())
      .order('fecha_hora', { ascending: true });

    if (fetchError) {
      console.error('Error fetching events:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Error al buscar eventos', stats },
        { status: 500 }
      );
    }

    const eventosTipados = (eventos || []) as unknown as EventoParaRecordatorio[];

    // Procesar cada evento
    for (const evento of eventosTipados) {
      stats.procesados++;

      // Determinar urgencia según fecha del evento
      const fechaEvento = new Date(evento.fecha_hora);
      let urgencia: Urgencia | null = null;
      let flagColumna: 'recordatorio_3d_enviado' | 'recordatorio_1d_enviado' | 'recordatorio_hoy_enviado' | null = null;

      // HOY
      if (fechaEvento >= inicioHoy && fechaEvento <= finHoy) {
        if (!evento.recordatorio_hoy_enviado) {
          urgencia = 'hoy';
          flagColumna = 'recordatorio_hoy_enviado';
        }
      }
      // MAÑANA
      else if (fechaEvento >= inicioManana && fechaEvento <= finManana) {
        if (!evento.recordatorio_1d_enviado) {
          urgencia = 'un_dia';
          flagColumna = 'recordatorio_1d_enviado';
        }
      }
      // EN 3 DÍAS
      else if (fechaEvento >= inicio3Dias && fechaEvento <= fin3Dias) {
        if (!evento.recordatorio_3d_enviado) {
          urgencia = 'tres_dias';
          flagColumna = 'recordatorio_3d_enviado';
        }
      }

      // Si no aplica ningún recordatorio, saltar
      if (!urgencia || !flagColumna) {
        stats.saltados++;
        continue;
      }

      // Si no hay email del abogado, saltar
      if (!evento.created_by_profile?.email) {
        stats.saltados++;
        stats.errorList.push(`Evento ${evento.id} sin email de destinatario`);
        continue;
      }

      // Enviar correo
      try {
        const abogadoNombre = `${evento.created_by_profile.first_name} ${evento.created_by_profile.last_name}`.trim() || 'Abogado';

        const fechaHoraFormateada = fechaEvento.toLocaleString('es-GT', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const subject = urgencia === 'hoy' 
          ? `🚨 HOY: ${evento.titulo}`
          : urgencia === 'un_dia'
          ? `⚠️ Mañana: ${evento.titulo}`
          : `🔔 En 3 días: ${evento.titulo}`;

        const { error: emailError } = await resend.emails.send({
          from: EMAIL_FROM,
          to: evento.created_by_profile.email,
          subject,
          react: EventReminderEmail({
            abogadoNombre,
            tituloEvento: evento.titulo,
            tipoEvento: TIPOS_LABEL[evento.tipo] ?? 'Evento',
            fechaHora: fechaHoraFormateada,
            lugar: evento.lugar,
            numeroExpediente: evento.case?.numero_interno ?? 'N/A',
            clienteNombre: evento.case?.client?.nombre ?? null,
            appUrl,
            expedienteId: evento.case?.id ?? '',
            urgencia,
          }),
        });

        if (emailError) {
          stats.errores++;
          stats.errorList.push(`Evento ${evento.id}: ${emailError.message}`);
          continue;
        }

        // Marcar como enviado
        await supabase
          .from('legal_events')
          .update({
            [flagColumna]: true,
            ultimo_recordatorio_at: new Date().toISOString(),
          })
          .eq('id', evento.id);

        stats.enviados++;
      } catch (err) {
        stats.errores++;
        const errMsg = err instanceof Error ? err.message : 'Error desconocido';
        stats.errorList.push(`Evento ${evento.id}: ${errMsg}`);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (err) {
    console.error('Error en cron reminders:', err);
    const errMsg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, error: errMsg, stats },
      { status: 500 }
    );
  }
}