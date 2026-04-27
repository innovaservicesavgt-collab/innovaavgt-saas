import { z } from 'zod';

export const eventSchema = z.object({
  titulo: z.string()
    .min(2, 'El título debe tener al menos 2 caracteres')
    .max(200, 'Título muy largo'),
  
  descripcion: z.string().max(2000).optional(),
  
  tipo: z.enum([
    'AUDIENCIA', 'PLAZO_LEGAL', 'MEMORIAL', 
    'OFICIO', 'DILIGENCIA', 'REUNION_CLIENTE', 'OTRO'
  ]),
  
  case_id: z.string().uuid('Debes seleccionar un expediente'),
  
  fecha_hora: z.string().min(1, 'La fecha y hora son obligatorias'),
  
  duracion_min: z.number()
    .int()
    .min(15, 'Duración mínima 15 minutos')
    .max(1440, 'Duración máxima 24 horas'),
  
  lugar: z.string().max(300).optional(),
});

export type EventFormData = z.infer<typeof eventSchema>;