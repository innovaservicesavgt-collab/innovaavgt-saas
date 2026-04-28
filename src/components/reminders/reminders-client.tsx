'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Clock,
  Calendar,
  Send,
  Phone,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Smartphone,
  MessageSquare,
  Users,
  CalendarClock,
} from 'lucide-react';
import {
  buildOverdueMessage,
  buildUpcomingMessage,
  buildAppointmentMessage,
  buildWhatsAppUrl,
} from '@/lib/whatsapp-templates';

type OverdueItem = {
  id: string;
  treatment_plan_id: string;
  plan_title: string;
  installment_number: number;
  due_date: string;
  amount: number;
  remaining: number;
  days: number;
  patient_id: string | null;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string | null;
};

type AppointmentItem = {
  id: string;
  appointment_date: string;
  start_time: string;
  status: string;
  is_today: boolean;
  is_tomorrow: boolean;
  reminder_sent: boolean;
  patient_id: string | null;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string | null;
  service_name: string | null;
  professional_name: string | null;
};

type Tab = 'overdue' | 'upcoming' | 'appointments';

type Props = {
  overdueList: OverdueItem[];
  upcomingList: OverdueItem[];
  appointmentsList: AppointmentItem[];
  tenantName: string;
};

export function RemindersClient({
  overdueList,
  upcomingList,
  appointmentsList,
  tenantName,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overdue');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const currentList = useMemo(() => {
    if (activeTab === 'overdue') return overdueList;
    if (activeTab === 'upcoming') return upcomingList;
    return [];
  }, [activeTab, overdueList, upcomingList]);

  const currentApptList = activeTab === 'appointments' ? appointmentsList : [];

  // Lista activa para checkbox
  const activeIds = activeTab === 'appointments'
    ? currentApptList.filter((a) => a.patient_phone).map((a) => a.id)
    : currentList.filter((s) => s.patient_phone).map((s) => s.id);

  const allSelected = activeIds.length > 0 && activeIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeIds));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Cambiar tab limpia seleccion
  const changeTab = (t: Tab) => {
    setActiveTab(t);
    setSelectedIds(new Set());
    setExpandedId(null);
  };

  // Construir mensaje segun tipo
  const buildMessageFor = (item: OverdueItem | AppointmentItem, tab: Tab): string => {
    if (tab === 'appointments') {
      const a = item as AppointmentItem;
      return buildAppointmentMessage({
        patientFirstName: a.patient_first_name,
        appointmentDate: a.appointment_date,
        startTime: a.start_time,
        serviceName: a.service_name,
        professionalName: a.professional_name,
        isToday: a.is_today,
        isTomorrow: a.is_tomorrow,
        tenantName,
      });
    }
    const s = item as OverdueItem;
    if (tab === 'overdue') {
      return buildOverdueMessage({
        patientFirstName: s.patient_first_name,
        installmentNumber: s.installment_number,
        planTitle: s.plan_title,
        dueDate: s.due_date,
        daysOverdue: s.days,
        remainingAmount: s.remaining,
        tenantName,
      });
    }
    return buildUpcomingMessage({
      patientFirstName: s.patient_first_name,
      installmentNumber: s.installment_number,
      planTitle: s.plan_title,
      dueDate: s.due_date,
      daysUntilDue: s.days,
      amount: s.remaining > 0 ? s.remaining : s.amount,
      tenantName,
    });
  };

  // Enviar uno
  const sendOne = (item: OverdueItem | AppointmentItem, tab: Tab) => {
    const phone = (item as { patient_phone: string | null }).patient_phone;
    if (!phone) {
      toast.error('Sin telefono registrado');
      return;
    }
    const msg = buildMessageFor(item, tab);
    window.open(buildWhatsAppUrl(phone, msg), '_blank');
  };

  // Enviar seleccionados
  const sendSelected = () => {
    if (selectedIds.size === 0) {
      toast.error('Selecciona al menos un destinatario');
      return;
    }

    const items: { item: OverdueItem | AppointmentItem; tab: Tab }[] = [];
    if (activeTab === 'appointments') {
      currentApptList.forEach((a) => {
        if (selectedIds.has(a.id)) items.push({ item: a, tab: 'appointments' });
      });
    } else {
      currentList.forEach((s) => {
        if (selectedIds.has(s.id)) items.push({ item: s, tab: activeTab });
      });
    }

    if (!confirm('Se abriran ' + items.length + ' pestanas de WhatsApp. Tu navegador puede pedir permiso para abrir multiples ventanas. ¿Continuar?')) {
      return;
    }

    items.forEach((entry, idx) => {
      const phone = (entry.item as { patient_phone: string | null }).patient_phone;
      if (!phone) return;
      const msg = buildMessageFor(entry.item, entry.tab);
      // Pequeno delay para evitar bloqueo de popups
      setTimeout(() => {
        window.open(buildWhatsAppUrl(phone, msg), '_blank');
      }, idx * 300);
    });

    toast.success(items.length + ' mensajes preparados. Revisa cada pestana en WhatsApp.');
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <header>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Recordatorios WhatsApp
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Genera mensajes pre-armados para cobranza y citas
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MessageSquare className="h-3.5 w-3.5" />
            Mensajes pre-armados, tu apruebas cada envio
          </div>
        </div>
      </header>

      {/* KPIs rapidos */}
      <div className="grid grid-cols-3 gap-3">
        <KpiTab
          active={activeTab === 'overdue'}
          onClick={() => changeTab('overdue')}
          label="Cuotas vencidas"
          count={overdueList.length}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="rose"
        />
        <KpiTab
          active={activeTab === 'upcoming'}
          onClick={() => changeTab('upcoming')}
          label="Proximas a vencer"
          count={upcomingList.length}
          icon={<Clock className="h-4 w-4" />}
          color="amber"
        />
        <KpiTab
          active={activeTab === 'appointments'}
          onClick={() => changeTab('appointments')}
          label="Citas proximas"
          count={appointmentsList.length}
          icon={<CalendarClock className="h-4 w-4" />}
          color="blue"
        />
      </div>

      {/* Barra de acciones */}
      {activeIds.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm flex items-center justify-between gap-3 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-semibold text-slate-700">
              {selectedIds.size === 0 ? 'Seleccionar todos' : selectedIds.size + ' seleccionados'}
            </span>
          </label>
          <button
            type="button"
            onClick={sendSelected}
            disabled={selectedIds.size === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Send className="h-4 w-4" />
            Enviar a seleccionados ({selectedIds.size})
          </button>
        </div>
      )}

      {/* CONTENIDO POR TAB */}
      {activeTab === 'overdue' && (
        <ListSection
          items={overdueList}
          empty={{ icon: <CheckCircle2 className="h-10 w-10 text-emerald-500" />, title: 'Sin cuotas vencidas', subtitle: 'Todas las cuotas estan al dia.' }}
          renderCard={(item) => (
            <ScheduleCard
              key={item.id}
              item={item}
              tab="overdue"
              selected={selectedIds.has(item.id)}
              onToggle={() => toggleOne(item.id)}
              expanded={expandedId === item.id}
              onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
              message={buildMessageFor(item, 'overdue')}
              onSend={() => sendOne(item, 'overdue')}
            />
          )}
        />
      )}

      {activeTab === 'upcoming' && (
        <ListSection
          items={upcomingList}
          empty={{ icon: <Clock className="h-10 w-10 text-slate-300" />, title: 'Sin cuotas proximas', subtitle: 'Ninguna cuota vence en los proximos 7 dias.' }}
          renderCard={(item) => (
            <ScheduleCard
              key={item.id}
              item={item}
              tab="upcoming"
              selected={selectedIds.has(item.id)}
              onToggle={() => toggleOne(item.id)}
              expanded={expandedId === item.id}
              onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
              message={buildMessageFor(item, 'upcoming')}
              onSend={() => sendOne(item, 'upcoming')}
            />
          )}
        />
      )}

      {activeTab === 'appointments' && (
        <ListSection
          items={appointmentsList}
          empty={{ icon: <Calendar className="h-10 w-10 text-slate-300" />, title: 'Sin citas proximas', subtitle: 'No hay citas programadas en los proximos 2 dias.' }}
          renderCard={(item) => (
            <AppointmentCard
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              onToggle={() => toggleOne(item.id)}
              expanded={expandedId === item.id}
              onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
              message={buildMessageFor(item, 'appointments')}
              onSend={() => sendOne(item, 'appointments')}
            />
          )}
        />
      )}

      {/* Tip */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 flex items-start gap-2 text-xs text-blue-900">
        <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-bold">Como funciona el envio masivo</p>
          <p className="mt-1">Al hacer click en "Enviar a seleccionados", se abriran multiples pestanas de WhatsApp Web (una por cada paciente). Solo necesitas presionar Enter en cada una para enviar el mensaje. Si tu navegador bloquea las ventanas, permite popups para este sitio.</p>
        </div>
      </div>
    </div>
  );
}

