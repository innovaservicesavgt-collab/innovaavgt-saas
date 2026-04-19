import { z } from 'zod';

export const expenseSchema = z
  .object({
    case_id: z.string().uuid('Expediente inválido'),

    tipo_gasto_id: z.string().uuid('Selecciona un tipo de gasto'),

    monto: z
      .number()
      .positive('El monto debe ser mayor a 0')
      .max(99999999.99, 'Monto demasiado alto'),

    moneda: z.enum(['GTQ', 'USD']),

    fecha: z.string().min(1, 'La fecha del gasto es obligatoria'),

    descripcion: z.string().max(1000).optional(),

    recuperable: z.boolean(),

    cobrado: z.boolean().optional(),

    fecha_cobrado: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      // Si está marcado como cobrado, debe tener fecha_cobrado
      if (data.cobrado && !data.fecha_cobrado) {
        return false;
      }
      return true;
    },
    {
      message: 'Si marcas como cobrado, debes indicar la fecha',
      path: ['fecha_cobrado'],
    }
  )
  .refine(
    (data) => {
      // No puede estar "cobrado" si no es "recuperable"
      if (data.cobrado && !data.recuperable) {
        return false;
      }
      return true;
    },
    {
      message: 'Solo los gastos recuperables pueden marcarse como cobrados',
      path: ['cobrado'],
    }
  );

export type ExpenseFormData = z.infer<typeof expenseSchema>;