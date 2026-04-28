import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';
import { ReportsClient } from '@/components/reports/reports-client';

type PageProps = {
  searchParams: Promise<{ period?: string }>;
};

export default async function ReportsPage({ searchParams }: PageProps) {
  await requireAuth();
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return null;

  const params = await searchParams;
  const period = params.period || '6m';
  const supabase = await createServerSupabase();

  // Calcular rango de fechas segun el periodo
  const now = new Date();
  const startDate = new Date(now);
  let monthsBack = 6;

  if (period === '7d') startDate.setDate(now.getDate() - 7);
  else if (period === '30d') startDate.setDate(now.getDate() - 30);
  else if (period === '6m') {
    startDate.setMonth(now.getMonth() - 6);
    startDate.setDate(1);
    monthsBack = 6;
  }
  else if (period === '12m') {
    startDate.setMonth(now.getMonth() - 12);
    startDate.setDate(1);
    monthsBack = 12;
  }
  else if (period === 'this_year') {
    startDate.setMonth(0);
    startDate.setDate(1);
    monthsBack = now.getMonth() + 1;
  }
  else if (period === 'last_year') {
    startDate.setFullYear(now.getFullYear() - 1);
    startDate.setMonth(0);
    startDate.setDate(1);
    monthsBack = 12;
  }

  startDate.setHours(0, 0, 0, 0);
  const startISO = startDate.toISOString();

  // 1. PAGOS del periodo (validos)
  const { data: paymentsData } = await supabase
    .from('payments')
    .select('id, amount, payment_method, paid_at, treatment_plan_id, status')
    .eq('tenant_id', profile.tenant.id)
    .eq('status', 'paid')
    .gte('paid_at', startISO)
    .order('paid_at', { ascending: true });

  const payments = (paymentsData || []) as PaymentRow[];

  // 2. COTIZACIONES del periodo (todas para conversion)
  const { data: quotationsData } = await supabase
    .from('quotations')
    .select('id, status, total_amount, total, created_at, accepted_at, rejected_at')
    .eq('tenant_id', profile.tenant.id)
    .gte('created_at', startISO);

  const quotations = (quotationsData || []) as QuotationRow[];

  // 3. PACIENTES nuevos del periodo
  const { count: newPatientsCount } = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', profile.tenant.id)
    .gte('created_at', startISO);

  // 4. TOP servicios — query items de cotizaciones aceptadas
  const acceptedQuotationIds = quotations.filter((q) => q.status === 'accepted').map((q) => q.id);
  let topServices: TopService[] = [];

  if (acceptedQuotationIds.length > 0) {
    const { data: itemsData } = await supabase
      .from('quotation_items')
      .select('description, quantity, unit_price, total, service_id')
      .in('quotation_id', acceptedQuotationIds);

    const map = new Map<string, { name: string; total: number; quantity: number }>();
    (itemsData || []).forEach((it) => {
      const key = it.description || 'Sin nombre';
      const existing = map.get(key) || { name: key, total: 0, quantity: 0 };
      existing.total += Number(it.total || 0);
      existing.quantity += Number(it.quantity || 0);
      map.set(key, existing);
    });

    topServices = Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }

  // ─── CALCULOS ─────────────────────────────────────────

  // KPI 1: Ingresos del periodo
  const totalIncome = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // KPI 2: Tasa de conversion
  const totalQuotes = quotations.length;
  const acceptedCount = quotations.filter((q) => q.status === 'accepted').length;
  const conversionRate = totalQuotes > 0 ? Math.round((acceptedCount / totalQuotes) * 100) : 0;

  // KPI 3: Ticket promedio
  const averageTicket = payments.length > 0 ? totalIncome / payments.length : 0;

  // KPI 4: Pacientes nuevos
  const newPatients = newPatientsCount || 0;

  // GRAFICO: Ingresos por mes
  const monthlyIncome: { month: string; total: number; key: string }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthDate.getFullYear() + '-' + String(monthDate.getMonth()).padStart(2, '0');
    const label = monthDate.toLocaleDateString('es-GT', { month: 'short' });
    monthlyIncome.push({ month: label, total: 0, key });
  }

  payments.forEach((p) => {
    if (!p.paid_at) return;
    const d = new Date(p.paid_at);
    const key = d.getFullYear() + '-' + String(d.getMonth()).padStart(2, '0');
    const bucket = monthlyIncome.find((m) => m.key === key);
    if (bucket) bucket.total += Number(p.amount || 0);
  });

  // EMBUDO DE CONVERSION
  const created = quotations.length;
  const sent = quotations.filter((q) =>
    q.status === 'sent' || q.status === 'accepted' || q.status === 'rejected'
  ).length;
  const accepted = acceptedCount;
  const rejected = quotations.filter((q) => q.status === 'rejected').length;

  const funnel = [
    { stage: 'Creadas', count: created, percent: 100 },
    { stage: 'Enviadas', count: sent, percent: created > 0 ? Math.round((sent / created) * 100) : 0 },
    { stage: 'Aceptadas', count: accepted, percent: created > 0 ? Math.round((accepted / created) * 100) : 0 },
    { stage: 'Rechazadas', count: rejected, percent: created > 0 ? Math.round((rejected / created) * 100) : 0 },
  ];

  // METODOS DE PAGO
  const methodMap: Record<string, number> = { cash: 0, card: 0, transfer: 0, mixed: 0 };
  payments.forEach((p) => {
    const method = p.payment_method || 'cash';
    methodMap[method] = (methodMap[method] || 0) + Number(p.amount || 0);
  });

  const paymentMethods = [
    { name: 'Efectivo', value: methodMap.cash, color: '#10b981' },
    { name: 'Tarjeta', value: methodMap.card, color: '#3b82f6' },
    { name: 'Transferencia', value: methodMap.transfer, color: '#8b5cf6' },
    { name: 'Mixto', value: methodMap.mixed, color: '#f59e0b' },
  ].filter((m) => m.value > 0);

  return (
    <ReportsClient
      period={period}
      startDate={startISO}
      totalIncome={totalIncome}
      conversionRate={conversionRate}
      averageTicket={averageTicket}
      newPatients={newPatients}
      monthlyIncome={monthlyIncome}
      funnel={funnel}
      topServices={topServices}
      paymentMethods={paymentMethods}
      tenantName={profile.tenant.brand_name || profile.tenant.name || 'Clinica'}
      paymentsCount={payments.length}
    />
  );
}

// ─── Tipos locales ──────────────────────────────────────
type PaymentRow = {
  id: string;
  amount: number;
  payment_method: string | null;
  paid_at: string | null;
  treatment_plan_id: string | null;
  status: string | null;
};

type QuotationRow = {
  id: string;
  status: string | null;
  total_amount: number | null;
  total: number | null;
  created_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
};

type TopService = {
  name: string;
  total: number;
  quantity: number;
};
