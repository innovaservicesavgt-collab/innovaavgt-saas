'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BillingTabs } from './billing-tabs';
import { SubscriptionCard } from './subscription-card';
import { BillingActivityTable } from './billing-activity-table';
import { FinancialSummaryCard } from './financial-summary-card';
import { PaymentsTab } from './payments-tab';
import { InvoicesTab } from './invoices-tab';
import { HistoryTab } from './history-tab';
import { RegisterPaymentModal } from './register-payment-modal';
import { SendReminderModal } from './send-reminder-modal';

interface Props {
  client: any;
  activity: any[];
  payments: any[];
  summary: {
    accumulatedBalance: number;
    overdueBalance: number;
    currentBalance: number;
    nextDueDate: string | null;
    totalPaid: number;
    pendingBalance: number;
    riskLevel: 'low' | 'medium' | 'high';
    currency: string;
  };
}

type TabId = 'subscription' | 'payments' | 'invoices' | 'history';

export function BillingClient({ client, activity, payments, summary }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('subscription');
  const [showPayment, setShowPayment] = useState(false);
  const [showReminder, setShowReminder] = useState(false);

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Back */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
          <Link href="/superadmin" className="text-slate-500 hover:text-slate-700">Inicio</Link>
          <span className="text-slate-300">›</span>
          <Link href="/superadmin/clients" className="text-slate-500 hover:text-slate-700">Clientes</Link>
          <span className="text-slate-300">›</span>
          <Link href={`/superadmin/clients/${client.id}`} className="text-slate-500 hover:text-slate-700">{client.name}</Link>
          <span className="text-slate-300">›</span>
          <span className="font-semibold text-slate-900">Facturación</span>
        </nav>

        <Link
          href={`/superadmin/clients/${client.id}`}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Regresar
        </Link>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 lg:text-3xl">Facturación {client.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gestiona toda la información relacionada con la facturación y pagos de este cliente.
        </p>
      </div>

      {/* Layout 2 columnas */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Columna izquierda */}
        <div className="space-y-6 xl:col-span-8">
          <BillingTabs activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'subscription' && (
            <>
              <SubscriptionCard client={client} summary={summary} />
              <BillingActivityTable activity={activity} currency={summary.currency} />
            </>
          )}
          {activeTab === 'payments' && <PaymentsTab payments={payments} currency={summary.currency} />}
          {activeTab === 'invoices' && <InvoicesTab clientId={client.id} currency={summary.currency} />}
          {activeTab === 'history' && <HistoryTab activity={activity} currency={summary.currency} />}
        </div>

        {/* Columna derecha */}
        <div className="xl:col-span-4">
          <div className="sticky top-6">
            <FinancialSummaryCard
              summary={summary}
              onRegisterPayment={() => setShowPayment(true)}
              onSendReminder={() => setShowReminder(true)}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPayment && (
        <RegisterPaymentModal
          clientId={client.id}
          clientName={client.name}
          currency={summary.currency}
          defaultAmount={Number(client.monthly_fee || 0)}
          onClose={() => setShowPayment(false)}
        />
      )}
      {showReminder && (
        <SendReminderModal
          clientId={client.id}
          clientName={client.name}
          clientEmail={client.email || ''}
          amount={summary.pendingBalance}
          currency={summary.currency}
          onClose={() => setShowReminder(false)}
        />
      )}
    </div>
  );
}
