'use client';
import { useState } from 'react';

interface Props {
  patientId: string;
  appointments: any[];
  treatments: any[];
  payments: any[];
  images: any[];
  allergies: string | null;
  medicalNotes: string | null;
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700', confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-slate-100 text-slate-600', cancelled: 'bg-red-100 text-red-600',
  in_progress: 'bg-purple-100 text-purple-700', no_show: 'bg-amber-100 text-amber-700',
  planned: 'bg-blue-100 text-blue-700', paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700', partial: 'bg-orange-100 text-orange-700',
};
const statusLabels: Record<string, string> = {
  scheduled: 'Agendada', confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada',
  in_progress: 'En curso', no_show: 'No asistio', planned: 'Planificado',
  paid: 'Pagado', pending: 'Pendiente', partial: 'Parcial', rescheduled: 'Reagendada',
};

export function PatientTabs({ patientId, appointments, treatments, payments, images, allergies, medicalNotes }: Props) {
  const [tab, setTab] = useState('history');

  const tabs = [
    { id: 'history', label: 'Historial', count: appointments.length },
    { id: 'treatments', label: 'Tratamientos', count: treatments.length },
    { id: 'images', label: 'Imagenes', count: images.length },
    { id: 'payments', label: 'Pagos', count: payments.length },
    { id: 'notes', label: 'Notas' },
  ];

  return (
    <div>
      {/* Tab buttons - scrollable on mobile */}
      <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200 mb-4">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={"flex-shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-all " +
              (tab === t.id ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700")}>
            {t.label} {t.count !== undefined && <span className="ml-1 text-xs opacity-60">({t.count})</span>}
          </button>
        ))}
      </div>

      {/* History tab */}
      {tab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {appointments.length === 0 ? <p className="p-8 text-center text-slate-400">Sin historial de citas</p> :
            appointments.map((a: any) => (
              <div key={a.id} className="px-4 py-3.5 flex items-center gap-3">
                <div className="w-12 text-center flex-shrink-0">
                  <p className="text-xs text-slate-400">{new Date(a.appointment_date + 'T12:00:00').toLocaleDateString('es', { month: 'short' })}</p>
                  <p className="text-lg font-bold text-slate-700">{new Date(a.appointment_date + 'T12:00:00').getDate()}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{(a.services as any)?.name || 'Consulta'}</p>
                  <p className="text-xs text-slate-400">{(a.professionals as any)?.title} {(a.professionals as any)?.first_name} {(a.professionals as any)?.last_name} - {a.start_time?.slice(0,5)}</p>
                </div>
                <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + (statusColors[a.status] || 'bg-slate-100 text-slate-600')}>{statusLabels[a.status] || a.status}</span>
                {a.price && <span className="text-sm font-medium text-slate-600">Q{Number(a.price).toFixed(2)}</span>}
              </div>
            ))}
        </div>
      )}

      {/* Treatments tab */}
      {tab === 'treatments' && (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {treatments.length === 0 ? <p className="p-8 text-center text-slate-400">Sin tratamientos registrados</p> :
            treatments.map((t: any) => (
              <div key={t.id} className="px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">{t.title}</p>
                  <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + (statusColors[t.status] || 'bg-slate-100')}>{statusLabels[t.status] || t.status}</span>
                </div>
                {t.description && <p className="text-xs text-slate-500 mt-1">{t.description}</p>}
                <div className="flex gap-3 mt-2 text-xs text-slate-400">
                  {t.tooth_number && <span>Pieza: {t.tooth_number}</span>}
                  {(t.professionals as any)?.first_name && <span>{(t.professionals as any).title} {(t.professionals as any).first_name} {(t.professionals as any).last_name}</span>}
                  {t.cost && <span className="font-medium text-slate-600">Q{Number(t.cost).toFixed(2)}</span>}
                  <span>{new Date(t.created_at).toLocaleDateString('es')}</span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Images tab */}
      {tab === 'images' && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.length === 0 ? <p className="col-span-full p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">Sin imagenes</p> :
              images.map((img: any) => (
                <div key={img.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden group">
                  <div className="aspect-square bg-slate-100 relative">
                    <img src={img.image_url} alt={img.title || ''} className="w-full h-full object-cover" />
                    <span className={"absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium " +
                      (img.image_type === 'xray' ? 'bg-blue-600 text-white' : img.image_type === 'photo' ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-white')}>
                      {img.image_type === 'xray' ? 'Rayos X' : img.image_type === 'photo' ? 'Foto' : img.image_type}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium text-slate-700 truncate">{img.title || 'Sin titulo'}</p>
                    <p className="text-xs text-slate-400">{new Date(img.created_at).toLocaleDateString('es')}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Payments tab */}
      {tab === 'payments' && (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {payments.length === 0 ? <p className="p-8 text-center text-slate-400">Sin pagos registrados</p> :
            payments.map((p: any) => (
              <div key={p.id} className="px-4 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">Q{Number(p.amount).toFixed(2)}</p>
                  <p className="text-xs text-slate-400">{p.payment_method === 'cash' ? 'Efectivo' : p.payment_method === 'card' ? 'Tarjeta' : p.payment_method === 'transfer' ? 'Transferencia' : p.payment_method} - {new Date(p.paid_at || p.created_at).toLocaleDateString('es')}</p>
                  {p.notes && <p className="text-xs text-slate-400 mt-0.5">{p.notes}</p>}
                </div>
                <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + (statusColors[p.status] || 'bg-slate-100')}>{statusLabels[p.status] || p.status}</span>
              </div>
            ))}
        </div>
      )}

      {/* Notes tab */}
      {tab === 'notes' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-red-700 mb-1">Alergias</h4>
            <p className="text-sm text-slate-600 bg-red-50 p-3 rounded-lg">{allergies || 'Ninguna registrada'}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-1">Notas medicas</h4>
            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">{medicalNotes || 'Sin notas'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
