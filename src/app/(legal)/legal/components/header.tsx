import { ProfileWithTenant } from '@/lib/tenant';

export function LegalHeader({ profile }: { profile: ProfileWithTenant }) {
  const initials = `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase();
  const fullName = `${profile.first_name} ${profile.last_name}`.trim();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {profile.tenant?.name ?? 'Despacho'}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">{fullName || profile.email}</div>
          <div className="text-xs text-gray-500 capitalize">
            {profile.role?.display_name ?? 'Usuario'}
          </div>
        </div>
        <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {initials || '?'}
        </div>
      </div>
    </header>
  );
}