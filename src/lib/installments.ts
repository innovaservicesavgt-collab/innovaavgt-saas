// Helper: calcula cuotas con fechas y montos exactos
// Garantiza que la suma de cuotas == total exacto (la ultima absorbe centavos)

export type InstallmentFrequency = 'weekly' | 'biweekly' | 'monthly';

export type CalculatedInstallment = {
  number: number;
  due_date: string; // YYYY-MM-DD
  amount: number;
};

export type CalculateInstallmentsInput = {
  total: number;
  numInstallments: number;
  frequency: InstallmentFrequency;
  startDate: string; // YYYY-MM-DD primera cuota
  initialPayment?: number; // cuota inicial diferenciada (opcional)
};

export function calculateInstallments(
  input: CalculateInstallmentsInput
): CalculatedInstallment[] {
  const { total, numInstallments, frequency, startDate, initialPayment } = input;

  if (numInstallments < 1) return [];
  if (total <= 0) return [];

  const result: CalculatedInstallment[] = [];

  // Cuanto queda despues de la cuota inicial
  const remaining = initialPayment && initialPayment > 0 ? total - initialPayment : total;
  const remainingInstallments = initialPayment && initialPayment > 0 ? numInstallments - 1 : numInstallments;

  // Si hay cuota inicial, agregarla primero
  if (initialPayment && initialPayment > 0) {
    result.push({
      number: 1,
      due_date: startDate,
      amount: roundMoney(initialPayment),
    });
  }

  if (remainingInstallments <= 0) return result;

  // Calcular cuota base (redondeada a 2 decimales)
  const baseAmount = roundMoney(remaining / remainingInstallments);

  // Generar las cuotas restantes
  let totalAssigned = initialPayment && initialPayment > 0 ? initialPayment : 0;
  const startNumber = result.length + 1;
  const startIndex = result.length === 0 ? 0 : 1; // si hay inicial, las siguientes empiezan +1 periodo despues

  for (let i = 0; i < remainingInstallments; i++) {
    const isLast = i === remainingInstallments - 1;
    let amount: number;

    if (isLast) {
      // La ultima cuota absorbe los centavos para que el total sea EXACTO
      amount = roundMoney(total - totalAssigned);
    } else {
      amount = baseAmount;
      totalAssigned += baseAmount;
    }

    const dueDate = addPeriods(startDate, startIndex + i, frequency);

    result.push({
      number: startNumber + i,
      due_date: dueDate,
      amount,
    });
  }

  return result;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function addPeriods(startDate: string, periods: number, frequency: InstallmentFrequency): string {
  const d = new Date(startDate + 'T00:00:00');
  if (frequency === 'weekly') {
    d.setDate(d.getDate() + 7 * periods);
  } else if (frequency === 'biweekly') {
    d.setDate(d.getDate() + 14 * periods);
  } else {
    d.setMonth(d.getMonth() + periods);
  }
  return d.toISOString().split('T')[0];
}

export function frequencyLabel(f: InstallmentFrequency): string {
  if (f === 'weekly') return 'Semanal';
  if (f === 'biweekly') return 'Quincenal';
  return 'Mensual';
}
