'use client';

interface Props {
  activity: any[];
  currency: string;
}

const labels: Record<string, string> = {
  'update:subscription': 'Suscripción editada',
  'create:subscription': 'Suscripción creada',
  'create:payment': 'Pago registrado',
  'create:invoice': 'Factura emitida',
  'update:tenant': 'Cliente actualizado',
};

export function HistoryTab({ activity, currency }: Props) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-bold text-slate-900">Historial completo</h2>
        <p className="mt-1 text-sm text-slate-500">Todos los movimientos del cliente</p>
      </div>

      <div className="p-6 space-y-4">
        {activity.map((item, i) => {
          const key = `${item.action}:${item.entity_type}`;
          const label = labels[key] || 'Actividad';
          const amount = Number(item.new_data?.amount || 0);
          return (
            <div key={item.id || i} className="flex gap-4">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500 mt-1.5" />
                {i < activity.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-1" />}
              </div>
              <div className="pb-5 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{label}</p>
                  {amount > 0 && <span className="text-sm font-semibold text-slate-700">{currency} {amount.toFixed(0)}</span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Admin · {new Date(item.created_at).toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
