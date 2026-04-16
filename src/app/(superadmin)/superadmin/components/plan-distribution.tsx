'use client';

interface Props {
  planCounts: Record<string, number>;
}

const planConfig: Record<string, { label: string; color: string; bg: string }> = {
  trial: { label: 'Prueba', color: 'bg-violet-500', bg: 'bg-violet-100' },
  basic: { label: 'Básico', color: 'bg-blue-500', bg: 'bg-blue-100' },
  professional: { label: 'Profesional', color: 'bg-emerald-500', bg: 'bg-emerald-100' },
  enterprise: { label: 'Enterprise', color: 'bg-amber-500', bg: 'bg-amber-100' },
  'sin plan': { label: 'Sin plan', color: 'bg-slate-400', bg: 'bg-slate-100' },
};

export function PlanDistribution({ planCounts }: Props) {
  const total = Object.values(planCounts).reduce((s, v) => s + v, 0);
  const entries = Object.entries(planCounts).sort((a, b) => b[1] - a[1]);

  if (total === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center text-center">
        <p className="text-sm text-slate-500">Sin clientes registrados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stacked bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
        {entries.map(([plan, count]) => {
          const pct = (count / total) * 100;
          const config = planConfig[plan] || planConfig['sin plan'];
          return (
            <div
              key={plan}
              className={config.color}
              style={{ width: `${pct}%` }}
              title={`${config.label}: ${count}`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="space-y-2.5">
        {entries.map(([plan, count]) => {
          const pct = ((count / total) * 100).toFixed(1);
          const config = planConfig[plan] || planConfig['sin plan'];
          return (
            <div key={plan} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`h-2.5 w-2.5 rounded-full ${config.color}`} />
                <span className="text-sm font-medium text-slate-700">{config.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-900">{count}</span>
                <span className="w-12 text-right text-xs font-medium text-slate-500">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
