import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Printer, Pill, User, Calendar, Hash, Stethoscope } from 'lucide-react';
import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';
import type { Medication } from '@/lib/types/prescription';
import { PrintButton } from '@/components/documents/print-button';

type PageProps = { params: Promise<{ id: string }> };

export default async function PrescriptionDetailPage({ params }: PageProps) {
  await requireAuth();
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return null;
  const supabase = await createServerSupabase();

  const { data: prescription, error } = await supabase
    .from('prescriptions')
    .select('*, patients (id, first_name, last_name, document_number, phone, address), professionals (first_name, last_name, title, specialty)')
    .eq('id', id)
    .eq('tenant_id', profile.tenant.id)
    .single();

  if (error || !prescription) notFound();

  const patient = prescription.patients as { id: string; first_name: string; last_name: string; document_number: string | null; phone: string | null; address: string | null } | null;
  const professional = prescription.professionals as { first_name: string; last_name: string; title: string | null; specialty: string | null } | null;
  const meds = (prescription.medications || []) as Medication[];
  const tenantName = profile.tenant.brand_name || profile.tenant.name || 'Clinica';

  return (
    <div className="space-y-4 max-w-3xl mx-auto print:max-w-none">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          href={'/dental/patients/' + (patient?.id || '') + '/documents'}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <PrintButton />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden print:shadow-none print:border-0">
        {/* Encabezado */}
        <div className="px-6 sm:px-8 py-5 border-b-2 border-violet-600">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-violet-700 uppercase tracking-wider">{tenantName}</p>
              <h1 className="mt-1 text-xl font-bold text-slate-900">RECETA MEDICA</h1>
            </div>
            <div className="text-left sm:text-right">
              <div className="flex items-center gap-2 sm:justify-end">
                <Hash className="h-4 w-4 text-violet-600" />
                <p className="text-base font-bold text-violet-700 tabular-nums">
                  {prescription.prescription_number || 'Sin numero'}
                </p>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {prescription.issued_at ? formatDate(prescription.issued_at) : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Paciente y profesional */}
        <div className="px-6 sm:px-8 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-[10px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                <User className="h-3 w-3" />
                Paciente
              </h3>
              {patient && (
                <>
                  <p className="font-bold text-slate-900">{patient.first_name} {patient.last_name}</p>
                  {patient.document_number && (
                    <p className="text-xs text-slate-600">DPI: {patient.document_number}</p>
                  )}
                  {patient.phone && <p className="text-xs text-slate-600">Tel: {patient.phone}</p>}
                </>
              )}
            </div>
            <div>
              <h3 className="text-[10px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                <Stethoscope className="h-3 w-3" />
                Profesional
              </h3>
              {professional ? (
                <>
                  <p className="font-bold text-slate-900">
                    {professional.title ? professional.title + ' ' : ''}
                    {professional.first_name} {professional.last_name}
                  </p>
                  {professional.specialty && (
                    <p className="text-xs text-slate-600">{professional.specialty}</p>
                  )}
                </>
              ) : <p className="text-sm text-slate-500">Sin asignar</p>}
            </div>
          </div>
        </div>

        {/* Diagnostico */}
        {prescription.diagnosis && (
          <div className="px-6 sm:px-8 py-4 border-b border-slate-200">
            <h3 className="text-[10px] font-bold uppercase text-slate-500 mb-1">Diagnostico</h3>
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{prescription.diagnosis}</p>
          </div>
        )}

        {/* Medicamentos */}
        <div className="px-6 sm:px-8 py-4">
          <h3 className="text-[10px] font-bold uppercase text-slate-500 mb-3 flex items-center gap-1">
            <Pill className="h-3 w-3" />
            Indicaciones
          </h3>
          <div className="space-y-3">
            {meds.map((m, idx) => (
              <div key={idx} className="rounded-xl border border-violet-100 bg-violet-50/30 p-3">
                <div className="flex items-start gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900">{m.name}</p>
                    {m.presentation && <p className="text-xs text-slate-600">{m.presentation}</p>}
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-1 text-xs">
                      {m.dose && <div><span className="font-bold">Dosis:</span> {m.dose}</div>}
                      {m.frequency && <div><span className="font-bold">Frecuencia:</span> {m.frequency}</div>}
                      {m.duration && <div><span className="font-bold">Duracion:</span> {m.duration}</div>}
                    </div>
                    {m.instructions && (
                      <p className="mt-2 text-xs italic text-slate-700">
                        Instrucciones: {m.instructions}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recomendaciones */}
        {prescription.recommendations && (
          <div className="px-6 sm:px-8 py-4 border-t border-slate-200 bg-slate-50/30">
            <h3 className="text-[10px] font-bold uppercase text-slate-500 mb-1">Recomendaciones generales</h3>
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{prescription.recommendations}</p>
          </div>
        )}

        {/* Proxima visita */}
        {prescription.next_visit_date && (
          <div className="px-6 sm:px-8 py-4 border-t border-slate-200 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-600" />
            <p className="text-sm">
              <span className="font-bold">Proxima visita: </span>
              {formatDate(prescription.next_visit_date)}
            </p>
          </div>
        )}

        {/* Firma */}
        <div className="px-6 sm:px-8 py-8">
          <div className="max-w-xs mx-auto text-center">
            <div className="border-t-2 border-slate-300 pt-2">
              <p className="text-xs text-slate-700 font-bold">
                {professional ? (professional.title ? professional.title + ' ' : '') + professional.first_name + ' ' + professional.last_name : 'Firma del profesional'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Firma y sello</p>
            </div>
          </div>
        </div>
      </div>

      <style>{
`@media print {
  @page { size: A4; margin: 1.5cm; }
  body { -webkit-print-color-adjust: exact; }
  aside, nav { display: none !important; }
}`
      }</style>
    </div>
  );
}

function formatDate(s: string): string {
  const d = new Date(s);
  return d.toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' });
}
