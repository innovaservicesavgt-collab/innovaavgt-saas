import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { NewAppointmentForm } from '@/components/appointments/new-form';

export default async function NewAppointmentPage() {
  await requireAuth();
  const supabase = await createServerSupabase();

  const [{ data: patients }, { data: professionals }, { data: services }] = await Promise.all([
    supabase.from('patients').select('id, first_name, last_name, phone').eq('is_active', true).order('last_name'),
    supabase.from('professionals').select('id, first_name, last_name, title, color').eq('is_active', true).order('last_name'),
    supabase.from('services').select('id, name, duration_minutes, price, color').eq('is_active', true).order('name'),
  ]);

  return <NewAppointmentForm patients={patients || []} professionals={professionals || []} services={services || []} />;
}