// ─── ListSection ─────────────────────────────────────────
function ListSection<T>({
  items,
  empty,
  renderCard,
}: {
  items: T[];
  empty: { icon: React.ReactNode; title: string; subtitle: string };
  renderCard: (item: T) => React.ReactNode;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
        <div className="flex justify-center">{empty.icon}</div>
        <p className="mt-3 text-sm font-bold text-slate-900">{empty.title}</p>
        <p className="mt-1 text-xs text-slate-500">{empty.subtitle}</p>
      </div>
    );
  }
  return <div className="space-y-2">{items.map((it) => renderCard(it))}</div>;
}

// ─── ScheduleCard ────────────────────────────────────────
function ScheduleCard({
  item,
  tab,
  selected,
  onToggle,
  expanded,
  onToggleExpand,
  message,
  onSend,
}: {
  item: OverdueItem;
  tab: 'overdue' | 'upcoming';
  selected: boolean;
  onToggle: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  message: string;
  onSend: () => void;
}) {
  const cardCls = tab === 'overdue'
    ? 'border-rose-200 bg-rose-50/30'
    : 'border-amber-200 bg-amber-50/30';

  const dayLabel = tab === 'overdue'
    ? item.days + ' dias vencida'
    : item.days === 0 ? 'Vence hoy' : item.days === 1 ? 'Vence manana' : 'Vence en ' + item.days + ' dias';

  const dayCls = tab === 'overdue' ? 'text-rose-700' : 'text-amber-700';
  const phone = item.patient_phone;
  const fullName = item.patient_first_name + ' ' + item.patient_last_name;

  return (
    <div className={'rounded-2xl border bg-white p-3 shadow-sm ' + cardCls}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          disabled={!phone}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-30 shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900 truncate">{fullName}</p>
              <p className="text-xs text-slate-600 truncate mt-0.5">
                {item.plan_title} · Cuota #{item.installment_number}
              </p>
              <p className={'text-[11px] font-bold mt-1 ' + dayCls}>{dayLabel}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-base font-bold text-slate-900 tabular-nums">
                {formatMoney(item.remaining)}
              </p>
              {phone ? (
                <p className="text-[10px] text-slate-500 mt-0.5">{phone}</p>
              ) : (
                <p className="text-[10px] text-rose-700 mt-0.5">Sin telefono</p>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={onToggleExpand}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Vista previa
            </button>
            {phone && (
              <>
                <button
                  type="button"
                  onClick={onSend}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
                >
                  <Smartphone className="h-3 w-3" />
                  WhatsApp
                </button>
                <a
                  href={'tel:' + phone}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Phone className="h-3 w-3" />
                  Llamar
                </a>
              </>
            )}
          </div>

          {expanded && (
            <div className="mt-2 rounded-lg bg-white border border-slate-200 p-2.5">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Mensaje a enviar</p>
              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans">{message}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AppointmentCard ─────────────────────────────────────
function AppointmentCard({
  item,
  selected,
  onToggle,
  expanded,
  onToggleExpand,
  message,
  onSend,
}: {
  item: AppointmentItem;
  selected: boolean;
  onToggle: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  message: string;
  onSend: () => void;
}) {
  const phone = item.patient_phone;
  const fullName = item.patient_first_name + ' ' + item.patient_last_name;

  const dateBadge = item.is_today ? { text: 'HOY', cls: 'bg-emerald-600 text-white' } :
                    item.is_tomorrow ? { text: 'MANANA', cls: 'bg-blue-600 text-white' } :
                    { text: formatShortDate(item.appointment_date), cls: 'bg-slate-200 text-slate-700' };

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/30 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          disabled={!phone}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-30 shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-slate-900 truncate">{fullName}</p>
                <span className={'inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold ' + dateBadge.cls}>
                  {dateBadge.text}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {formatTime(item.start_time)}
                {item.service_name && ' · ' + item.service_name}
              </p>
              {item.professional_name && (
                <p className="text-[11px] text-slate-500 mt-0.5">{item.professional_name}</p>
              )}
              {item.reminder_sent && (
                <p className="text-[10px] font-bold text-emerald-700 mt-1 inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Recordatorio enviado
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              {phone ? (
                <p className="text-[10px] text-slate-500">{phone}</p>
              ) : (
                <p className="text-[10px] text-rose-700">Sin telefono</p>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={onToggleExpand}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Vista previa
            </button>
            {phone && (
              <>
                <button
                  type="button"
                  onClick={onSend}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
                >
                  <Smartphone className="h-3 w-3" />
                  WhatsApp
                </button>
                <a
                  href={'tel:' + phone}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Phone className="h-3 w-3" />
                  Llamar
                </a>
              </>
            )}
          </div>

          {expanded && (
            <div className="mt-2 rounded-lg bg-white border border-slate-200 p-2.5">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Mensaje a enviar</p>
              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans">{message}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── KpiTab ──────────────────────────────────────────────
function KpiTab({
  active,
  onClick,
  label,
  count,
  icon,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon: React.ReactNode;
  color: 'rose' | 'amber' | 'blue';
}) {
  const activeCls = {
    rose: 'border-rose-500 bg-rose-50 text-rose-700',
    amber: 'border-amber-500 bg-amber-50 text-amber-700',
    blue: 'border-blue-500 bg-blue-50 text-blue-700',
  }[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={'rounded-2xl border-2 p-3 sm:p-4 transition text-left ' + (active ? activeCls : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300')}
    >
      <div className="flex items-center justify-between gap-1">
        {icon}
        <span className="text-2xl sm:text-3xl font-bold tabular-nums">{count}</span>
      </div>
      <p className="mt-1 text-[10px] sm:text-xs font-semibold leading-tight">{label}</p>
    </button>
  );
}

// ─── Helpers ─────────────────────────────────────────────
function formatMoney(n: number): string {
  return 'Q' + (Number(n) || 0).toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatShortDate(s: string): string {
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
  });
}

function formatTime(s: string): string {
  const parts = s.split(':');
  if (parts.length < 2) return s;
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return h + ':' + m + ' ' + ampm;
}
