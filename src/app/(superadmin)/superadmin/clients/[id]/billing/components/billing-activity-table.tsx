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

export function BillingActivityTable({ activity, currency }: Props) {
  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getMeta = (item: any) => {
    const key = `${item.action}:${item.entity_type}`;
    const label = labels[key] || 'Actividad';
    const amount = Number(item.new_data?.amount || 0);
    let sign: '+' | '-' | '' = '';
    if (item.entity_type === 'invoice') sign = '+';
    else if (item.entity_type === 'payment' || (item.entity_type === 'subscription' && item.action === 'update')) sign = '-';
    let description = label;
    if (item.entity_type === 'invoice' && item.new_data?.invoice_number) {
      description = `Factura emitida #${item.new_data.invoice_number}`;
    }
    return { description, amount, sign };
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-bold text-slate-900">Actividad de facturación</h2>
      </div>

      {activity.length === 0 ? (
        <div className="p-12 text-center text-sm text-slate-500">Sin actividad registrada</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Usuario</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activity.map((item) => {
                const { description, amount, sign } = getMeta(item);
                return (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="whitespace-nowrap px-6 py-3.5 text-sm text-slate-600">{formatDate(item.created_at)}</td>
                    <td className="px-6 py-3.5 text-sm font-medium text-slate-900">{description}</td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-sm text-slate-600">Admin</td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-right">
                      {amount > 0 ? (
                        <span className={`text-sm font-semibold ${sign === '+' ? 'text-emerald-600' : sign === '-' ? 'text-rose-600' : 'text-slate-900'}`}>
                          {sign} {currency} {amount.toFixed(0)}
                        </span>
                      ) : <span className="text-sm text-slate-400">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-slate-100 px-6 py-3 text-right">
        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Ver todas las actividades</button>
      </div>
    </section>
  );
}
