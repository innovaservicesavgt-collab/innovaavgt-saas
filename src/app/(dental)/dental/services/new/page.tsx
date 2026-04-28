import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireAuth } from '@/lib/auth/guards';
import { ServiceForm } from '@/components/services/service-form';

export default async function NewServicePage() {
  await requireAuth();

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <Link
        href="/dental/services"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a servicios
      </Link>

      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Nuevo servicio
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Define un tratamiento que ofreces, su precio estándar y duración estimada.
        </p>
      </header>

      <ServiceForm mode="create" />
    </div>
  );
}