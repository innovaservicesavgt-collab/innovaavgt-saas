import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, Building2, FileText, MapPin } from 'lucide-react';
import type { LegalCaseWithRelations } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type Props = {
  caseData: LegalCaseWithRelations;
};

// ============================================================
// Componente InfoRow — fila simple etiqueta + valor
// ============================================================

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-4 py-2 border-b border-gray-100 last:border-0">
      <div className="text-sm text-gray-500 md:w-48 shrink-0">{label}</div>
      <div className="text-sm text-gray-900 md:flex-1">
        {value ? value : <span className="text-gray-400">—</span>}
      </div>
    </div>
  );
}

// ============================================================
// Colores de materia (para badges del juzgado)
// ============================================================

const MATERIA_COLORS: Record<string, string> = {
  CIVIL: 'bg-blue-100 text-blue-700',
  PENAL: 'bg-red-100 text-red-700',
  LABORAL: 'bg-amber-100 text-amber-700',
  FAMILIA: 'bg-pink-100 text-pink-700',
  MERCANTIL: 'bg-purple-100 text-purple-700',
  CONSTITUCIONAL: 'bg-indigo-100 text-indigo-700',
  ADMINISTRATIVO: 'bg-teal-100 text-teal-700',
  NIÑEZ: 'bg-green-100 text-green-700',
  ECONOMICO_COACTIVO: 'bg-cyan-100 text-cyan-700',
  MIXTO: 'bg-gray-100 text-gray-700',
};

const INSTANCIA_LABELS: Record<string, string> = {
  PAZ: 'Juzgado de Paz',
  PRIMERA_INSTANCIA: 'Primera Instancia',
  SENTENCIA: 'Tribunal de Sentencia',
  SALA: 'Sala de Apelaciones',
  CORTE_SUPREMA: 'Corte Suprema',
  CORTE_CONSTITUCIONAL: 'Corte de Constitucionalidad',
};

const TIPO_FISCALIA_LABELS: Record<string, string> = {
  FISCALIA_SECCION: 'Fiscalía de Sección',
  FISCALIA_DISTRITO: 'Fiscalía Distrital',
  FISCALIA_MUNICIPAL: 'Fiscalía Municipal',
  UNIDAD_ESPECIALIZADA: 'Unidad Especializada',
};

// ============================================================
// Componente principal
// ============================================================

export function CaseInfoTab({ caseData }: Props) {
  const tieneCatalogos = !!(
    caseData.juzgado ||
    caseData.fiscalia ||
    caseData.tipo_proceso_catalogo
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* ============================================================ */}
      {/* Card 1: Información general                                  */}
      {/* ============================================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información general</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow label="Número interno" value={caseData.numero_interno} />
          <InfoRow label="Número judicial" value={caseData.numero_judicial} />
          <InfoRow label="Materia" value={caseData.materia} />
          <InfoRow label="Estado procesal" value={caseData.estado_procesal} />
          <InfoRow
            label="Fecha de inicio"
            value={
              caseData.fecha_inicio
                ? format(new Date(caseData.fecha_inicio), 'dd/MM/yyyy', {
                    locale: es,
                  })
                : null
            }
          />
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* Card 2: Partes del proceso                                   */}
      {/* ============================================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Partes del proceso</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow label="Cliente" value={caseData.client?.nombre} />
          <InfoRow label="Parte contraria" value={caseData.parte_contraria} />
          <InfoRow
            label="Abogado responsable"
            value={
              caseData.abogado
                ? `${caseData.abogado.first_name} ${caseData.abogado.last_name}`.trim()
                : null
            }
          />
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* Card 3: Órgano jurisdiccional (NUEVO - Fase 12)              */}
      {/* ============================================================ */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Órgano jurisdiccional</CardTitle>
        </CardHeader>
        <CardContent>
          {!tieneCatalogos ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500">
                Sin órgano jurisdiccional asignado
              </p>
              {caseData.organo_jurisdiccional && (
                <p className="text-xs text-gray-400 mt-2">
                  Valor anterior: {caseData.organo_jurisdiccional}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-3">
                Edita el expediente para asignar un juzgado del catálogo
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tipo de proceso */}
              {caseData.tipo_proceso_catalogo && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-0.5">
                      Tipo de proceso
                    </div>
                    <div className="font-medium text-sm text-gray-900">
                      {caseData.tipo_proceso_catalogo.nombre}
                    </div>
                    {caseData.tipo_proceso_catalogo.via_procesal && (
                      <div className="text-xs text-gray-600 mt-1">
                        <span className="font-mono text-blue-600">
                          Vía: {caseData.tipo_proceso_catalogo.via_procesal}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Juzgado */}
              {caseData.juzgado && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <Scale className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-0.5">Juzgado</div>
                    <div className="font-medium text-sm text-gray-900">
                      {caseData.juzgado.nombre}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-1.5">
                      <Badge
                        className={cn(
                          'text-xs',
                          MATERIA_COLORS[caseData.juzgado.materia] ||
                            MATERIA_COLORS.MIXTO
                        )}
                      >
                        {caseData.juzgado.materia}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {INSTANCIA_LABELS[caseData.juzgado.instancia] ||
                          caseData.juzgado.instancia}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {caseData.juzgado.departamento}
                        {caseData.juzgado.municipio &&
                          caseData.juzgado.municipio !==
                            caseData.juzgado.departamento &&
                          `, ${caseData.juzgado.municipio}`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Fiscalía */}
              {caseData.fiscalia && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-0.5">
                      Fiscalía del MP
                    </div>
                    <div className="font-medium text-sm text-gray-900">
                      {caseData.fiscalia.nombre}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-1.5">
                      <Badge className="text-xs bg-red-100 text-red-700">
                        {TIPO_FISCALIA_LABELS[caseData.fiscalia.tipo] ||
                          caseData.fiscalia.tipo}
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {caseData.fiscalia.departamento}
                        {caseData.fiscalia.municipio &&
                          caseData.fiscalia.municipio !==
                            caseData.fiscalia.departamento &&
                          `, ${caseData.fiscalia.municipio}`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* Card 4: Seguimiento                                          */}
      {/* ============================================================ */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Seguimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow
            label="Última actuación"
            value={
              caseData.ultima_actuacion
                ? format(new Date(caseData.ultima_actuacion), 'dd/MM/yyyy HH:mm', {
                    locale: es,
                  })
                : null
            }
          />
          <InfoRow
            label="Próxima actuación"
            value={
              caseData.proxima_actuacion
                ? format(new Date(caseData.proxima_actuacion), 'dd/MM/yyyy', {
                    locale: es,
                  })
                : null
            }
          />
          <InfoRow
            label="Creado"
            value={
              caseData.created_at
                ? format(new Date(caseData.created_at), 'dd/MM/yyyy HH:mm', {
                    locale: es,
                  })
                : null
            }
          />
          <InfoRow
            label="Última actualización"
            value={
              caseData.updated_at
                ? format(new Date(caseData.updated_at), 'dd/MM/yyyy HH:mm', {
                    locale: es,
                  })
                : null
            }
          />
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* Card 5: Observaciones                                        */}
      {/* ============================================================ */}
      {caseData.observaciones && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Observaciones estratégicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {caseData.observaciones}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}