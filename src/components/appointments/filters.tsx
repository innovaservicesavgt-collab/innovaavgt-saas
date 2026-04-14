'use client';
import { useRouter, useSearchParams } from 'next/navigation';

interface FiltersProps {
  currentStatus: string;
  currentDate: string;
  counts: Record<string, number>;
  statusLabels: Record<string, string>;
}

export function AppointmentFilters({ currentStatus, currentDate, counts, statusLabels }: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') params.set(key, value);
    else params.delete(key);
    router.push('/appointments?' + params.toString());
  };

  const statuses = ['all','scheduled','confirmed','in_progress','completed','cancelled','no_show'];

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Status pills - scrollable on mobile */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {statuses.map((s) => (
          <button key={s} onClick={() => setFilter('status', s)}
            className={"flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all " +
              (currentStatus === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300")}>
            {statusLabels[s] || s} {counts[s] ? '(' + counts[s] + ')' : ''}
          </button>
        ))}
      </div>
      {/* Date filter */}
      <input type="date" value={currentDate} onChange={(e) => setFilter('date', e.target.value)}
        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white focus:ring-2 focus:ring-blue-500 outline-none sm:ml-auto" />
    </div>
  );
}
