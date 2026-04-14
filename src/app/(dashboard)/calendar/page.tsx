import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { CalendarView } from '@/components/calendar/calendar-view';

export default async function CalendarPage() {
  await requireAuth();
  const supabase = await createServerSupabase();

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data: appointments } = await supabase.from('appointments')
    .select('id, appointment_date, start_time, end_time, status, patients(first_name, last_name), professionals(first_name, last_name, color), services(name)')
    .gte('appointment_date', firstDay).lte('appointment_date', lastDay)
    .not('status', 'eq', 'cancelled')
    .order('start_time', { ascending: true });

  return <CalendarView appointments={appointments || []} />;
}
