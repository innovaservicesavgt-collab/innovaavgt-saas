'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { requireVertical } from '@/lib/vertical';
import type {
  CatalogJuzgado,
  CatalogFiscalia,
  CatalogTipoProceso,
  MateriaJuzgado,
} from './types';

// ============================================================
// OBTENER JUZGADOS
// ============================================================

/**
 * Obtiene todos los juzgados activos, ordenados por instancia jerárquica.
 */
export async function getJuzgados(): Promise<CatalogJuzgado[]> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from('legal_catalog_juzgados')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (error) {
      console.error('Error fetching juzgados:', error);
      return [];
    }

    return (data as CatalogJuzgado[]) || [];
  } catch (err) {
    console.error('Unexpected error in getJuzgados:', err);
    return [];
  }
}

/**
 * Obtiene juzgados filtrados por materia.
 * Incluye MIXTO como comodín válido para todas las materias.
 */
export async function getJuzgadosPorMateria(
  materia: MateriaJuzgado
): Promise<CatalogJuzgado[]> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from('legal_catalog_juzgados')
      .select('*')
      .eq('activo', true)
      .in('materia', [materia, 'MIXTO'])
      .order('orden', { ascending: true });

    if (error) {
      console.error('Error fetching juzgados by materia:', error);
      return [];
    }

    return (data as CatalogJuzgado[]) || [];
  } catch (err) {
    console.error('Unexpected error in getJuzgadosPorMateria:', err);
    return [];
  }
}

/**
 * Obtiene un juzgado específico por ID.
 */
export async function getJuzgadoById(
  id: string
): Promise<CatalogJuzgado | null> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from('legal_catalog_juzgados')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching juzgado by id:', error);
      return null;
    }

    return (data as CatalogJuzgado) || null;
  } catch (err) {
    console.error('Unexpected error in getJuzgadoById:', err);
    return null;
  }
}

// ============================================================
// OBTENER FISCALÍAS
// ============================================================

/**
 * Obtiene todas las fiscalías activas.
 */
export async function getFiscalias(): Promise<CatalogFiscalia[]> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from('legal_catalog_fiscalias')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (error) {
      console.error('Error fetching fiscalias:', error);
      return [];
    }

    return (data as CatalogFiscalia[]) || [];
  } catch (err) {
    console.error('Unexpected error in getFiscalias:', err);
    return [];
  }
}

/**
 * Obtiene una fiscalía específica por ID.
 */
export async function getFiscaliaById(
  id: string
): Promise<CatalogFiscalia | null> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from('legal_catalog_fiscalias')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching fiscalia by id:', error);
      return null;
    }

    return (data as CatalogFiscalia) || null;
  } catch (err) {
    console.error('Unexpected error in getFiscaliaById:', err);
    return null;
  }
}

// ============================================================
// OBTENER TIPOS DE PROCESO
// ============================================================

/**
 * Obtiene todos los tipos de proceso activos.
 */
export async function getTiposProceso(): Promise<CatalogTipoProceso[]> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from('legal_catalog_tipos_proceso')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (error) {
      console.error('Error fetching tipos proceso:', error);
      return [];
    }

    return (data as CatalogTipoProceso[]) || [];
  } catch (err) {
    console.error('Unexpected error in getTiposProceso:', err);
    return [];
  }
}

/**
 * Obtiene tipos de proceso filtrados por materia.
 */
export async function getTiposProcesoPorMateria(
  materia: string
): Promise<CatalogTipoProceso[]> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from('legal_catalog_tipos_proceso')
      .select('*')
      .eq('activo', true)
      .eq('materia', materia)
      .order('orden', { ascending: true });

    if (error) {
      console.error('Error fetching tipos proceso by materia:', error);
      return [];
    }

    return (data as CatalogTipoProceso[]) || [];
  } catch (err) {
    console.error('Unexpected error in getTiposProcesoPorMateria:', err);
    return [];
  }
}