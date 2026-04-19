import { z } from 'zod';

export const caseSchema = z.object({
  numero_judicial: z.string()
    .max(100, 'Número judicial muy largo')
    .optional()
    .or(z.literal('')),

  materia: z.enum([
    'PENAL', 'CIVIL', 'LABORAL', 'ADMINISTRATIVO',
    'NOTARIAL', 'FAMILIA', 'MERCANTIL', 'OTROS',
  ]),

  tipo_proceso: z.string()
    .max(200, 'Tipo de proceso muy largo')
    .optional()
    .or(z.literal('')),

  estado_procesal: z.string()
    .max(100, 'Estado procesal muy largo')
    .optional()
    .or(z.literal('')),

  client_id: z.string()
    .uuid('Debe seleccionar un cliente válido'),

  parte_contraria: z.string()
    .max(300, 'Parte contraria muy larga')
    .optional()
    .or(z.literal('')),

  organo_jurisdiccional: z.string()
    .max(300, 'Órgano jurisdiccional muy largo')
    .optional()
    .or(z.literal('')),

  abogado_responsable_id: z.string()
    .uuid('Debe seleccionar un abogado responsable'),

  fecha_inicio: z.string()
    .min(1, 'La fecha de inicio es obligatoria'),

  proxima_actuacion: z.string()
    .optional()
    .or(z.literal('')),

  observaciones: z.string()
    .max(5000, 'Observaciones muy largas')
    .optional()
    .or(z.literal('')),
});

export type CaseFormData = z.infer<typeof caseSchema>;