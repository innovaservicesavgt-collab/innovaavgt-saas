'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { requireVertical } from '@/lib/vertical';
import type { AuditLogEntryEnriched, AuditTableName } from './types';

/**
 * Obtiene el historial de auditoría de un registro específico
 * (por ejemplo, todos los cambios hechos a un expediente).
 *
 * Incluye también cambios en registros hijos relacionados al expediente:
 * - Eventos de agenda
 * - Documentos
 * - Actuaciones
 * - Honorarios, cuotas, pagos, gastos
 */
export async function getCaseAuditHistory(
  caseId: string
): Promise<AuditLogEntryEnriched[]> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    // 1. Cambios directos al expediente
    const { data: caseChanges, error: caseError } = await supabase
      .from('legal_audit_log')
      .select('*')
      .eq('table_name', 'legal_cases')
      .eq('record_id', caseId)
      .order('created_at', { ascending: false });

    if (caseError) {
      console.error('Error fetching case audit:', caseError);
      return [];
    }

    // 2. Cambios en tablas hijas (filtrar por case_id en old_data o new_data)
    const { data: childChanges, error: childError } = await supabase
      .from('legal_audit_log')
      .select('*')
      .in('table_name', [
        'legal_events',
        'legal_documents',
        'legal_actions',
        'legal_fee_agreements',
        'legal_fee_installments',
        'legal_payments',
        'legal_expenses',
      ])
      .or(`new_data->>case_id.eq.${caseId},old_data->>case_id.eq.${caseId}`)
      .order('created_at', { ascending: false });

    if (childError) {
      console.error('Error fetching child audit:', childError);
    }

    // Combinar todos los eventos
    const allChanges = [...(caseChanges || []), ...(childChanges || [])];

    // Ordenar por fecha descendente
    allChanges.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // 3. Enriquecer con info de perfiles de usuarios
    const userIds = Array.from(
      new Set(allChanges.map((c) => c.user_id).filter((id): id is string => !!id))
    );

    if (userIds.length === 0) {
      return allChanges as AuditLogEntryEnriched[];
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', userIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [
        p.id,
        { first_name: p.first_name, last_name: p.last_name },
      ])
    );

    // Asignar perfil a cada entrada
    const enriched: AuditLogEntryEnriched[] = allChanges.map((c) => ({
      ...c,
      user_profile: c.user_id ? profileMap.get(c.user_id) || null : null,
    }));

    return enriched;
  } catch (err) {
    console.error('Unexpected error in getCaseAuditHistory:', err);
    return [];
  }
}

/**
 * Obtiene los últimos N eventos de auditoría del tenant actual
 * (útil para un dashboard de auditoría global en Fase 13.4).
 */
export async function getRecentAuditLog(
  limit: number = 50
): Promise<AuditLogEntryEnriched[]> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from('legal_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent audit:', error);
      return [];
    }

    const userIds = Array.from(
      new Set((data || []).map((c) => c.user_id).filter((id): id is string => !!id))
    );

    if (userIds.length === 0) {
      return (data || []) as AuditLogEntryEnriched[];
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', userIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [
        p.id,
        { first_name: p.first_name, last_name: p.last_name },
      ])
    );

    return (data || []).map((c) => ({
      ...c,
      user_profile: c.user_id ? profileMap.get(c.user_id) || null : null,
    })) as AuditLogEntryEnriched[];
  } catch (err) {
    console.error('Unexpected error in getRecentAuditLog:', err);
    return [];
  }
}