'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import { Settings, Building2, Palette, Crown, Users, Briefcase } from 'lucide-react';
import { SETTINGS_TABS } from '@/lib/types/settings';
import type { SettingsTab } from '@/lib/types/settings';
import { TabGeneral } from './tab-general';
import { TabBranding } from './tab-branding';
import { TabPlan } from './tab-plan';
import { TabTeam } from './tab-team';
import { TabServices } from './tab-services';

type Tenant = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
};

type Plan = {
  id: string;
  code: string;
  name: string;
  monthly_price: number;
  currency: string;
  trial_days: number | null;
  max_users: number | null;
  max_branches: number | null;
  storage_mb: number | null;
  features: Record<string, unknown>;
} | null;

type Subscription = {
  id: string;
  status: string;
  billing_cycle: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  locked_price: number;
  currency: string;
} | null;

type Professional = {
  id: string;
  title: string | null;
  first_name: string;
  last_name: string;
  specialty: string | null;
  email: string | null;
  phone: string | null;
  license_number: string | null;
  photo_url: string | null;
  is_active: boolean;
  color: string | null;
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  currency: string;
  duration_minutes: number;
  buffer_minutes: number | null;
  color: string | null;
  is_active: boolean;
  requires_confirmation: boolean;
};

type Props = {
  initialTab: SettingsTab;
  tenant: Tenant;
  plan: Plan;
  subscription: Subscription;
  professionals: Professional[];
  services: Service[];
  vertical: string;
};

const TAB_ICONS = {
  general: Building2,
  branding: Palette,
  plan: Crown,
  team: Users,
  services: Briefcase,
} as const;

export function SettingsClient(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState<SettingsTab>(props.initialTab);

  const changeTab = (tab: SettingsTab) => {
    setCurrentTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(pathname + '?' + params.toString(), { scroll: false });
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <Toaster position="top-right" richColors closeButton />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="h-6 w-6 text-slate-700" />
          <h1 className="text-2xl font-bold text-slate-900">Configuracion</h1>
        </div>
        <p className="text-sm text-slate-500">Administra los datos de tu clinica, equipo y plan</p>
      </div>

      <div className="mb-6 bg-white rounded-xl border border-slate-200 p-1 flex flex-wrap gap-1">
        {SETTINGS_TABS.map((t) => {
          const Icon = TAB_ICONS[t.id];
          const isActive = currentTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => changeTab(t.id)}
              className={
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition ' +
                (isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100')
              }
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div>
        {currentTab === 'general' ? <TabGeneral tenant={props.tenant} /> : null}
        {currentTab === 'branding' ? <TabBranding tenant={props.tenant} /> : null}
        {currentTab === 'plan' ? <TabPlan plan={props.plan} subscription={props.subscription} /> : null}
        {currentTab === 'team' ? <TabTeam professionals={props.professionals} /> : null}
        {currentTab === 'services' ? <TabServices services={props.services} /> : null}
      </div>
    </div>
  );
}
