import { z } from 'zod';

export const paymentSchema = z.object({
  case_id: z.string().uuid('Expediente inválido'),

  installment_id: z.string().uuid().nullable().optional(),

  monto: z
    .number()
    .positive('El monto debe ser mayor a 0')
    .max(99999999.99, 'Monto demasiado alto'),

  moneda: z.enum(['GTQ', 'USD']),

  fecha_pago: z.string().min(1, 'La fecha del pago es obligatoria'),

  metodo: z.enum([
    'EFECTIVO',
    'TRANSFERENCIA',
    'CHEQUE',
    'DEPOSITO',
    'TARJETA',
    'OTRO',
  ]),

  referencia: z.string().max(200).optional(),

  notas: z.string().max(2000).optional(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;
