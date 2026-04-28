'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Printer,
  ClipboardSignature,
  User,
  Hash,
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  PenLine,
  X,
} from 'lucide-react';
import { signConsent } from '@/server/actions/consents';
import type { Consent } from '@/lib/types/consent';

type ConsentFull = Consent & {
  patients: {
    id: string;
    first_name: string;
    last_name: string;
    document_number: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  professionals: {
    first_name: string;
    last_name: string;
    title: string | null;
    specialty: string | null;
  } | null;
};

type Props = {
  consent: ConsentFull;
  tenantName: string;
};

export function ConsentDetail({ consent, tenantName }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showSignModal, setShowSignModal] = useState(false);
  const [signerName, setSignerName] = useState(
    consent.patients ? consent.patients.first_name + ' ' + consent.patients.last_name : ''
  );
  const [signerDoc, setSignerDoc] = useState(consent.patients?.document_number || '');

  const patient = consent.patients;
  const professional = consent.professionals;

  const handlePrint = () => window.print();

  const handleSign = () => {
    if (signerName.trim().length < 2) {
      toast.error('Nombre del firmante requerido');
      return;
    }
    startTransition(async () => {
      const res = await signConsent({
        consent_id: consent.id,
        signed_by_name: signerName,
        signed_by_document: signerDoc || null,
      });
      if (!res.ok) {
        toast.error(res.error || 'Error');
        return;
      }
      toast.success('Consentimiento firmado');
      setShowSignModal(false);
      router.refresh();
    });
  };

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
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir / PDF
          </button>
          {!consent.is_signed && (
            <button
              type="button"
              onClick={() => setShowSignModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
            >
              <PenLine className="h-3.5 w-3.5" />
              Firmar consentimiento
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden print:shadow-none print:border-0">
        {/* Encabezado */}
        <div className="px-6 sm:px-8 py-5 border-b-2 border-emerald-600">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{tenantName}</p>
              <h1 className="mt-1 text-xl font-bold text-slate-900">CONSENTIMIENTO INFORMADO</h1>
            </div>
            <div className="text-left sm:text-right">
              <div className="flex items-center gap-2 sm:justify-end">
                <Hash className="h-4 w-4 text-emerald-600" />
                <p className="text-base font-bold text-emerald-700 tabular-nums">
                  {consent.consent_number || 'Sin numero'}
                </p>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {consent.issued_at ? formatDate(consent.issued_at) : '-'}
              </p>
            </div>
          </div>
        </div>

        {consent.is_signed && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 flex items-center gap-2 text-emerald-900">
            <CheckCircle2 className="h-4 w-4" />
            <p className="text-xs font-bold">FIRMADO el {consent.signed_at ? formatDate(consent.signed_at) : ''}</p>
          </div>
        )}

        {/* Datos */}
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
                </>
              )}
            </div>
            {professional && (
              <div>
                <h3 className="text-[10px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                  <Stethoscope className="h-3 w-3" />
                  Profesional
                </h3>
                <p className="font-bold text-slate-900">
                  {professional.title ? professional.title + ' ' : ''}
                  {professional.first_name} {professional.last_name}
                </p>
                {professional.specialty && (
                  <p className="text-xs text-slate-600">{professional.specialty}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tratamiento */}
        <div className="px-6 sm:px-8 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900 mb-2">{consent.treatment_type}</h2>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{consent.treatment_description}</p>
          {(consent.estimated_cost || consent.estimated_duration) && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {consent.estimated_cost && (
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <span className="font-bold">Costo estimado:</span> Q{Number(consent.estimated_cost).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </div>
              )}
              {consent.estimated_duration && (
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <span className="font-bold">Duracion estimada:</span> {consent.estimated_duration}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Riesgos */}
        {consent.risks && (
          <div className="px-6 sm:px-8 py-4 border-b border-slate-200 bg-amber-50/30">
            <h3 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Riesgos y complicaciones posibles
            </h3>
            <p className="text-xs text-slate-800 whitespace-pre-wrap">{consent.risks}</p>
          </div>
        )}

        {/* Alternativas */}
        {consent.alternatives && (
          <div className="px-6 sm:px-8 py-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Alternativas de tratamiento</h3>
            <p className="text-xs text-slate-800 whitespace-pre-wrap">{consent.alternatives}</p>
          </div>
        )}

        {/* Texto legal */}
        <div className="px-6 sm:px-8 py-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-[10px] font-bold uppercase text-slate-500 mb-2">Declaracion del paciente</h3>
          <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">{consent.legal_text}</p>
        </div>

        {/* Firma */}
        <div className="px-6 sm:px-8 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="border-t-2 border-slate-700 pt-2">
              {consent.is_signed ? (
                <>
                  <p className="text-sm font-bold text-slate-900">{consent.signed_by_name}</p>
                  {consent.signed_by_document && (
                    <p className="text-xs text-slate-600">DPI: {consent.signed_by_document}</p>
                  )}
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Firmado el {consent.signed_at ? formatDateTime(consent.signed_at) : ''}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-slate-500">Firma del paciente</p>
                  <p className="text-[10px] text-slate-400 mt-1">Pendiente de firma</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de firma */}
      {showSignModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50"
          onClick={() => setShowSignModal(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-emerald-50">
              <h3 className="text-base font-bold text-slate-900">Firmar consentimiento</h3>
              <button onClick={() => setShowSignModal(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-slate-600">
                Confirma los datos del firmante. La firma se registra con fecha y hora actual.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nombre completo *</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">DPI o documento (opcional)</label>
                <input
                  type="text"
                  value={signerDoc}
                  onChange={(e) => setSignerDoc(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSign}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <PenLine className="h-3.5 w-3.5" />
                {isPending ? 'Firmando...' : 'Confirmar firma'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(s: string): string {
  const d = new Date(s);
  return d.toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateTime(s: string): string {
  const d = new Date(s);
  return d.toLocaleString('es-GT', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
