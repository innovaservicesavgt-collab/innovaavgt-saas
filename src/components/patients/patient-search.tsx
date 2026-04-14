'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function PatientSearch({ currentQuery }: { currentQuery: string }) {
  const router = useRouter();
  const [q, setQ] = useState(currentQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/patients' + (q ? '?q=' + encodeURIComponent(q) : ''));
  };

  return (
    <form onSubmit={handleSearch} className="flex-1 max-w-sm">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar paciente..."
          className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
      </div>
    </form>
  );
}
