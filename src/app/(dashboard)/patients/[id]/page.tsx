import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import Link from 'next/link';
import { PatientTabs } from '@/components/patients/patient-tabs';

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const supabase = await createServerSupabase();
  const { id } = await params;

  const { data: patient } = await supabase.from('patients').select('*').eq('id', id).single();
  if (!patient) return <div className="p-8 text-center text-slate-500">Paciente no encontrado</div>;

  const [{ data: appointments }, { data: treatments }, { data: payments }, { data: images }] = await Promise.all([
    supabase.from('appointments').select('*, professionals(first_name, last_name, title), services(name)').eq('patient_id', id).order('appointment_date', { ascending: false }).limit(20),
    supabase.from('treatments').select('*, professionals(first_name, last_name, title), services(name)').eq('patient_id', id).order('created_at', { ascending: false }),
    supabase.from('payments').select('*').eq('patient_id', id).order('created_at', { ascending: false }),
    supabase.from('patient_images').select('*').eq('patient_id', id).order('created_at', { ascending: false }),
  ]);

  // Calcular edad
  let age = '';
  if (patient.date_of_birth) {
    const today = new Date();
    const birth = new Date(patient.date_of_birth);
    let y = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) y--;
    age = y + ' anos';
  }

  // Balance
  const totalCharged = appointments?.reduce((s: number, a: any) => s + (Number(a.price) || 0), 0) || 0;
  const totalPaid = payments?.reduce((s: number, p: any) => s + (p.status === 'paid' ? Number(p.amount) : 0), 0) || 0;
  const balance = totalCharged - totalPaid;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/patients" className="text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></Link>
        <h2 className="text-xl font-bold text-slate-800">Expediente del paciente</h2>
      </div>

      {/* Patient card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Photo */}
          <div className="flex-shrink-0">
            {patient.photo_url ? (
              <img src={patient.photo_url} alt="" className="w-20 h-20 rounded-xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-2xl font-bold text-blue-600">
                {patient.first_name?.charAt(0)}{patient.last_name?.charAt(0)}
              </div>
            )}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-800">{patient.first_name} {patient.last_name}</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-500">
              {age && <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>{age}</span>}
              {patient.phone && <span>{patient.phone}</span>}
              {patient.email && <span>{patient.email}</span>}
              {patient.gender && patient.gender !== 'unspecified' && <span>{patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Femenino' : 'Otro'}</span>}
            </div>
            {patient.responsible_name && (
              <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-2 py-1 rounded inline-block">
                Responsable: {patient.responsible_name} ({patient.responsible_relationship || 'N/A'}) - {patient.responsible_phone || ''}
              </p>
            )}
          </div>
          {/* Balance */}
          <div className="flex-shrink-0 text-right">
            <p className="text-xs text-slate-400">Estado de cuenta</p>
            <p className={"text-xl font-bold " + (balance > 0 ? "text-red-600" : "text-emerald-600")}>
              Q{Math.abs(balance).toFixed(2)}
            </p>
            <p className="text-xs text-slate-400">{balance > 0 ? 'Pendiente' : balance < 0 ? 'A favor' : 'Al dia'}</p>
          </div>
        </div>
        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="text-center"><p className="text-lg font-bold text-slate-700">{appointments?.length || 0}</p><p className="text-xs text-slate-400">Citas</p></div>
          <div className="text-center"><p className="text-lg font-bold text-slate-700">{treatments?.length || 0}</p><p className="text-xs text-slate-400">Tratamientos</p></div>
          <div className="text-center"><p className="text-lg font-bold text-slate-700">{images?.length || 0}</p><p className="text-xs text-slate-400">Imagenes</p></div>
          <div className="text-center"><p className="text-lg font-bold text-slate-700">{payments?.length || 0}</p><p className="text-xs text-slate-400">Pagos</p></div>
        </div>
      </div>

      {/* Tabs */}
      <PatientTabs
        patientId={id}
        appointments={appointments || []}
        treatments={treatments || []}
        payments={payments || []}
        images={images || []}
        allergies={patient.allergies}
        medicalNotes={patient.medical_notes}
      />
    </div>
  );
}
