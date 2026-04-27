import { z } from 'zod';

// Schema para crear/editar un cliente legal
export const clientSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'El nombre es muy largo'),
  
  tipo_persona: z.enum(['NATURAL', 'JURIDICA']),
  
  dpi: z.string()
    .regex(/^[\d\s]*$/, 'El DPI solo debe contener números')
    .max(20, 'DPI inválido')
    .optional()
    .or(z.literal('')),
  
  nit: z.string()
    .max(20, 'NIT inválido')
    .optional()
    .or(z.literal('')),
  
  telefono: z.string()
    .max(30, 'Teléfono muy largo')
    .optional()
    .or(z.literal('')),
  
  email: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  
  direccion: z.string()
    .max(500, 'Dirección muy larga')
    .optional()
    .or(z.literal('')),
  
  observaciones: z.string()
    .max(2000, 'Observaciones muy largas')
    .optional()
    .or(z.literal('')),
});

export type ClientFormData = z.infer<typeof clientSchema>;