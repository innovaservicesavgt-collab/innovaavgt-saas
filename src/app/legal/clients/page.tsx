import { createServerSupabase } from '@/lib/supabase/server';
import { ClientsTable } from './components/clients-table';
import { LegalClient } from './types';

export default async function LegalClientsPage() {
  const supabase = await createServerSupabase();

  const { data: clients, error } = await supabase
    .from('legal_clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading clients:', error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        <p className="text-gray-600 mt-1">
          Gestión de clientes del despacho
        </p>
      </div>

      <ClientsTable clients={(clients as LegalClient[]) || []} />
    </div>
  );
}