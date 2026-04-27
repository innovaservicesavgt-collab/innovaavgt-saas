import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

type Props = {
  caseId: string;
};

export function CaseAgendaTab({ caseId }: Props) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-medium text-gray-900">
            Agenda del expediente
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md">
            Aquí aparecerán las audiencias, plazos y recordatorios 
            de este expediente. Lo implementamos en el Bloque 7.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}