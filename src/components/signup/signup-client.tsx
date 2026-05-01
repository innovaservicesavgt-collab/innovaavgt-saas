'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  Stethoscope,
  Scale,
} from 'lucide-react';
import { publicSignup } from '@/server/actions/signup';
import { isValidEmail, isValidPassword } from '@/lib/types/signup';
import { PlanSelector } from './plan-selector';

type Plan = {
  id: string;
  code: string;
  vertical: string;
  name: string;
  monthly_price: number;
  trial_days: number;
  description: string | null;
  features: Record<string, unknown>;
  max_users: number | null;
  storage_mb: number | null;
};

type Props = {
  initialVertical: 'dental' | 'legal';
  plans: Plan[];
};

export function SignupClient({ initialVertical, plans }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [vertical, setVertical] = useState<'dental' | 'legal'>(initialVertical);
  // Default: plan medio (Pro)
  const proPlan = plans.find((p) => p.code.includes('pro'));
  const [planId, setPlanId] = useState<string>(proPlan?.id || plans[0]?.id || '');

  const [tenantName, setTenantName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Validaciones en tiempo real
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (email && !isValidEmail(email)) errs.email = 'Email invalido';
    if (password) {
      const c = isValidPassword(password);
      if (!c.ok) errs.password = c.error || 'Contrasena debil';
    }
    return errs;
  }, [email, password]);

  const canSubmit =
    tenantName.trim().length >= 2 &&
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    email.trim().length > 0 &&
    !errors.email &&
    password.length >= 8 &&
    !errors.password &&
    acceptTerms &&
    planId.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error('Completa todos los campos correctamente');
      return;
    }

    startTransition(async () => {
      const res = await publicSignup({
        vertical,
        plan_id: planId,
        tenant_name: tenantName.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        password,
        accept_terms: acceptTerms,
      });

      if (!res.ok) {
        toast.error(res.error || 'Error al crear cuenta');
        return;
      }

      toast.success('Cuenta creada. Revisa tu email para confirmar.');
      const warningParam = ('warning' in res && res.warning) ? '&warning=1' : '';
      router.push('/signup/check-email?email=' + encodeURIComponent(email) + warningParam);
    });
  };

  // Cambiar vertical: actualizar URL y resetear plan
  const changeVertical = (v: 'dental' | 'legal') => {
    setVertical(v);
    router.push('/signup?vertical=' + v);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* PASO 1: Vertical */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Que tipo de negocio tienes?</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => changeVertical('dental')}
            className={
              'rounded-xl border-2 p-4 text-left transition ' +
              (vertical === 'dental'
                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100'
                : 'border-gray-200 hover:border-gray-300')
            }
          >
            <Stethoscope className={'h-6 w-6 mb-2 ' + (vertical === 'dental' ? 'text-blue-600' : 'text-gray-400')} />
            <p className="font-bold text-gray-900">Clinica Dental</p>
            <p className="text-xs text-gray-600 mt-0.5">Pacientes, citas, tratamientos, cobros</p>
          </button>
          <button
            type="button"
            onClick={() => changeVertical('legal')}
            className={
              'rounded-xl border-2 p-4 text-left transition ' +
              (vertical === 'legal'
                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100'
                : 'border-gray-200 hover:border-gray-300')
            }
          >
            <Scale className={'h-6 w-6 mb-2 ' + (vertical === 'legal' ? 'text-blue-600' : 'text-gray-400')} />
            <p className="font-bold text-gray-900">Despacho Legal</p>
            <p className="text-xs text-gray-600 mt-0.5">Clientes, casos, audiencias, honorarios</p>
          </button>
        </div>
      </section>

      {/* PASO 2: Plan */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Elige tu plan (puedes cambiar despues)</h2>
        <PlanSelector plans={plans} selectedId={planId} onChange={setPlanId} />
      </section>

      {/* PASO 3: Datos */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-900">Tus datos</h2>

        <Field label={vertical === 'dental' ? 'Nombre de la clinica' : 'Nombre del despacho'} icon={<Building2 className="h-4 w-4" />}>
          <input
            type="text"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            placeholder={vertical === 'dental' ? 'Ej: Clinica Dental Sonrisa' : 'Ej: Despacho Lopez & Asociados'}
            className="form-input"
            required
            minLength={2}
            maxLength={200}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Tu nombre" icon={<User className="h-4 w-4" />}>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Juan"
              className="form-input"
              required
              minLength={2}
              maxLength={100}
            />
          </Field>
          <Field label="Tu apellido">
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Perez"
              className="form-input"
              required
              minLength={2}
              maxLength={100}
            />
          </Field>
        </div>

        <Field label="Email" icon={<Mail className="h-4 w-4" />} error={errors.email}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="form-input"
            required
            autoComplete="email"
          />
        </Field>

        <Field label="Telefono (opcional)" icon={<Phone className="h-4 w-4" />}>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+502 1234-5678"
            className="form-input"
            autoComplete="tel"
          />
        </Field>

        <Field label="Contrasena" icon={<Lock className="h-4 w-4" />} error={errors.password}>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 8 caracteres"
              className="form-input pr-10"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">
            Al menos 8 caracteres con letras y numeros
          </p>
        </Field>
      </section>

      {/* PASO 4: Aceptar */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Acepto los{' '}
            <Link href="/terms" target="_blank" className="text-blue-600 hover:underline">
              Terminos y Condiciones
            </Link>
            {' y la '}
            <Link href="/privacy" target="_blank" className="text-blue-600 hover:underline">
              Politica de Privacidad
            </Link>
          </span>
        </label>
      </section>

      {/* Boton submit */}
      <button
        type="submit"
        disabled={!canSubmit || isPending}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-bold text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-sm"
      >
        {isPending ? (
          <>
            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Creando cuenta...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Crear cuenta gratis
          </>
        )}
      </button>

      {/* Beneficios */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <p className="text-sm font-bold text-emerald-900 mb-2">Tu prueba gratuita incluye:</p>
        <ul className="space-y-1 text-sm text-emerald-800">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            Acceso completo a todas las funciones del plan
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            Sin necesidad de tarjeta de credito
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            Soporte por email durante el periodo de prueba
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            Cancelacion automatica si no contratas plan
          </li>
        </ul>
      </div>

      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(209 213 219);
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          background-color: white;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        :global(.form-input:focus) {
          border-color: rgb(59 130 246);
          box-shadow: 0 0 0 3px rgb(219 234 254);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
        {icon && <span className="text-gray-400">{icon}</span>}
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
