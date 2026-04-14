import { requireAuth } from '@/lib/auth/guards';

export default async function SettingsPage() {
  await requireAuth();
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Configuracion del negocio</h3>
        <p className="text-sm text-slate-500">La configuracion avanzada se implementara en los siguientes pasos.</p>
      </div>
    </div>
  );
}
