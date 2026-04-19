import { createServerSupabase } from '@/lib/supabase/server';
import { CalendarPageClient } from './components/calendar-page-client';
import { LegalEventWithCase } from './types';

export default async function LegalCalendarPage() {
  const supabase = await createServerSupabase();

  // Cargar todos los eventos con info del expediente y cliente
  const { data: events } = await supabase
    .from('legal_events')
    .select(`
      *,
      case:legal_cases (
        id,
        numero_interno,
        materia,
        client:legal_clients (id, nombre)
      )
    `)
    .order('fecha_hora', { ascending: true });

  // Cargar expedientes activos para el selector
  const { data: cases } = await supabase
    .from('legal_cases')
    .select(`
      id,
      numero_interno,
      client:legal_clients (nombre)
    `)
    .eq('archivado', false)
    .order('numero_interno', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
        <p className="text-gray-600 mt-1">
          Audiencias, plazos, memoriales y diligencias
        </p>
      </div>

      <CalendarPageClient
        initialEvents={(events as LegalEventWithCase[]) || []}
        cases={(cases as any) || []}
      />
    </div>
  );
}