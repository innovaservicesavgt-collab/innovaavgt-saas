'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Play } from 'lucide-react';
import { reactivateTenant } from '@/server/actions/superadmin';

type Props = {
  tenantId: string;
  tenantName: string;
};

export function ReactivateButton(props: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (!confirm('Reactivar a ' + props.tenantName + '?\n\nLos usuarios podran volver a iniciar sesion.')) {
      return;
    }
    startTransition(async () => {
      const res = await reactivateTenant(props.tenantId);
      if (!res.ok) {
        toast.error(res.error || 'Error al reactivar');
        return;
      }
      toast.success('Tenant reactivado');
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
    >
      <Play className="h-3.5 w-3.5" />
      {isPending ? 'Reactivando...' : 'Reactivar'}
    </button>
  );
}
