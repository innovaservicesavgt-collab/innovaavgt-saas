import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LegalCaseWithRelations } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type Props = {
  caseData: LegalCaseWithRelations;
};

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-4 py-2 border-b border-gray-100 last:border-0">
      <div className="text-sm text-gray-500 md:w-48 shrink-0">{label}</div>
      <div className="text-sm text-gray-900 md:flex-1">
        {value ? value : <span className="text-gray-400">—</span>}
      </div>
    </div>
  );
}

export function CaseInfoTab({ caseData }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información general</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow label="Número interno" value={caseData.numero_interno} />
          <InfoRow label="Número judicial" value={caseData.numero_judicial} />
          <InfoRow label="Materia" value={caseData.materia} />
          <InfoRow label="Tipo de proceso" value={caseData.tipo_proceso} />
          <InfoRow label="Estado procesal" value={caseData.estado_procesal} />
          <InfoRow
            label="Fecha de inicio"
            value={
              caseData.fecha_inicio
                ? format(new Date(caseData.fecha_inicio), "dd/MM/yyyy", { locale: es })
                : null
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Partes y jurisdicción</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow label="Cliente" value={caseData.client?.nombre} />
          <InfoRow label="Parte contraria" value={caseData.parte_contraria} />
          <InfoRow
            label="Órgano jurisdiccional"
            value={caseData.organo_jurisdiccional}
          />
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

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Seguimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow
            label="Última actuación"
            value={
              caseData.ultima_actuacion
                ? format(new Date(caseData.ultima_actuacion), "dd/MM/yyyy HH:mm", {
                    locale: es,
                  })
                : null
            }
          />
          <InfoRow
            label="Próxima actuación"
            value={
              caseData.proxima_actuacion
                ? format(new Date(caseData.proxima_actuacion), "dd/MM/yyyy", {
                    locale: es,
                  })
                : null
            }
          />
          <InfoRow
            label="Creado"
            value={
              caseData.created_at
                ? format(new Date(caseData.created_at), "dd/MM/yyyy HH:mm", {
                    locale: es,
                  })
                : null
            }
          />
          <InfoRow
            label="Última actualización"
            value={
              caseData.updated_at
                ? format(new Date(caseData.updated_at), "dd/MM/yyyy HH:mm", {
                    locale: es,
                  })
                : null
            }
          />
        </CardContent>
      </Card>

      {caseData.observaciones && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Observaciones estratégicas</CardTitle>
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