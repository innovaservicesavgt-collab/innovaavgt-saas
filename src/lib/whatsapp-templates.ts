// Plantillas de mensajes WhatsApp para recordatorios

export type OverdueData = {
  patientFirstName: string;
  installmentNumber: number;
  planTitle: string;
  dueDate: string;
  daysOverdue: number;
  remainingAmount: number;
  tenantName: string;
};

export type UpcomingData = {
  patientFirstName: string;
  installmentNumber: number;
  planTitle: string;
  dueDate: string;
  daysUntilDue: number;
  amount: number;
  tenantName: string;
};

export type AppointmentData = {
  patientFirstName: string;
  appointmentDate: string;
  startTime: string;
  serviceName: string | null;
  professionalName: string | null;
  isToday: boolean;
  isTomorrow: boolean;
  tenantName: string;
};

// ─── Plantilla: Cuota vencida ────────────────────────
export function buildOverdueMessage(data: OverdueData): string {
  const lines = [
    'Hola ' + data.patientFirstName + ',',
    '',
    'Te recordamos que tu cuota #' + data.installmentNumber + ' del plan',
    '"' + data.planTitle + '" sigue pendiente.',
    '',
    'Vencimiento: ' + formatDate(data.dueDate),
    'Dias vencidos: ' + data.daysOverdue,
    'Saldo: ' + formatMoney(data.remainingAmount),
    '',
    'Por favor pasa con nosotros para ponerte al dia,',
    'o avisanos si necesitas ayuda con la fecha.',
    '',
    data.tenantName,
  ];
  return lines.join('\n');
}

// ─── Plantilla: Cuota proxima a vencer ───────────────
export function buildUpcomingMessage(data: UpcomingData): string {
  let timeRef = '';
  if (data.daysUntilDue === 0) timeRef = 'HOY';
  else if (data.daysUntilDue === 1) timeRef = 'manana';
  else timeRef = 'en ' + data.daysUntilDue + ' dias';

  const lines = [
    'Hola ' + data.patientFirstName + ',',
    '',
    'Te recordamos que tu cuota #' + data.installmentNumber + ' del plan',
    '"' + data.planTitle + '" vence ' + timeRef + ' (' + formatDate(data.dueDate) + ').',
    '',
    'Monto a pagar: ' + formatMoney(data.amount),
    '',
    'Te esperamos!',
    '',
    data.tenantName,
  ];
  return lines.join('\n');
}

// ─── Plantilla: Cita proxima ─────────────────────────
export function buildAppointmentMessage(data: AppointmentData): string {
  let dateLabel: string;
  if (data.isToday) dateLabel = 'HOY ' + formatDate(data.appointmentDate);
  else if (data.isTomorrow) dateLabel = 'manana ' + formatDate(data.appointmentDate);
  else dateLabel = formatDate(data.appointmentDate);

  const lines = [
    'Hola ' + data.patientFirstName + ',',
    '',
    'Te recordamos tu cita programada:',
    '',
    'Fecha: ' + dateLabel,
    'Hora: ' + formatTime(data.startTime),
  ];

  if (data.serviceName) {
    lines.push('Servicio: ' + data.serviceName);
  }
  if (data.professionalName) {
    lines.push('Profesional: ' + data.professionalName);
  }

  lines.push('');
  lines.push('Te esperamos!');
  lines.push('');
  lines.push(data.tenantName);

  return lines.join('\n');
}

// ─── Helper: encode + abrir WhatsApp ─────────────────
export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const encoded = encodeURIComponent(message);
  return 'https://wa.me/' + cleanPhone + '?text=' + encoded;
}

// ─── Helpers ─────────────────────────────────────────
function formatMoney(n: number): string {
  return 'Q' + (Number(n) || 0).toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(s: string): string {
  const d = new Date(s + (s.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(s: string): string {
  // s viene como 'HH:MM:SS' o 'HH:MM'
  const parts = s.split(':');
  if (parts.length < 2) return s;
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return h + ':' + m + ' ' + ampm;
}
