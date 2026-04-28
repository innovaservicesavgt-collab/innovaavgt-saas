'use client';

import Link from 'next/link';
import {
  Pill,
  ClipboardSignature,
  Eye,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import type { Prescription } from '@/lib/types/prescription';
import type { Consent } from '@/lib/types/consent';

type Props = {
  prescriptions: Prescription[];
  consents: Consent[];
};

export function DocumentsClient({ prescriptions, consents }: Props) {
  return (
    <div className="space-y-4">
      {/* Recetas */}
      <Section
        title="Recetas medicas"
        count={prescriptions.length}
        icon={<Pill className="h-4 w-4 text-violet-600" />}
      >
        {prescriptions.length === 0 ? (
          <EmptyState text="Sin recetas registradas" />
        ) : (
          <div className="space-y-2">
            {prescriptions.map((p) => <PrescriptionCard key={p.id} prescription={p} />)}
          </div>
        )}
      </Section>

      {/* Consentimientos */}
      <Section
        title="Consentimientos informados"
        count={consents.length}
        icon={<ClipboardSignature className="h-4 w-4 text-emerald-600" />}
      >
        {consents.length === 0 ? (
          <EmptyState text="Sin consentimientos registrados" />
        ) : (
          <div className="space-y-2">
            {consents.map((c) => <ConsentCard key={c.id} consent={c} />)}
          </div>
        )}
      </Section>
    </div>
  );
}

function PrescriptionCard({ prescription }: { prescription: Prescription }) {
  const isCancelled = prescription.status === 'cancelled';
  const meds = (prescription.medications || []) as { name: string }[];

  return (
    <Link
      href={'/dental/prescriptions/' + prescription.id}
      className="block rounded-xl border border-slate-200 bg-white p-3 hover:shadow-md hover:border-violet-300 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-violet-600 shrink-0" />
            <p className="font-bold text-slate-900 tabular-nums">
              {prescription.prescription_number || 'Sin numero'}
            </p>
            {isCancelled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                <XCircle className="h-3 w-3" />
                Anulada
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-700 truncate">
            {prescription.diagnosis || meds.map((m) => m.name).slice(0, 3).join(', ') || 'Sin descripcion'}
          </p>
          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {prescription.issued_at ? formatDate(prescription.issued_at) : '-'}
            </span>
            <span>{meds.length} {meds.length === 1 ? 'medicamento' : 'medicamentos'}</span>
          </div>
        </div>
        <Eye className="h-4 w-4 text-slate-400 shrink-0" />
      </div>
    </Link>
  );
}

function ConsentCard({ consent }: { consent: Consent }) {
  return (
    <Link
      href={'/dental/consents/' + consent.id}
      className="block rounded-xl border border-slate-200 bg-white p-3 hover:shadow-md hover:border-emerald-300 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <ClipboardSignature className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="font-bold text-slate-900 tabular-nums">
              {consent.consent_number || 'Sin numero'}
            </p>
            {consent.is_signed ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                Firmado
              </span>
            ) : consent.status === 'cancelled' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                <XCircle className="h-3 w-3" />
                Anulado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                <Clock className="h-3 w-3" />
                Sin firmar
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-900">{consent.treatment_type}</p>
          <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
            {consent.treatment_description}
          </p>
          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="h-3 w-3" />
            {consent.issued_at ? formatDate(consent.issued_at) : '-'}
          </div>
        </div>
        <Eye className="h-4 w-4 text-slate-400 shrink-0" />
      </div>
    </Link>
  );
}

function Section({ title, count, icon, children }: { title: string; count: number; icon: React.ReactNode; children: React.ReactNode; }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        </div>
        <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-slate-100 text-xs font-bold text-slate-700 tabular-nums">
          {count}
        </span>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-6 text-center text-sm text-slate-500">{text}</div>
  );
}

function formatDate(s: string): string {
  const d = new Date(s);
  return d.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
