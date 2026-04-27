import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Calendar, AlertCircle, Users } from 'lucide-react';
import { getCurrentProfile } from '@/lib/tenant';
import { createServerSupabase } from '@/lib/supabase/server';
import { getFinancesDashboardData } from '@/app/legal/finances/dashboard-actions';
import { FinancesMiniWidget } from './components/finances-mini-widget';

export default async function LegalDashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createServerSupabase();

  // ============================================================
  // QUERIES EN PARALELO
  // ============================================================

  // Rango de "hoy" (00:00 a 23:59)
  const hoy = new Date();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
  const finHoy = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate(),
    23,
    59,
    59
  ).toISOString();

  // Rango de "próximos 3 días"
  const finUrgentes = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate() + 3,
    23,
    59,
    59
  ).toISOString();

  const [
    eventosHoyRes,
    urgentesRes,
    expedientesActivosRes,
    clientesRes,
    financesData,
  ] = await Promise.all([
    supabase
      .from('legal_events')
      .select('id', { count: 'exact', head: true })
      .gte('fecha_hora', inicioHoy)
      .lte('fecha_hora', finHoy)
      .eq('completado', false),

    supabase
      .from('legal_events')
      .select('id', { count: 'exact', head: true })
      .gte('fecha_hora', inicioHoy)
      .lte('fecha_hora', finUrgentes)
      .eq('completado', false),

    supabase
      .from('legal_cases')
      .select('id', { count: 'exact', head: true })
      .eq('archivado', false),

    supabase
      .from('legal_clients')
      .select('id', { count: 'exact', head: true })
      .eq('activo', true),

    getFinancesDashboardData(),
  ]);

  const audienciasHoy = eventosHoyRes.count ?? 0;
  const plazosUrgentes = urgentesRes.count ?? 0;
  const expedientesActivos = expedientesActivosRes.count ?? 0;
  const totalClientes = clientesRes.count ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {profile?.first_name}
        </h1>
        <p className="text-gray-600 mt-1">Panel principal del módulo jurídico</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Audiencias hoy
            </CardTitle>
            <Calendar className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{audienciasHoy}</div>
            <p className="text-xs text-gray-500 mt-1">
              {audienciasHoy === 0
                ? 'Sin audiencias programadas'
                : audienciasHoy === 1
                ? 'Programada para hoy'
                : 'Programadas para hoy'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Expedientes activos
            </CardTitle>
            <Briefcase className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expedientesActivos}</div>
            <p className="text-xs text-gray-500 mt-1">En trámite</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Plazos urgentes
            </CardTitle>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plazosUrgentes}</div>
            <p className="text-xs text-gray-500 mt-1">Próximos 3 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clientes
            </CardTitle>
            <Users className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClientes}</div>
            <p className="text-xs text-gray-500 mt-1">En total</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Bienvenida + Widget financiero */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Bienvenido al módulo jurídico</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Este es tu centro de control para la gestión integral del despacho.
              Desde aquí puedes administrar expedientes, audiencias, clientes,
              documentos y más.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Empieza creando tu primer cliente o expediente desde el menú
              lateral.
            </p>
          </CardContent>
        </Card>

        <FinancesMiniWidget data={financesData} />
      </div>
    </div>
  );
}