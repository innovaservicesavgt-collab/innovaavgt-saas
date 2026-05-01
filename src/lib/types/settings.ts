// Tipos compartidos del area de configuracion

export type SettingsTab = 'general' | 'branding' | 'plan' | 'team' | 'services';

export type SettingsTabInfo = {
  id: SettingsTab;
  label: string;
  description: string;
};

export const SETTINGS_TABS: SettingsTabInfo[] = [
  { id: 'general', label: 'General', description: 'Datos basicos de tu clinica' },
  { id: 'branding', label: 'Branding', description: 'Logo y colores de tu marca' },
  { id: 'plan', label: 'Plan', description: 'Tu suscripcion actual' },
  { id: 'team', label: 'Equipo', description: 'Profesionales de la clinica' },
  { id: 'services', label: 'Servicios', description: 'Catalogo de servicios y precios' },
];

export type GeneralSettings = {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
};

export type BrandingSettings = {
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
};
