import { z } from 'zod';

/**
 * Schema para validar la actualización de un plan desde el editor.
 *
 * Notas:
 *  - `code` y `vertical` NO son editables (son parte de la identidad del plan).
 *  - `features` es un Record flexible: el editor sabe qué features existen
 *    según el vertical, pero aquí solo validamos formato.
 *  - Límites pueden ser null = ilimitado.
 */
export const updatePlanSchema = z.object({
  // Metadatos
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'Máximo 80 caracteres'),

  description: z
    .string()
    .max(500, 'Máximo 500 caracteres')
    .nullable()
    .optional(),

  // Precios
  monthly_price: z.coerce
    .number()
    .min(0, 'El precio no puede ser negativo')
    .max(999999, 'Precio fuera de rango'),

  annual_price: z.coerce
    .number()
    .min(0)
    .max(9999999)
    .nullable()
    .optional(),

  currency: z
    .string()
    .length(3, 'Código de moneda debe ser de 3 letras')
    .toUpperCase(),

  // Límites (null = ilimitado)
  max_users: z.coerce.number().int().min(0).nullable().optional(),
  max_branches: z.coerce.number().int().min(0).nullable().optional(),
  max_patients: z.coerce.number().int().min(0).nullable().optional(),
  max_cases: z.coerce.number().int().min(0).nullable().optional(),
  storage_mb: z.coerce.number().int().min(0).nullable().optional(),

  // Features (objeto JSONB libre, validado por el catálogo en otro lado)
  features: z.record(
    z.string(),
    z.union([z.boolean(), z.number(), z.null()])
  ),

  // Estado
  is_active: z.coerce.boolean(),
  is_public: z.coerce.boolean(),
  sort_order: z.coerce.number().int().min(0).max(9999),
});

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

/**
 * Convierte el FormData de un <form> a un objeto plano que Zod puede validar.
 * Maneja correctamente:
 *  - Campos que pueden ser null (límites vacíos = ilimitado)
 *  - Checkboxes (presentes = true, ausentes = false)
 *  - Features anidadas (vienen como features.<key>)
 */
export function parseFormDataToPlanInput(
  formData: FormData
): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  const features: Record<string, boolean | number | null> = {};

  for (const [key, value] of formData.entries()) {
    // Features vienen como features.<key>
    if (key.startsWith('features.')) {
      const featureKey = key.slice('features.'.length);
      const strVal = value.toString();

      if (strVal === 'true' || strVal === 'on') {
        features[featureKey] = true;
      } else if (strVal === '' || strVal === 'null') {
        features[featureKey] = null;
      } else {
        // Intentar como número (para whatsapp_monthly_limit)
        const num = Number(strVal);
        if (!Number.isNaN(num)) {
          features[featureKey] = num;
        } else {
          features[featureKey] = strVal === 'true';
        }
      }
      continue;
    }

    // Campos vacíos en límites → null (ilimitado)
    if (
      ['max_users', 'max_branches', 'max_patients', 'max_cases', 'storage_mb', 'annual_price', 'description'].includes(
        key
      ) &&
      value === ''
    ) {
      obj[key] = null;
      continue;
    }

    // Checkboxes booleanos: si llegó, es true. Los ausentes los ponemos abajo.
    if (key === 'is_active' || key === 'is_public') {
      obj[key] = true;
      continue;
    }

    obj[key] = value;
  }

  // Checkboxes que NO llegaron al FormData → false
  if (!('is_active' in obj)) obj.is_active = false;
  if (!('is_public' in obj)) obj.is_public = false;

  obj.features = features;
  return obj;
}