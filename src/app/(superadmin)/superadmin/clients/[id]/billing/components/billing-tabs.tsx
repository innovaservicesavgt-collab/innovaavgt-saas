'use client';

type TabId = 'subscription' | 'payments' | 'invoices' | 'history';

const tabs: { id: TabId; label: string }[] = [
  { id: 'subscription', label: 'Suscripción' },
  { id: 'payments', label: 'Pagos' },
  { id: 'invoices', label: 'Facturas' },
  { id: 'history', label: 'Historial' },
];

interface Props {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

export function BillingTabs({ activeTab, onChange }: Props) {
  return (
    <div className="border-b border-slate-200 bg-white rounded-t-2xl" role="tablist">
      <div className="flex gap-1 overflow-x-auto px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`relative flex-shrink-0 px-5 py-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {isActive && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-blue-600" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
