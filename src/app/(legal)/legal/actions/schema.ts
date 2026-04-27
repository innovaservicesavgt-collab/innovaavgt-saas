import { z } from 'zod';

export const actionSchema = z.object({
  tipo: z.string()
    .min(1, 'Selecciona un tipo de actuación')
    .max(100),

  descripcion: z.string()
    .min(3, 'La descripción debe tener al menos 3 caracteres')
    .max(3000, 'Descripción muy larga'),

  case_id: z.string().uuid('Debes seleccionar un expediente'),

  fecha: z.string().min(1, 'La fecha es obligatoria'),
});

export type ActionFormData = z.infer<typeof actionSchema>;