'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  User,
  ClipboardList,
  CalendarClock,
  Wallet,
  FileText,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  Edit,
  Plus,
  CalendarPlus,
  Heart,
  Cake,
  IdCard,
  Shield,
  Users as UsersIcon,
  Briefcase,
  CalendarCheck,
  CalendarX,
  Clock,
  Stethoscope,
  CircleDollarSign,
  ArrowRight,
  Activity,
} from 'lucide-react';
import type { PatientFull, AppointmentForPatient } from '@/app/(dental)/dental/patients/[id]/page';
import { MedicalTab as MedicalTabFull } from './medical-tab';
import type { PatientMetadata } from '@/lib/types/medical-history';
type Tab = 'info' | 'medical' | 'appointments' | 'payments' | 'documents';

type Props = {
  patient: PatientFull;
  appointments: AppointmentForPatient[];
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatTime(t: string | null): string {
  if (!t) return '';
  return t.slice(0, 5);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-GT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatMoney(n: number | null): string {
  return `Q${(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function genderLabel(g: string | null): string {
  if (g === 'M') return 'Masculino';
  if (g === 'F') return 'Femenino';
  if (g === 'O') return 'Otro';
  return g || 'No especificado';
}

function statusConfig(status: string) {
  switch (status) {
    case 'confirmed':
      return { label: 'Confirmada', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'scheduled':
      return { label: 'Pendiente', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'in_progress':
      return { label: 'En curso', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'completed':
      return { label: 'Atendida', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
    case 'cancelled':
      return { label: 'Cancelada', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'no_show':
      return { label: 'No asistió', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: status, cls: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────
export function PatientDetailClient({ patient, appointments }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('info');

  const age = calculateAge(patient.date_of_birth);
  const fullName = `${patient.first_name} ${patient.last_name}`;
  const hasAlerts = Boolean(
    (patient.allergies && patient.allergies.trim()) ||
    (patient.medical_notes && patient.medical_notes.trim())
  );

  // Próxima cita
  const today = new Date().toISOString().split('T')[0];
  const upcomingAppt = appointments
    .filter((a) =>
      a.appointment_date >= today &&
      ['scheduled', 'confirmed'].includes(a.status)
    )
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))[0];

  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const totalSpent = appointments
    .filter((a) => a.status === 'completed')
    .reduce((sum, a) => sum + Number(a.price || 0), 0);

  return (
    <div className="space-y-4">
      {/* HEADER PACIENTE */}
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Avatar */}
            <div className="shrink-0 mx-auto sm:mx-0">
              {patient.photo_url ? (
                <img
                  src={patient.photo_url}
                  alt={fullName}
                  className="h-24 w-24 rounded-2xl object-cover ring-4 ring-emerald-50"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-emerald-100 text-3xl font-bold text-emerald-700 ring-4 ring-emerald-50">
                  {getInitials(patient.first_name, patient.last_name)}
                </div>
              )}
            </div>

            {/* Info principal */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">
                      {fullName}
                    </h1>
                    {patient.is_active === false && (
                      <span className="rounded-md bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700">
                        Inactivo
                      </span>
                    )}
                    {hasAlerts && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                        <AlertTriangle className="h-3 w-3" />
                        Alertas
                      </span>
                    )}
                  </div>

                  {/* Datos de identidad */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                    {age !== null && (
                      <span className="inline-flex items-center gap-1">
                        <Cake className="h-3.5 w-3.5 text-slate-400" />
                        {age} años
                      </span>
                    )}
                    {patient.gender && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span>{genderLabel(patient.gender)}</span>
                      </>
                    )}
                    {patient.document_number && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="inline-flex items-center gap-1">
                          <IdCard className="h-3.5 w-3.5 text-slate-400" />
                          {patient.document_type || 'Doc'} {patient.document_number}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Contacto */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                    {patient.phone && (
                      <a href={`tel:${patient.phone}`} className="inline-flex items-center gap-1.5 text-slate-700 hover:text-emerald-600 transition-colors">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {patient.phone}
                      </a>
                    )}
                    {patient.email && (
                      <a href={`mailto:${patient.email}`} className="inline-flex items-center gap-1.5 text-slate-700 hover:text-emerald-600 transition-colors">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate max-w-[200px]">{patient.email}</span>
                      </a>
                    )}
                    {patient.city && (
                      <span className="inline-flex items-center gap-1.5 text-slate-600">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {patient.city}
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                  <Link
                    href={`/dental/appointments/new?patient_id=${patient.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    Nueva cita
                  </Link>
                  <Link
                    href={`/dental/patients/${patient.id}/edit`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Link>
                </div>
              </div>

              {/* Mini stats */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MiniStat
                  label="Próxima cita"
                  value={
                    upcomingAppt
                      ? formatDateShort(upcomingAppt.appointment_date)
                      : 'Sin agendar'
                  }
                  highlight={!!upcomingAppt}
                  icon={<CalendarCheck className="h-3.5 w-3.5" />}
                />
                <MiniStat
                  label="Citas atendidas"
                  value={completedCount.toString()}
                  icon={<Activity className="h-3.5 w-3.5" />}
                />
                <MiniStat
                  label="Total facturado"
                  value={formatMoney(totalSpent)}
                  icon={<CircleDollarSign className="h-3.5 w-3.5" />}
                />
                <MiniStat
                  label="Paciente desde"
                  value={formatDateShort(patient.created_at.split('T')[0])}
                  icon={<Clock className="h-3.5 w-3.5" />}
                />
              </div>
            </div>
          </div>

          {/* Banda de alertas */}
          {hasAlerts && (
            <div className="mt-5 rounded-xl border-2 border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <div className="space-y-1 text-sm">
                  {patient.allergies && (
                    <p className="text-amber-900">
                      <strong className="font-bold">Alergias: </strong>
                      {patient.allergies}
                    </p>
                  )}
                  {patient.medical_notes && (
                    <p className="text-amber-900">
                      <strong className="font-bold">Notas médicas: </strong>
                      {patient.medical_notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TABS */}
        <div className="border-t border-slate-200 px-2 sm:px-4 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            <TabButton id="info" active={activeTab} onClick={setActiveTab} icon={<User className="h-4 w-4" />} label="Información" />
            <TabButton id="medical" active={activeTab} onClick={setActiveTab} icon={<ClipboardList className="h-4 w-4" />} label="Expediente" />
            <TabButton id="appointments" active={activeTab} onClick={setActiveTab} icon={<CalendarClock className="h-4 w-4" />} label={`Citas (${appointments.length})`} />
            <TabButton id="payments" active={activeTab} onClick={setActiveTab} icon={<Wallet className="h-4 w-4" />} label="Pagos" />
            <TabButton id="documents" active={activeTab} onClick={setActiveTab} icon={<FileText className="h-4 w-4" />} label="Documentos" />
          </div>
        </div>
      </section>

      {/* CONTENIDO DEL TAB */}
      {activeTab === 'info' && <InfoTab patient={patient} />}
      {activeTab === 'medical' && (
  <MedicalTabFull
    patientId={patient.id}
    metadata={patient.metadata as PatientMetadata | null}
    patientAllergiesText={patient.allergies}
    patientBloodType={patient.blood_type}
    patientBirthDate={patient.date_of_birth}
  />
)}
      {activeTab === 'appointments' && <AppointmentsTab appointments={appointments} patientId={patient.id} />}
      {activeTab === 'payments' && <PaymentsTab patientId={patient.id} appointments={appointments} />}
      {activeTab === 'documents' && <DocumentsTab patientId={patient.id} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Subcomponentes
// ─────────────────────────────────────────────────────────────
function MiniStat({
  label,
  value,
  highlight,
  icon,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50'}`}>
      <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide ${highlight ? 'text-emerald-700' : 'text-slate-500'}`}>
        {icon}
        {label}
      </div>
      <div className={`mt-1 text-sm font-bold truncate ${highlight ? 'text-emerald-700' : 'text-slate-900'}`}>
        {value}
      </div>
    </div>
  );
}

function TabButton({
  id,
  active,
  onClick,
  icon,
  label,
}: {
  id: Tab;
  active: Tab;
  onClick: (t: Tab) => void;
  icon: React.ReactNode;
  label: string;
}) {
  const isActive = active === id;
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap ${
        isActive ? 'text-emerald-700' : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      {icon}
      {label}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t" />
      )}
    </button>
  );
}

// ─────────────── TAB: INFORMACIÓN ───────────────
function InfoTab({ patient }: { patient: PatientFull }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Datos personales */}
      <Section title="Datos personales" icon={<User className="h-4 w-4 text-blue-600" />}>
        <DataRow label="Nombre completo" value={`${patient.first_name} ${patient.last_name}`} />
        <DataRow label="Fecha de nacimiento" value={patient.date_of_birth ? formatDate(patient.date_of_birth) : null} />
        <DataRow label="Género" value={genderLabel(patient.gender)} />
        <DataRow label="Tipo de documento" value={patient.document_type} />
        <DataRow label="Número de documento" value={patient.document_number} />
        <DataRow label="Ocupación" value={patient.occupation} icon={<Briefcase className="h-3.5 w-3.5" />} />
      </Section>

      {/* Contacto */}
      <Section title="Contacto" icon={<Phone className="h-4 w-4 text-emerald-600" />}>
        <DataRow label="Teléfono principal" value={patient.phone} icon={<Phone className="h-3.5 w-3.5" />} />
        <DataRow label="Teléfono secundario" value={patient.phone_secondary} />
        <DataRow label="Correo electrónico" value={patient.email} icon={<Mail className="h-3.5 w-3.5" />} />
        <DataRow label="Dirección" value={patient.address} />
        <DataRow label="Ciudad" value={patient.city} icon={<MapPin className="h-3.5 w-3.5" />} />
      </Section>

      {/* Contacto de emergencia */}
      <Section title="Contacto de emergencia" icon={<Heart className="h-4 w-4 text-rose-600" />}>
        <DataRow label="Nombre" value={patient.emergency_contact_name} />
        <DataRow label="Teléfono" value={patient.emergency_contact_phone} icon={<Phone className="h-3.5 w-3.5" />} />
      </Section>

      {/* Responsable (si es menor) */}
      {(patient.responsible_name || patient.responsible_phone) && (
        <Section title="Responsable / Tutor" icon={<UsersIcon className="h-4 w-4 text-violet-600" />}>
          <DataRow label="Nombre" value={patient.responsible_name} />
          <DataRow label="Teléfono" value={patient.responsible_phone} icon={<Phone className="h-3.5 w-3.5" />} />
          <DataRow label="Parentesco" value={patient.responsible_relationship} />
        </Section>
      )}

      {/* Seguro médico */}
      {(patient.insurance_provider || patient.insurance_number) && (
        <Section title="Seguro médico" icon={<Shield className="h-4 w-4 text-blue-600" />}>
          <DataRow label="Aseguradora" value={patient.insurance_provider} />
          <DataRow label="Número de póliza" value={patient.insurance_number} />
        </Section>
      )}

      {/* Captación */}
      <Section title="Información adicional" icon={<ClipboardList className="h-4 w-4 text-slate-600" />}>
        <DataRow label="Cómo nos conoció" value={patient.source} />
        <DataRow label="Fecha de registro" value={formatDate(patient.created_at.split('T')[0])} />
        {patient.tags && patient.tags.length > 0 && (
          <div className="py-2">
            <div className="text-xs font-medium text-slate-500 mb-1.5">Etiquetas</div>
            <div className="flex flex-wrap gap-1.5">
              {patient.tags.map((tag) => (
                <span key={tag} className="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

// ─────────────── TAB: EXPEDIENTE ───────────────
function MedicalTab({ patient }: { patient: PatientFull }) {
  const hasMedical = patient.allergies || patient.medical_notes || patient.blood_type;

  if (!hasMedical) {
    return (
      <Section title="Expediente clínico" icon={<ClipboardList className="h-4 w-4 text-emerald-600" />}>
        <div className="py-8 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Sin información clínica</p>
          <p className="mt-1 text-xs text-slate-500">
            Agrega antecedentes médicos, alergias y notas clínicas
          </p>
          <Link
            href={`/dental/patients/${patient.id}/edit`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Agregar información clínica
          </Link>
        </div>
      </Section>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Datos clínicos básicos */}
      <Section title="Datos clínicos" icon={<Heart className="h-4 w-4 text-rose-600" />}>
        <DataRow label="Tipo de sangre" value={patient.blood_type} />
      </Section>

      {/* Alergias */}
      {patient.allergies && (
        <Section
          title="Alergias"
          icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
          accent="amber"
        >
          <p className="text-sm text-amber-900 leading-relaxed py-2">
            {patient.allergies}
          </p>
        </Section>
      )}

      {/* Notas médicas */}
      {patient.medical_notes && (
        <Section
          title="Notas médicas"
          icon={<ClipboardList className="h-4 w-4 text-blue-600" />}
        >
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap py-2">
            {patient.medical_notes}
          </p>
        </Section>
      )}

      {/* Placeholder para odontograma */}
      <Section
        title="Odontograma"
        icon={<Stethoscope className="h-4 w-4 text-emerald-600" />}
      >
        <div className="py-6 text-center">
          <Stethoscope className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-semibold text-slate-700">Próximamente</p>
          <p className="mt-1 text-xs text-slate-500">
            Diagrama dental interactivo con piezas, caras y tratamientos
          </p>
        </div>
      </Section>
    </div>
  );
}

// ─────────────── TAB: CITAS ───────────────
function AppointmentsTab({
  appointments,
  patientId,
}: {
  appointments: AppointmentForPatient[];
  patientId: string;
}) {
  const today = new Date().toISOString().split('T')[0];
  const upcoming = appointments.filter(
    (a) => a.appointment_date >= today && !['cancelled', 'completed', 'no_show'].includes(a.status)
  );
  const past = appointments.filter(
    (a) => a.appointment_date < today || ['cancelled', 'completed', 'no_show'].includes(a.status)
  );

  return (
    <div className="space-y-4">
      {/* Próximas */}
      <Section
        title={`Próximas citas (${upcoming.length})`}
        icon={<CalendarCheck className="h-4 w-4 text-emerald-600" />}
        action={
          <Link
            href={`/dental/appointments/new?patient_id=${patientId}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva
          </Link>
        }
      >
        {upcoming.length === 0 ? (
          <div className="py-6 text-center">
            <CalendarX className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-600">Sin citas próximas</p>
            <Link
              href={`/dental/appointments/new?patient_id=${patientId}`}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Agendar cita
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcoming.map((a) => (
              <AppointmentItem key={a.id} apt={a} />
            ))}
          </div>
        )}
      </Section>

      {/* Historial */}
      <Section title={`Historial (${past.length})`} icon={<Clock className="h-4 w-4 text-slate-600" />}>
        {past.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Sin historial de citas</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {past.map((a) => (
              <AppointmentItem key={a.id} apt={a} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function AppointmentItem({ apt }: { apt: AppointmentForPatient }) {
  const cfg = statusConfig(apt.status);
  const profName = apt.professionals
    ? `${apt.professionals.title || ''} ${apt.professionals.first_name} ${apt.professionals.last_name}`.trim()
    : 'Sin profesional';

  return (
    <Link
      href={`/dental/appointments/${apt.id}`}
      className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-4 px-4 transition-colors"
    >
      <div className="shrink-0 text-center min-w-[60px]">
        <div className="text-xs font-bold text-slate-900">
          {formatDateShort(apt.appointment_date)}
        </div>
        <div className="text-xs text-slate-500">{formatTime(apt.start_time)}</div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">
          {apt.services?.name || apt.reason || 'Consulta'}
        </p>
        <p className="text-xs text-slate-500 truncate">{profName}</p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {apt.price != null && apt.price > 0 && (
          <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
            {formatMoney(apt.price)}
          </span>
        )}
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.cls}`}>
          {cfg.label}
        </span>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
    </Link>
  );
}

// ─────────────── TAB: PAGOS ───────────────
function PaymentsTab({
  patientId,
  appointments,
}: {
  patientId: string;
  appointments: AppointmentForPatient[];
}) {
  const completed = appointments.filter((a) => a.status === 'completed');
  const totalCharged = completed.reduce((sum, a) => sum + Number(a.price || 0), 0);

  return (
    <Section title="Estado de cuenta" icon={<Wallet className="h-4 w-4 text-violet-600" />}>
      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3">
        <div className="rounded-xl bg-violet-50 p-3">
          <div className="text-xs font-medium text-violet-700">Total facturado</div>
          <div className="mt-1 text-xl font-bold text-violet-900">
            {formatMoney(totalCharged)}
          </div>
          <div className="text-[10px] text-violet-600 mt-0.5">
            {completed.length} {completed.length === 1 ? 'cita' : 'citas'} atendidas
          </div>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3">
          <div className="text-xs font-medium text-emerald-700">Pagado</div>
          <div className="mt-1 text-xl font-bold text-emerald-900">{formatMoney(0)}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Próximamente</div>
        </div>
        <div className="rounded-xl bg-amber-50 p-3 col-span-2 sm:col-span-1">
          <div className="text-xs font-medium text-amber-700">Saldo pendiente</div>
          <div className="mt-1 text-xl font-bold text-amber-900">
            {formatMoney(totalCharged)}
          </div>
          <div className="text-[10px] text-amber-600 mt-0.5">A registrar pagos</div>
        </div>
      </div>

      {/* Mensaje placeholder */}
      <div className="mt-4 rounded-xl border-2 border-dashed border-slate-200 p-6 text-center">
        <Wallet className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-700">
          Módulo de pagos en desarrollo
        </p>
        <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
          Próximamente podrás registrar abonos, ver historial de pagos, generar recibos
          y administrar saldos pendientes.
        </p>
      </div>
    </Section>
  );
}

// ─────────────── TAB: DOCUMENTOS ───────────────
function DocumentsTab({ patientId }: { patientId: string }) {
  return (
    <Section title="Documentos" icon={<FileText className="h-4 w-4 text-blue-600" />}>
      <div className="py-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-slate-300" />
        <p className="mt-3 text-base font-bold text-slate-900">Sin documentos</p>
        <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
          Aquí podrás subir radiografías, consentimientos firmados, recetas, fotografías clínicas y más.
        </p>
        <button
          type="button"
          disabled
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Subir documento (próximamente)
        </button>
      </div>
    </Section>
  );
}

// ─────────────── COMPONENTES BASE ───────────────
function Section({
  title,
  icon,
  children,
  action,
  accent,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  accent?: 'amber';
}) {
  const borderClass = accent === 'amber' ? 'border-amber-200' : 'border-slate-200';
  return (
    <section className={`rounded-3xl border ${borderClass} bg-white shadow-sm`}>
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        </div>
        {action}
      </div>
      <div className="px-5 py-2">{children}</div>
    </section>
  );
}

function DataRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-b-0">
      <div className="flex items-center gap-1.5 min-w-0">
        {icon && <span className="text-slate-400">{icon}</span>}
        <span className="text-xs font-medium text-slate-500 truncate">{label}</span>
      </div>
      <span className={`text-sm text-right truncate ${value ? 'text-slate-900 font-medium' : 'text-slate-400 italic'}`}>
        {value || 'No registrado'}
      </span>
    </div>
  );
}