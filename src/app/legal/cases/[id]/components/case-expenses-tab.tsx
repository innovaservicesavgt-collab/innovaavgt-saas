import {
  getExpensesByCase,
  getTiposGasto,
} from '@/app/legal/finances/expense-actions';
import { calculateExpenseStats } from '@/app/legal/finances/expense-utils';
import { getAgreementByCase } from '@/app/legal/finances/actions';
import { ExpensesList } from './expenses-list';
import type { Moneda } from '@/app/legal/finances/constants';

type Props = {
  caseId: string;
};

export async function CaseExpensesTab({ caseId }: Props) {
  const [expenses, tiposGasto, agreement] = await Promise.all([
    getExpensesByCase(caseId),
    getTiposGasto(),
    getAgreementByCase(caseId),
  ]);

  const stats = calculateExpenseStats(expenses);
  const moneda: Moneda = agreement?.moneda || 'GTQ';

  return (
    <ExpensesList
      expenses={expenses}
      tiposGasto={tiposGasto}
      stats={stats}
      caseId={caseId}
      moneda={moneda}
    />
  );
}