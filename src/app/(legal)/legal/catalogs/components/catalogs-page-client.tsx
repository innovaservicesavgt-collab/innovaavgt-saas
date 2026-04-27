'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Scale, Building2, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type {
  CatalogJuzgado,
  CatalogFiscalia,
  CatalogTipoProceso,
} from '../types';
import { JuzgadosTable } from './juzgados-table';
import { FiscaliasTable } from './fiscalias-table';
import { TiposProcesoTable } from './tipos-proceso-table';

type Props = {
  juzgados: CatalogJuzgado[];
  fiscalias: CatalogFiscalia[];
  tiposProceso: CatalogTipoProceso[];
};

export function CatalogsPageClient({
  juzgados,
  fiscalias,
  tiposProceso,
}: Props) {
  return (
    <Tabs defaultValue="juzgados" className="w-full">
      <TabsList>
        <TabsTrigger value="juzgados" className="gap-2">
          <Scale className="w-4 h-4" />
          <span className="hidden sm:inline">Juzgados</span>
          <Badge variant="outline" className="ml-1 text-xs">
            {juzgados.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="fiscalias" className="gap-2">
          <Building2 className="w-4 h-4" />
          <span className="hidden sm:inline">Fiscalías</span>
          <Badge variant="outline" className="ml-1 text-xs">
            {fiscalias.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="tipos" className="gap-2">
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Tipos de proceso</span>
          <Badge variant="outline" className="ml-1 text-xs">
            {tiposProceso.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="juzgados" className="mt-6">
        <JuzgadosTable juzgados={juzgados} />
      </TabsContent>

      <TabsContent value="fiscalias" className="mt-6">
        <FiscaliasTable fiscalias={fiscalias} />
      </TabsContent>

      <TabsContent value="tipos" className="mt-6">
        <TiposProcesoTable tiposProceso={tiposProceso} />
      </TabsContent>
    </Tabs>
  );
}