'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
  const handlePrint = () => window.print();
  return (
    <button
      type="button"
      onClick={handlePrint}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
    >
      <Printer className="h-3.5 w-3.5" />
      Imprimir / PDF
    </button>
  );
}
