import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireAuth } from '@/lib/auth/guards';
import { PatientNewForm } from '@/components/patients/patient-new-form';

export default async function NewPatientPage() {
  await requireAuth();

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Link
        href="/dental/patients"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a pacientes
      </Link>

      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Nuevo paciente
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Registra los datos del paciente. Solo nombre y apellido son obligatorios; el resto puede completarse despues.
        </p>
      </header>

      <PatientNewForm />
    </div>
  );
}
