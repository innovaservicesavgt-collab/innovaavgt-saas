import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function CaseNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <FileQuestion className="w-8 h-8 text-gray-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900">
        Expediente no encontrado
      </h1>
      <p className="text-gray-600 mt-2 max-w-md">
        El expediente que buscas no existe o no tienes permiso para verlo.
      </p>
      <Button asChild className="mt-6">
        <Link href="/legal/cases">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a expedientes
        </Link>
      </Button>
    </div>
  );
}