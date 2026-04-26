'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  updatePlanSchema,
  parseFormDataToPlanInput,
  type UpdatePlanInput,
} from '@/lib/validations/plan';

export type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

/**
 * Verifica que el usuario actual sea superadmin.
 * Si no, lanza error que aborta la action.
 */
async function requireSuperadmin(): Promise<{ userId: string }> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No autenticado');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_superadmin) {
    throw new Error('Sin permisos de superadmin');
  }

  return { userId: user.id };
}

/**
 * Server Action principal: actualiza un plan.
 *
 * Uso desde un <form action={updatePlan.bind(null, planId)}>:
 *   - Recibe el id como primer argumento (vinculado con .bind)
 *   - Recibe el FormData del formulario
 *   - Devuelve ActionState para mostrar feedback en UI
 */
export async function updatePlan(
  planId: string,
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const { userId } = await requireSuperadmin();

    // 1. Parsear FormData → objeto plano
    const raw = parseFormDataToPlanInput(formData);

    // 2. Validar con Zod
    const parsed = updatePlanSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path.join('.') || '_root';
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      });
      return {
        ok: false,
        message: 'Hay errores en el formulario',
        errors: fieldErrors,
      };
    }

    const input: UpdatePlanInput = parsed.data;

    // 3. Verificar que el plan existe
    const { data: existingPlan, error: fetchError } = await supabaseAdmin
      .from('plans')
      .select('id, code, vertical, features')
      .eq('id', planId)
      .single();

    if (fetchError || !existingPlan) {
      return { ok: false, message: 'Plan no encontrado' };
    }

    // 4. Update (NO actualizamos code ni vertical — son inmutables)
    const updatePayload = {
      name: input.name,
      description: input.description ?? null,
      monthly_price: input.monthly_price,
      annual_price: input.annual_price ?? null,
      currency: input.currency,
      max_users: input.max_users ?? null,
      max_branches: input.max_branches ?? null,
      max_patients: input.max_patients ?? null,
      max_cases: input.max_cases ?? null,
      storage_mb: input.storage_mb ?? null,
      features: input.features,
      is_active: input.is_active,
      is_public: input.is_public,
      sort_order: input.sort_order,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabaseAdmin
      .from('plans')
      .update(updatePayload)
      .eq('id', planId);

    if (updateError) {
      console.error('[updatePlan] Supabase error:', updateError);
      return {
        ok: false,
        message: `Error al actualizar: ${updateError.message}`,
      };
    }

    // 5. Auditoría (best-effort: si falla no rompemos el flujo)
    try {
      await supabaseAdmin.from('audit_logs').insert({
        tenant_id: null, // acción global del superadmin
        user_id: userId,
        action: 'plan.update',
        resource: 'plan',
        resource_id: planId,
        metadata: {
          plan_code: existingPlan.code,
          changes: updatePayload,
        },
      });
    } catch (auditError) {
      console.warn('[updatePlan] Audit log failed:', auditError);
    }

    // 6. Revalidar las rutas afectadas
    revalidatePath('/superadmin/plans');
    revalidatePath(`/superadmin/plans/${planId}`);
    revalidatePath('/superadmin/clients'); // muestra el plan en cada tenant

    return {
      ok: true,
      message: 'Plan actualizado correctamente',
    };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : 'Error desconocido al actualizar';
    console.error('[updatePlan] Unhandled error:', error);
    return { ok: false, message: msg };
  }
}

/**
 * Toggle rápido para activar/desactivar un plan sin abrir el editor completo.
 * Útil para acciones de tabla.
 */
export async function togglePlanActive(planId: string): Promise<ActionState> {
  try {
    await requireSuperadmin();

    const { data: plan, error: fetchError } = await supabaseAdmin
      .from('plans')
      .select('is_active')
      .eq('id', planId)
      .single();

    if (fetchError || !plan) {
      return { ok: false, message: 'Plan no encontrado' };
    }

    const { error } = await supabaseAdmin
      .from('plans')
      .update({ is_active: !plan.is_active, updated_at: new Date().toISOString() })
      .eq('id', planId);

    if (error) {
      return { ok: false, message: error.message };
    }

    revalidatePath('/superadmin/plans');
    revalidatePath(`/superadmin/plans/${planId}`);

    return {
      ok: true,
      message: `Plan ${!plan.is_active ? 'activado' : 'desactivado'}`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return { ok: false, message: msg };
  }
}