'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Receipt } from 'lucide-react';

type Props = {
  caseId: string;
  honorariosTab: React.ReactNode;
  gastosTab: React.ReactNode;
};

export function FinancesTabsWrapper({ honorariosTab, gastosTab }: Props) {
  return (
    <Tabs defaultValue="honorarios" className="w-full">
      <TabsList>
        <TabsTrigger value="honorarios">
          <DollarSign className="w-4 h-4 mr-2" />
          Honorarios
        </TabsTrigger>
        <TabsTrigger value="gastos">
          <Receipt className="w-4 h-4 mr-2" />
          Gastos
        </TabsTrigger>
      </TabsList>

      <TabsContent value="honorarios" className="mt-6">
        {honorariosTab}
      </TabsContent>

      <TabsContent value="gastos" className="mt-6">
        {gastosTab}
      </TabsContent>
    </Tabs>
  );
}