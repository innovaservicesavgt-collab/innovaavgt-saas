import { z } from 'zod';

// ============================================================
// CUOTA (installment)
// ============================================================

export const installmentSchema = z.object({
  numero: z.number().int().positive(),
  concepto: z.string().max(100).optional(),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  fecha_vencimiento: z
    .string()
    .min(1, 'La fecha de vencimiento es obligatoria'),
});

// ============================================================
// ACUERDO DE HONORARIOS
// ============================================================

export const feeAgreementSchema = z
  .object({
    case_id: z.string().uuid('Expediente inválido'),

    monto_total: z
      .number()
      .positive('El monto total debe ser mayor a 0')
      .max(99999999.99, 'Monto demasiado alto'),

    moneda: z.enum(['GTQ', 'USD']),

    modalidad: z.enum(['UNICO', 'CUOTAS', 'POR_ETAPA']),

    numero_cuotas: z
      .number()
      .int('Debe ser un número entero')
      .min(1, 'Mínimo 1 cuota')
      .max(60, 'Máximo 60 cuotas')
      .optional(),

    installments: z.array(installmentSchema).optional(),

    notas: z.string().max(2000).optional(),

    fecha_acuerdo: z.string().min(1, 'La fecha es obligatoria'),
  })
  .refine(
    (data) => {
      // Si es CUOTAS o POR_ETAPA, debe tener installments
      if (data.modalidad !== 'UNICO') {
        return (
          data.installments &&
          data.installments.length > 0 &&
          data.numero_cuotas === data.installments.length
        );
      }
      return true;
    },
    {
      message: 'Debes definir las cuotas/etapas',
      path: ['installments'],
    }
  )
  .refine(
    (data) => {
      // Si tiene installments, la suma debe ser igual al monto total
      if (data.installments && data.installments.length > 0) {
        const suma = data.installments.reduce((acc, i) => acc + i.monto, 0);
        // Permitimos 0.01 de diferencia por redondeos
        return Math.abs(suma - data.monto_total) < 0.01;
      }
      return true;
    },
    {
      message: 'La suma de las cuotas debe ser igual al monto total',
      path: ['installments'],
    }
  );

export type FeeAgreementFormData = z.infer<typeof feeAgreementSchema>;