'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';

// ─── Schemas ───────────────────────────────────────────────
const itemSchema = z.object({
  service_id: z.string().uuid().nullable().optional(),
  description: z.string().min(1).max(500),
  quantity: z.number().int().min(1).max(999),
  unit_price: z.number().min(0),
  tooth_numbers: z.array(z.string()).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().optional(),
});

const createQuotationSchema = z.object({
  patient_id: z.string().uuid(),
  professional_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1, 'Titulo requerido').max(200),
  description: z.string().max(2000).nullable().optional(),
  valid_until: z.string().nullable().optional(),
  discount_type: z.enum(['percent', 'amount']).nullable().optional(),
  discount_value: z.number().min(0).nullable().optional(),
  terms: z.string().max(5000).nullable().optional(),
  internal_notes: z.string().max(2000).nullable().optional(),
  status: z.enum(['draft', 'sent']).default('draft'),
  items: z.array(itemSchema).min(1, 'Debe agregar al menos un tratamiento'),
});

export type CreateQuotationInput = z.input<typeof createQuotationSchema>;

const changeStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired', 'cancelled']),
  reason: z.string().max(500).nullable().optional(),
});

const duplicateSchema = z.object({
  id: z.string().uuid(),
});

// ─── Helpers ───────────────────────────────────────────────
function clean(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = String(v).trim();
  return t.length === 0 ? null : t;
}

// El titulo se guarda en el campo 'notes' (primera linea) ya que
// la tabla quotations no tiene columna 'title' propia.
// Formato: 'TITULO\n\nDescripcion (opcional)'
function buildNotesField(title: string, description: string | null | undefined): string {
  let result = title.trim();
  if (description && description.trim().length > 0) {
    result += '\n\n' + description.trim();
  }
  return result;
}

// ─── createQuotation ───────────────────────────────────────
export async function createQuotation(input: CreateQuotationInput) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const parsed = createQuotationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message || 'Datos invalidos',
    };
  }

  const data = parsed.data;
  const supabase = await createServerSupabase();

  // Calcular totales
  const subtotal = data.items.reduce(
    (sum, it) => sum + it.quantity * it.unit_price,
    0
  );

  let discountAmount = 0;
  let discountPercent = 0;
  if (data.discount_type === 'percent' && data.discount_value) {
    discountPercent = data.discount_value;
    discountAmount = (subtotal * data.discount_value) / 100;
  } else if (data.discount_type === 'amount' && data.discount_value) {
    discountAmount = data.discount_value;
  }

  const total = Math.max(0, subtotal - discountAmount);

  // Generar numero de cotizacion
  const { data: numData } = await supabase.rpc('generate_quotation_number', {
    p_tenant_id: profile.tenant.id,
  });
  const quotationNumber = (numData as string | null) || null;

  // Insert: SOLO columnas que existen en tu BD
  const insertPayload: Record<string, unknown> = {
    tenant_id: profile.tenant.id,
    patient_id: data.patient_id,
    status: data.status,
    notes: buildNotesField(data.title, data.description),
    subtotal,
    discount_type: data.discount_type || null,
    discount_value: data.discount_value || 0,
    discount_percent: discountPercent,
    discount_amount: discountAmount,
    total,
    total_amount: total,
    issued_at: new Date().toISOString(),
  };

  if (quotationNumber) insertPayload.quotation_number = quotationNumber;
  const cleanValid = clean(data.valid_until);
  if (cleanValid) insertPayload.valid_until = cleanValid;
  const cleanTerms = clean(data.terms);
  if (cleanTerms) insertPayload.terms = cleanTerms;
  const cleanInternal = clean(data.internal_notes);
  if (cleanInternal) insertPayload.internal_notes = cleanInternal;

  console.log('[createQuotation] payload keys:', Object.keys(insertPayload));

  const { data: created, error: createError } = await supabase
    .from('quotations')
    .insert(insertPayload)
    .select('id')
    .single();

  if (createError || !created) {
    console.error('[createQuotation] insert error:', createError);
    return {
      ok: false as const,
      error: 'Error al crear cotizacion: ' + (createError?.message || 'desconocido'),
    };
  }

  // Insert de items
  const itemsToInsert = data.items.map((it, idx) => {
    const itemPayload: Record<string, unknown> = {
      quotation_id: created.id,
      description: it.description.trim(),
      quantity: it.quantity,
      unit_price: it.unit_price,
      total: Number(it.quantity) * Number(it.unit_price),
    };
    if (it.service_id) itemPayload.service_id = it.service_id;
    if (it.tooth_numbers && it.tooth_numbers.length > 0) {
      itemPayload.tooth_numbers = it.tooth_numbers;
    }
    const cleanItemNotes = clean(it.notes);
    if (cleanItemNotes) itemPayload.notes = cleanItemNotes;
    itemPayload.sort_order = it.sort_order ?? idx;
    return itemPayload;
  });

  const { error: itemsError } = await supabase
    .from('quotation_items')
    .insert(itemsToInsert);

  if (itemsError) {
    console.error('[createQuotation] items insert error:', itemsError);
    await supabase.from('quotations').delete().eq('id', created.id);
    return {
      ok: false as const,
      error: 'Error al crear items: ' + itemsError.message,
    };
  }

  revalidatePath('/dental/quotations');
  revalidatePath('/dental/dashboard');
  return { ok: true as const, id: created.id as string };
}

