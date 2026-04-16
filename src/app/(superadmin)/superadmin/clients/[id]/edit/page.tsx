import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import EditClientForm from './EditClientForm';

type PageProps = {
  params: Promise<{ id: string }>;
};

async function getClient(id: string) {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function EditClientPage({ params }: PageProps) {
  const { id } = await params;
  const client = await getClient(id);

  if (!client) notFound();

  return <EditClientForm client={client} />;
}