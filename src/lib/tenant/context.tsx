'use client';

import { createContext, useContext, ReactNode } from 'react';

export interface TenantContextType {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
}

const TenantContext = createContext<TenantContextType | null>(null);

export function TenantProvider({ tenant, children }: { tenant: TenantContextType; children: ReactNode }) {
  return <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant debe usarse dentro de TenantProvider');
  return context;
}
