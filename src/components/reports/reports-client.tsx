'use client';

import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Target,
  CircleDollarSign,
  Users,
  Calendar,
  Send,
  Printer,
  Trophy,
  CreditCard,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

type MonthData = { month: string; total: number; key: string };
type FunnelStage = { stage: string; count: number; percent: number };
type TopService = { name: string; total: number; quantity: number };
type PaymentMethod = { name: string; value: number; color: string };

type Props = {
  period: string;
  startDate: string;
  totalIncome: number;
  conversionRate: number;
  averageTicket: number;
  newPatients: number;
  monthlyIncome: MonthData[];
  funnel: FunnelStage[];
  topServices: TopService[];
  paymentMethods: PaymentMethod[];
  tenantName: string;
  paymentsCount: number;
};

export function ReportsClient({
  period,
  startDate,
  totalIncome,
  conversionRate,
  averageTicket,
  newPatients,
  monthlyIncome,
  funnel,
  topServices,
  paymentMethods,
  tenantName,
  paymentsCount,
}: Props) {
  const router = useRouter();

  const handlePeriodChange = (newPeriod: string) => {
    router.push('/dental/dashboard/reports?period=' + newPeriod);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const periodLabel = getPeriodLabel(period);
    const lines = [
      '*Reporte ' + tenantName + '*',
      'Periodo: ' + periodLabel,
      '',
      'Ingresos: ' + formatMoney(totalIncome),
      'Conversion: ' + conversionRate + '%',
      'Ticket promedio: ' + formatMoney(averageTicket),
      'Pacientes nuevos: ' + newPatients,
      'Pagos recibidos: ' + paymentsCount,
      '',
    ];
    if (topServices.length > 0) {
      lines.push('Top servicios:');
      topServices.forEach((s, idx) => {
        lines.push((idx + 1) + '. ' + s.name + ' - ' + formatMoney(s.total));
      });
    }
    const text = encodeURIComponent(lines.join('\n'));
    window.open('https://wa.me/?text=' + text, '_blank');
  };

  const totalPaymentsByMethod = paymentMethods.reduce((sum, m) => sum + m.value, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Reportes ejecutivos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Indicadores clave de tu clinica
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500"
          >
            <option value="7d">Ultimos 7 dias</option>
            <option value="30d">Ultimos 30 dias</option>
            <option value="6m">Ultimos 6 meses</option>
            <option value="12m">Ultimos 12 meses</option>
            <option value="this_year">Este ano</option>
            <option value="last_year">Ano anterior</option>
          </select>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Send className="h-3.5 w-3.5" />
            Compartir resumen
          </button>
        </div>
      </header>

      {/* Periodo activo */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-2 flex items-center gap-2 text-xs text-blue-900">
        <Calendar className="h-3.5 w-3.5" />
        <span className="font-semibold">Periodo: {getPeriodLabel(period)}</span>
        <span className="text-blue-700">desde {formatDate(startDate)}</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          label="Ingresos del periodo"
          value={formatMoney(totalIncome)}
          sub={paymentsCount + ' pagos recibidos'}
          icon={<TrendingUp className="h-4 w-4" />}
          color="emerald"
        />
        <Kpi
          label="Conversion cotizaciones"
          value={conversionRate + '%'}
          sub={funnel[2].count + ' de ' + funnel[0].count + ' aceptadas'}
          icon={<Target className="h-4 w-4" />}
          color="blue"
        />
        <Kpi
          label="Ticket promedio"
          value={formatMoney(averageTicket)}
          sub="Por pago recibido"
          icon={<CircleDollarSign className="h-4 w-4" />}
          color="violet"
        />
        <Kpi
          label="Pacientes nuevos"
          value={newPatients.toString()}
          sub="Registrados"
          icon={<Users className="h-4 w-4" />}
          color="amber"
        />
      </div>

      {/* Grafico de ingresos por mes */}
      <Section title="Ingresos por mes" icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}>
        {monthlyIncome.length === 0 ? (
          <EmptyMini text="No hay datos en este periodo" />
        ) : (
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyIncome} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => 'Q' + v.toLocaleString()} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v: number) => [formatMoney(v), 'Ingresos']}
                />
                <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Embudo de conversion */}
        <Section title="Embudo de conversion" icon={<Target className="h-4 w-4 text-blue-600" />}>
          <div className="space-y-2.5">
            {funnel.map((stage, idx) => {
              const colors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-rose-500'];
              const labels = ['text-blue-700', 'text-violet-700', 'text-emerald-700', 'text-rose-700'];
              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={'text-xs font-semibold ' + (labels[idx] || 'text-slate-700')}>
                      {stage.stage}
                    </span>
                    <span className="text-xs font-bold text-slate-900 tabular-nums">
                      {stage.count} ({stage.percent}%)
                    </span>
                  </div>
                  <div className="h-7 rounded-lg bg-slate-100 overflow-hidden relative">
                    <div
                      className={'h-full ' + (colors[idx] || 'bg-slate-400') + ' transition-all'}
                      style={{ width: stage.percent + '%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {funnel[0].count === 0 && (
            <p className="mt-3 text-xs text-slate-500 text-center">Sin cotizaciones en este periodo</p>
          )}
        </Section>

        {/* Metodos de pago */}
        <Section title="Distribucion por metodo de pago" icon={<CreditCard className="h-4 w-4 text-violet-600" />}>
          {paymentMethods.length === 0 ? (
            <EmptyMini text="Sin pagos en este periodo" />
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div style={{ width: 160, height: 160 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={paymentMethods}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {paymentMethods.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                      formatter={(v: number) => formatMoney(v)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5 w-full">
                {paymentMethods.map((m) => {
                  const pct = totalPaymentsByMethod > 0 ? Math.round((m.value / totalPaymentsByMethod) * 100) : 0;
                  return (
                    <div key={m.name} className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: m.color }} />
                        <span className="text-slate-700 truncate">{m.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-slate-900 tabular-nums">{formatMoney(m.value)}</span>
                        <span className="text-slate-500 tabular-nums w-9 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Section>
      </div>

      {/* Top servicios */}
      <Section title="Top 5 servicios mas vendidos" icon={<Trophy className="h-4 w-4 text-amber-600" />}>
        {topServices.length === 0 ? (
          <EmptyMini text="Sin servicios facturados en este periodo" />
        ) : (
          <div className="space-y-2">
            {topServices.map((s, idx) => {
              const maxTotal = topServices[0].total;
              const widthPct = maxTotal > 0 ? Math.max(8, (s.total / maxTotal) * 100) : 0;
              return (
                <div key={s.name} className="flex items-center gap-3">
                  <span className={'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 ' + (idx === 0 ? 'bg-amber-100 text-amber-700' : idx < 3 ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-500')}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-slate-900 truncate">{s.name}</span>
                      <span className="text-sm font-bold text-emerald-700 tabular-nums shrink-0">
                        {formatMoney(s.total)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: widthPct + '%' }} />
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {s.quantity} {s.quantity === 1 ? 'unidad' : 'unidades'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

// ─── Subcomponentes ──────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode; }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
        {icon}
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function Kpi({ label, value, sub, icon, color }: { label: string; value: string; sub?: string; icon: React.ReactNode; color: 'emerald' | 'amber' | 'violet' | 'blue'; }) {
  const cls = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    violet: 'bg-violet-50 text-violet-700 ring-violet-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  }[color];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className={'flex h-7 w-7 items-center justify-center rounded-lg ring-1 ' + cls}>
          {icon}
        </span>
      </div>
      <div className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-slate-500 truncate">{sub}</div>}
    </div>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="py-8 text-center text-sm text-slate-500">{text}</div>
  );
}

// ─── Helpers ─────────────────────────────────────────────
function getPeriodLabel(period: string): string {
  if (period === '7d') return 'Ultimos 7 dias';
  if (period === '30d') return 'Ultimos 30 dias';
  if (period === '6m') return 'Ultimos 6 meses';
  if (period === '12m') return 'Ultimos 12 meses';
  if (period === 'this_year') return 'Este ano';
  if (period === 'last_year') return 'Ano anterior';
  return period;
}

function formatMoney(n: number): string {
  return 'Q' + (Number(n) || 0).toLocaleString('es-GT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDate(s: string): string {
  const d = new Date(s);
  return d.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
