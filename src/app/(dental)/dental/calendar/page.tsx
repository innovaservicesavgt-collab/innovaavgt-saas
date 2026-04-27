import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { DentalCalendar } from '@/components/calendar/dental-calendar';

export type CalendarAppointment = {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  status: string;
  reason: string | null;
  notes: string | null;
  price: number | null;
  patient_id: string | null;
  professional_id: string | null;
  service_id: string | null;
  patients: { first_name: string; last_name: string; phone: string | null } | null;
  professionals: { first_name: string; last_name: string; color: string | null } | null;
  services: { name: string } | null;
};

export type ProfessionalOption = {
  id: string;
  first_name: string;
  last_name: string;
  color: string | null;
  title: string | null;
};

export type ServiceOption = {
  id: string;
  name: string;
  duration_minutes: number | null;
  price: number | null;
};

export default async function CalendarPage() {
  await requireAuth();
  const supabase = await createServerSupabase();

  // Cargamos un rango amplio (2 meses atrÃ¡s, 3 meses adelante)
  // FullCalendar internamente filtra lo visible
  const today = new Date();
  const startRange = new Date(today.getFullYear(), today.getMonth() - 2, 1)
    .toISOString()
    .split('T')[0];
  const endRange = new Date(today.getFullYear(), today.getMonth() + 4, 0)
    .toISOString()
    .split('T')[0];

  const [{ data: appointments }, { data: professionals }, { data: services }] =
    await Promise.all([
      supabase
        .from('appointments')
        .select(
          'id, appointment_date, start_time, end_time, duration_minutes, status, reason, notes, price, patient_id, professional_id, service_id, patients(first_name, last_name, phone), professionals(first_name, last_name, color), services(name)'
        )
        .gte('appointment_date', startRange)
        .lte('appointment_date', endRange)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true }),
      supabase
        .from('professionals')
        .select('id, first_name, last_name, color, title')
        .eq('is_active', true)
        .order('first_name'),
      supabase
        .from('services')
        .select('id, name, duration_minutes, price')
        .order('name'),
    ]);

  return (
    <DentalCalendar
      appointments={(appointments || []) as unknown as CalendarAppointment[]}
      professionals={(professionals || []) as ProfessionalOption[]}
      services={(services || []) as ServiceOption[]}
    />
  );
}