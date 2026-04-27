import { z } from 'zod';

export const documentMetaSchema = z.object({
  nombre: z.string()
    .min(1, 'El nombre es obligatorio')
    .max(255, 'Nombre muy largo'),
  
  tipo: z.enum([
    'MEMORIAL', 'OFICIO', 'RESOLUCION', 'PRUEBA', 
    'CONTRATO', 'NOTIFICACION', 'OTRO'
  ]),
  
  case_id: z.string().uuid('Debes seleccionar un expediente'),
});

export type DocumentMetaFormData = z.infer<typeof documentMetaSchema>;