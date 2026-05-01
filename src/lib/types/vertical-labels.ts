// Labels e iconos adaptativos por vertical

export type VerticalLabels = {
  professionals: string;
  patients: string;
  appointments: string;
  services: string;
  professionalsSingular: string;
  patientsSingular: string;
};

export const VERTICAL_LABELS: Record<string, VerticalLabels> = {
  dental: {
    professionals: 'Dentistas',
    patients: 'Pacientes',
    appointments: 'Citas',
    services: 'Tratamientos',
    professionalsSingular: 'Dentista',
    patientsSingular: 'Paciente',
  },
  legal: {
    professionals: 'Abogados',
    patients: 'Clientes',
    appointments: 'Audiencias',
    services: 'Tarifas',
    professionalsSingular: 'Abogado',
    patientsSingular: 'Cliente',
  },
  inventory: {
    professionals: 'Empleados',
    patients: 'Productos',
    appointments: 'Ventas',
    services: 'Categorias',
    professionalsSingular: 'Empleado',
    patientsSingular: 'Producto',
  },
};

export function getVerticalLabels(vertical: string): VerticalLabels {
  return VERTICAL_LABELS[vertical] || VERTICAL_LABELS.dental;
}

// Tooltips explicativos para los estados
export const STATUS_TOOLTIPS: Record<string, string> = {
  trial: 'Cliente en periodo de prueba gratuito. El acceso es completo pero limitado en tiempo. Al vencer debera contratar un plan de pago.',
  active: 'Cliente con suscripcion de pago activa. Todo en orden.',
  onboarding: 'Cliente registrado pero aun no completo el wizard de configuracion inicial. Por eso no puede usar el sistema todavia.',
  suspended: 'Acceso bloqueado por el superadmin. Los datos del tenant NO se eliminan, puedes reactivarlo cuando quieras.',
  inactive: 'Estado generico de inactividad.',
  expired: 'Trial vencido sin contratar plan. El cliente debe pagar para reactivar.',
};
