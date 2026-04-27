'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Pencil,
  MoreVertical,
  Archive,
  ArchiveRestore,
  UserIcon,
  Building2,
  MapPin,
  Calendar,
  Scale,
} from 'lucide-react';
import { useState } from 'react';
import { LegalCaseWithRelations } from '../../types';
import { getMateriaInfo } from '../../constants';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { archiveCase, unarchiveCase } from '../../actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type Props = {
  caseData: LegalCaseWithRelations;
  onEdit: () => void;
};

export function CaseDetailHeader({ caseData, onEdit }: Props) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const materia = getMateriaInfo(caseData.materia);
  const abogadoNombre = caseData.abogado
    ? `${caseData.abogado.first_name} ${caseData.abogado.last_name}`.trim()
    : 'Sin asignar';

  const handleArchive = async () => {
    setIsPending(true);
    const result = await archiveCase(caseData.id);
    setIsPending(false);
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleUnarchive = async () => {
    setIsPending(true);
    const result = await unarchiveCase(caseData.id);
    setIsPending(false);
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Botón volver */}
      <Link
        href="/legal/cases"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a expedientes
      </Link>

      {/* Título + acciones */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-900 font-mono">
              {caseData.numero_interno}
            </h1>
            <Badge className={cn(materia.color, 'hover:opacity-80')}>
              {materia.label}
            </Badge>
            {caseData.archivado && (
              <Badge variant="outline" className="text-gray-600">
                Archivado
              </Badge>
            )}
          </div>
          
          {caseData.numero_judicial && (
            <p className="text-sm text-gray-500 mt-1">
              Número judicial: <span className="font-mono">{caseData.numero_judicial}</span>
            </p>
          )}
          
          {caseData.tipo_proceso && (
            <p className="text-sm text-gray-600 mt-1">{caseData.tipo_proceso}</p>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          <Button onClick={onEdit} variant="outline">
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" disabled={isPending}>
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {caseData.archivado ? (
                <DropdownMenuItem onClick={handleUnarchive}>
                  <ArchiveRestore className="w-4 h-4 mr-2" />
                  Reactivar expediente
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="w-4 h-4 mr-2" />
                  Archivar expediente
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info rápida: cliente, parte contraria, juzgado, abogado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        {/* Cliente */}
        <div className="flex items-start gap-2">
          {caseData.client?.tipo_persona === 'JURIDICA' ? (
            <Building2 className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
          ) : (
            <UserIcon className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
          )}
          <div>
            <div className="text-xs text-gray-500">Cliente</div>
            <div className="text-sm font-medium">
              {caseData.client?.nombre ?? '—'}
            </div>
          </div>
        </div>

        {/* Parte contraria */}
        {caseData.parte_contraria && (
          <div className="flex items-start gap-2">
            <UserIcon className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-gray-500">Parte contraria</div>
              <div className="text-sm font-medium">{caseData.parte_contraria}</div>
            </div>
          </div>
        )}

        {/* Órgano jurisdiccional */}
        {caseData.organo_jurisdiccional && (
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-gray-500">Órgano jurisdiccional</div>
              <div className="text-sm font-medium">
                {caseData.organo_jurisdiccional}
              </div>
            </div>
          </div>
        )}

        {/* Abogado responsable */}
        <div className="flex items-start gap-2">
          <Scale className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
          <div>
            <div className="text-xs text-gray-500">Abogado responsable</div>
            <div className="text-sm font-medium">{abogadoNombre}</div>
          </div>
        </div>

        {/* Fecha de inicio */}
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
          <div>
            <div className="text-xs text-gray-500">Fecha de inicio</div>
            <div className="text-sm font-medium">
              {caseData.fecha_inicio
                ? format(new Date(caseData.fecha_inicio), "dd 'de' MMMM yyyy", {
                    locale: es,
                  })
                : '—'}
            </div>
          </div>
        </div>

        {/* Estado procesal */}
        {caseData.estado_procesal && (
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-gray-500">Estado procesal</div>
              <div className="text-sm font-medium">{caseData.estado_procesal}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}