// ─── changeQuotationStatus ─────────────────────────────────
export async function changeQuotationStatus(
  input: z.input<typeof changeStatusSchema>
) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const parsed = changeStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: 'Datos invalidos' };
  }

  const { id, status, reason } = parsed.data;
  const supabase = await createServerSupabase();

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'accepted') {
    updateData.accepted_at = new Date().toISOString();
  } else if (status === 'rejected' || status === 'cancelled') {
    updateData.rejected_at = new Date().toISOString();
    if (reason) updateData.internal_notes = reason;
  }

  const { error } = await supabase
    .from('quotations')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', profile.tenant.id);

  if (error) {
    console.error('[changeStatus] error:', error);
    return { ok: false as const, error: 'Error: ' + error.message };
  }

  revalidatePath('/dental/quotations');
  revalidatePath('/dental/quotations/' + id);
  return { ok: true as const };
}

// ─── duplicateQuotation ────────────────────────────────────
export async function duplicateQuotation(input: z.input<typeof duplicateSchema>) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const parsed = duplicateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: 'ID invalido' };
  }

  const supabase = await createServerSupabase();

  const { data: original } = await supabase
    .from('quotations')
    .select('*')
    .eq('id', parsed.data.id)
    .eq('tenant_id', profile.tenant.id)
    .single();

  if (!original) {
    return { ok: false as const, error: 'Cotizacion no encontrada' };
  }

  const { data: originalItems } = await supabase
    .from('quotation_items')
    .select('*')
    .eq('quotation_id', parsed.data.id);

  const { data: numData } = await supabase.rpc('generate_quotation_number', {
    p_tenant_id: profile.tenant.id,
  });

  const copyPayload: Record<string, unknown> = {
    tenant_id: profile.tenant.id,
    patient_id: original.patient_id,
    status: 'draft',
    notes: (original.notes || 'Cotizacion') + ' (copia)',
    subtotal: original.subtotal || 0,
    discount_type: original.discount_type,
    discount_value: original.discount_value || 0,
    discount_percent: original.discount_percent || 0,
    discount_amount: original.discount_amount || 0,
    total: original.total || 0,
    total_amount: original.total_amount || 0,
    terms: original.terms,
    issued_at: new Date().toISOString(),
  };
  if (numData) copyPayload.quotation_number = numData;

  const { data: created, error: createError } = await supabase
    .from('quotations')
    .insert(copyPayload)
    .select('id')
    .single();

  if (createError || !created) {
    console.error('[duplicate] error:', createError);
    return { ok: false as const, error: 'Error al duplicar' };
  }

  if (originalItems && originalItems.length > 0) {
    const itemsCopy = originalItems.map((it) => {
      const item: Record<string, unknown> = {
        quotation_id: created.id,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total: it.total,
      };
      if (it.service_id) item.service_id = it.service_id;
      if (it.tooth_numbers) item.tooth_numbers = it.tooth_numbers;
      if (it.notes) item.notes = it.notes;
      item.sort_order = it.sort_order ?? 0;
      return item;
    });
    await supabase.from('quotation_items').insert(itemsCopy);
  }

  revalidatePath('/dental/quotations');
  return { ok: true as const, id: created.id as string };
}
