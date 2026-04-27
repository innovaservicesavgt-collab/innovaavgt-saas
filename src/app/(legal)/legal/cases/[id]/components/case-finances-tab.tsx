import { getAgreementByCase } from '@/app/legal/finances/actions';
import { getPaymentsByCase } from '@/app/legal/finances/payment-actions';
import { FeeAgreementCard } from './fee-agreement-card';
import { FeeAgreementEmpty } from './fee-agreement-empty';
import { PaymentsList } from './payments-list';
import { FinancesTabsWrapper } from './finances-tabs-wrapper';
import { CaseExpensesTab } from './case-expenses-tab';

type Props = {
  caseId: string;
};

export async function CaseFinancesTab({ caseId }: Props) {
  const [agreement, payments] = await Promise.all([
    getAgreementByCase(caseId),
    getPaymentsByCase(caseId),
  ]);

  const honorariosTab = agreement ? (
    <div className="space-y-6">
      <FeeAgreementCard agreement={agreement} caseId={caseId} />
      <PaymentsList
        payments={payments}
        caseId={caseId}
        moneda={agreement.moneda}
        installments={agreement.installments}
        modalidad={agreement.modalidad}
      />
    </div>
  ) : (
    <FeeAgreementEmpty caseId={caseId} />
  );

  const gastosTab = <CaseExpensesTab caseId={caseId} />;

  return (
    <FinancesTabsWrapper
      caseId={caseId}
      honorariosTab={honorariosTab}
      gastosTab={gastosTab}
    />
  );
}