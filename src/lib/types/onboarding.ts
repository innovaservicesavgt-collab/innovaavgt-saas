// Tipos del wizard de onboarding

export type OnboardingStep = 1 | 2 | 3 | 4 | 5;

export type ClinicData = {
  name: string;
  address: string;
  phone: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
};

export type ProfessionalData = {
  title: string | null;
  first_name: string;
  last_name: string;
  specialty: string | null;
  email: string | null;
  phone: string | null;
  license_number: string | null;
  photo_url: string | null;
};

export type SelectedService = {
  template_id: string;
  name: string;
  category: string;
  price: number;
  duration_minutes: number;
};

export type ScheduleData = {
  days: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  start_time: string;  // 'HH:MM'
  end_time: string;
  has_lunch_break: boolean;
  lunch_start: string;
  lunch_end: string;
};

// Mapeo dia de semana ingles -> integer (segun schedules.day_of_week)
// Convencion estandar: 0=Domingo, 1=Lunes ... 6=Sabado
export const DAY_TO_INT: Record<keyof ScheduleData['days'], number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export const DAY_LABELS: Record<keyof ScheduleData['days'], string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miercoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sabado',
  sunday: 'Domingo',
};

export const DEFAULT_CLINIC: ClinicData = {
  name: '',
  address: '',
  phone: '',
  logo_url: null,
  primary_color: '#2563eb',
  secondary_color: '#1e40af',
};

export const DEFAULT_PROFESSIONAL: ProfessionalData = {
  title: 'Dr.',
  first_name: '',
  last_name: '',
  specialty: 'Odontologo general',
  email: null,
  phone: null,
  license_number: null,
  photo_url: null,
};

export const DEFAULT_SCHEDULE: ScheduleData = {
  days: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: false,
  },
  start_time: '08:00',
  end_time: '18:00',
  has_lunch_break: true,
  lunch_start: '12:00',
  lunch_end: '14:00',
};

export const COMMON_SPECIALTIES = [
  'Odontologo general',
  'Endodoncia',
  'Ortodoncia',
  'Periodoncia',
  'Cirugia oral y maxilofacial',
  'Odontopediatria',
  'Implantologia',
  'Protesis dental',
  'Estetica dental',
  'Patologia oral',
];

export const COMMON_TITLES = ['Dr.', 'Dra.', 'Od.', 'Lic.'];
