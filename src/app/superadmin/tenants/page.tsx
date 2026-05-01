import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/guards';
import { getCurrentProfile } from '@/lib/tenant';
import { getAllTenantsWithMetrics } from '@/server/actions/superadmin';
import { TenantsListClient } from '@/components/superadmin/tenants-list-client';

export const metadata = { title: 'Tenants - Superadmin' };

export default async function SuperadminTenantsPage() {
  await requireAuth();
  const profile = await getCurrentProfile();

  if (!profile?.is_superadmin) {
    redirect('/dental/dashboard');
  }

  const result = await getAllTenantsWithMetrics();

  if (!result.ok) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-900">
          <p className="font-bold">Error al cargar tenants</p>
          <p className="text-sm mt-1">{result.error}</p>
        </div>
      </div>
    );
  }

  return <TenantsListClient tenants={result.tenants} />;
}
