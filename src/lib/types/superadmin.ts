// Tipos compartidos del area de superadmin

export type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  vertical: string;
  is_active: boolean;
  is_onboarding_complete: boolean | null;
  onboarding_completed_at: string | null;
  tenant_status: string | null;
  payment_status: string | null;
  plan_code: string | null;
  plan_name: string | null;
  monthly_price: number | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string;
  // Metricas
  user_count: number;
  professional_count: number;
  patient_count: number;
  appointment_count: number;
  service_count: number;
};

export type TenantFilter = 'all' | 'active' | 'inactive' | 'trial' | 'onboarding';
export type VerticalFilter = 'all' | 'dental' | 'legal';
