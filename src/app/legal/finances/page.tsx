import {
  getFinancesDashboardData,
  getAllReceivables,
} from './dashboard-actions';
import { FinancesPageClient } from './components/finances-page-client';

export default async function LegalFinancesPage() {
  const [data, receivables] = await Promise.all([
    getFinancesDashboardData(),
    getAllReceivables(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Finanzas</h1>
        <p className="text-gray-600 mt-1">
          Control financiero global del despacho: cuentas por cobrar, cobros y morosos
        </p>
      </div>

      <FinancesPageClient data={data} receivables={receivables} />
    </div>
  );
}