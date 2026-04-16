'use client';

interface DayData {
  date: string;
  day: string;
  signups: number;
  revenue: number;
}

export function RevenueChart({ data }: { data: DayData[] }) {
  const maxSignups = Math.max(...data.map((d) => d.signups), 1);
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const totalSignups = data.reduce((s, d) => s + d.signups, 0);
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <div>
      {/* Summary */}
      <div className="mb-5 flex items-center gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-xs font-medium text-slate-500">Nuevos clientes</span>
          </div>
          <p className="mt-1 text-xl font-bold text-slate-900">{totalSignups}</p>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-slate-500">Ingresos generados</span>
          </div>
          <p className="mt-1 text-xl font-bold text-slate-900">
            Q{totalRevenue.toLocaleString('es', { minimumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end gap-2 h-40">
        {data.map((day, i) => {
          const barHeight = maxSignups > 0 ? (day.signups / maxSignups) * 100 : 0;
          const revHeight = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
          const isToday = i === data.length - 1;

          return (
            <div key={day.date} className="group flex flex-1 flex-col items-center gap-1.5">
              {/* Tooltip */}
              <div className="flex flex-col items-center opacity-0 transition-opacity group-hover:opacity-100">
                <div className="rounded-lg bg-slate-900 px-2 py-1 text-xs text-white shadow-lg">
                  <p className="font-semibold">{day.signups} clientes</p>
                  <p className="text-slate-300">Q{day.revenue.toFixed(0)}</p>
                </div>
                <div className="h-2 w-2 rotate-45 bg-slate-900" />
              </div>

              {/* Bars container */}
              <div className="relative w-full" style={{ height: '110px' }}>
                <div className="absolute inset-x-0 bottom-0 flex items-end gap-1">
                  {/* Signups bar */}
                  <div
                    className={`flex-1 rounded-t-md transition-all ${
                      isToday ? 'bg-blue-500' : 'bg-blue-300 group-hover:bg-blue-400'
                    }`}
                    style={{ height: `${barHeight}%`, minHeight: day.signups > 0 ? '4px' : '0' }}
                  />
                  {/* Revenue bar */}
                  <div
                    className={`flex-1 rounded-t-md transition-all ${
                      isToday ? 'bg-emerald-500' : 'bg-emerald-300 group-hover:bg-emerald-400'
                    }`}
                    style={{ height: `${revHeight}%`, minHeight: day.revenue > 0 ? '4px' : '0' }}
                  />
                </div>
              </div>

              {/* Day label */}
              <span
                className={`text-xs font-medium ${
                  isToday ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                {day.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
