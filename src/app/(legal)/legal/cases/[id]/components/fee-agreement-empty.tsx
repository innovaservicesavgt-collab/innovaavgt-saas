'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Plus } from 'lucide-react';
import { FeeAgreementDialog } from './fee-agreement-dialog';

type Props = {
  caseId: string;
};

export function FeeAgreementEmpty({ caseId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <DollarSign className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Sin acuerdo de honorarios
            </h3>
            <p className="text-sm text-gray-500 mt-2 max-w-md">
              Configura los honorarios pactados con el cliente. Define monto total,
              modalidad de pago y cuotas si aplica.
            </p>
            <Button onClick={() => setOpen(true)} className="mt-6">
              <Plus className="w-4 h-4 mr-2" />
              Configurar honorarios
            </Button>
          </div>
        </CardContent>
      </Card>

      <FeeAgreementDialog
        open={open}
        onOpenChange={setOpen}
        caseId={caseId}
        agreement={null}
      />
    </>
  );
}