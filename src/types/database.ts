export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';

export interface Tenant { id: string; name: string; slug: string; business_type: string; email: string; plan: string; is_active: boolean; }
export interface Profile { id: string; tenant_id: string | null; role_id: string | null; first_name: string; last_name: string; email: string; is_superadmin: boolean; }
export interface Professional { id: string; tenant_id: string; first_name: string; last_name: string; title: string | null; specialty: string | null; color: string; is_active: boolean; }
export interface Service { id: string; tenant_id: string; name: string; duration_minutes: number; price: number | null; color: string; is_active: boolean; }
export interface Patient { id: string; tenant_id: string; first_name: string; last_name: string; email: string | null; phone: string | null; is_active: boolean; }
export interface Appointment { id: string; tenant_id: string; patient_id: string; professional_id: string; service_id: string | null; appointment_date: string; start_time: string; end_time: string; duration_minutes: number; status: AppointmentStatus; }
