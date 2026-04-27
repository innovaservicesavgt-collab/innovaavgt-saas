import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import SuperadminSidebar from '@/components/superadmin/sidebar';
import SuperadminTopbar from '@/components/superadmin/topbar-wrapper';

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    redirect('/login');
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_superadmin, first_name, last_name, email')
    .eq('id', auth.user.id)
    .single();

  if (error || !profile?.is_superadmin) {
    redirect('/dental/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#EEF2F7] text-slate-900 lg:flex">
      <SuperadminSidebar />
      <div className="min-h-screen flex-1">
        <SuperadminTopbar
          userName={
            [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Admin'
          }
          userEmail={profile.email || ''}
        />
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}