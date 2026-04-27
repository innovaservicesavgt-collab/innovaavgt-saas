import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function getCurrentUser() {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, role:roles(id, name, display_name)')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    ...user,
    profile,
    roleName: (profile.role as unknown as { name: string })?.name || 'patient',
    tenantId: profile.tenant_id,
    isSuperadmin: profile.is_superadmin,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.roleName !== 'admin' && !user.isSuperadmin) redirect('/dental/dashboard');
  return user;
}
