'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, X, CalendarDays } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

type FormState = {
  name: string;
  legalName: string;
  slug: string;
  email: string;
  phone: string;
  representativeName: string;
  country: string;
  city: string;
  postalCode: string;
  address: string;
  monthlyFee: string;
  currency: string;
  paymentStatus: string;
  tenantStatus: string;
  nextDueDate: string;
  notes: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
};

const initialForm: FormState = {
  name: '',
  legalName: '',
  slug: '',
  email: '',
  phone: '',
  representativeName: '',
  country: '',
  city: '',
  postalCode: '',
  address: '',
  monthlyFee: '0',
  currency: 'GTQ',
  paymentStatus: 'current',
  tenantStatus: 'active',
  nextDueDate: '',
  notes: '',
  adminFirstName: '',
  adminLastName: '',
  adminEmail: '',
  adminPassword: '',
};

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="min-h-[28px]">
        <label className="block text-sm font-semibold text-slate-800">
          {label} {required ? <span className="text-rose-500">*</span> : null}
        </label>
      </div>

      <div className="min-h-[44px]">
        {hint ? <p className="text-sm leading-5 text-slate-500">{hint}</p> : null}
      </div>

      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

export default function NewClientPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoName, setLogoName] = useState('');
  const [nextDate, setNextDate] = useState<Date | null>(null);

  const subdomainPreview = useMemo(() => {
    const slug = normalizeSlug(form.slug || form.name || '');
    return slug ? `${slug}.innovaservicesav.com` : 'cliente.innovaservicesav.com';
  }, [form.slug, form.name]);

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: prev.slug ? prev.slug : normalizeSlug(value),
    }));
  };

  const handleSlugChange = (value: string) => {
    update('slug', normalizeSlug(value));
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoPreview('');
    setLogoName('');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      ...form,
      slug: normalizeSlug(form.slug || form.name),
    };

    const res = await fetch('/api/superadmin/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error || 'Error al crear cliente');
      setLoading(false);
      return;
    }

    router.push('/superadmin/clients');
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-[#31456F] px-6 py-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-200">Panel superadmin</p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight text-white">
              Nuevo cliente
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200">
              Registra una nueva empresa, define su estado comercial y crea el usuario administrador principal.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-slate-100">
            <div className="font-medium text-white">Subdominio estimado</div>
            <div className="mt-1 break-all text-blue-200">{subdomainPreview}</div>
          </div>
        </div>
      </section>

      <form onSubmit={submit} className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-2xl font-bold text-slate-900">Información de la empresa</h2>
              <p className="mt-1 text-base text-slate-500">
                Datos generales visibles y administrativos del cliente.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
              <Field label="Nombre comercial" hint="Nombre que verá el cliente en su portal." required>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Clínica Dental Zavala"
                />
              </Field>

              <Field label="Razón social" hint="Opcional. Para facturación o contratos.">
                <input
                  className={inputClass}
                  value={form.legalName}
                  onChange={(e) => update('legalName', e.target.value)}
                  placeholder="Clínica Dental Zavala, S.A."
                />
              </Field>

              <Field label="Slug / subdominio" hint="Solo minúsculas, números y guiones." required>
                <input
                  className={inputClass}
                  value={form.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="odontologia"
                />
              </Field>

              <Field label="Correo principal de la empresa" hint="Correo de contacto comercial o administrativo." required>
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="contacto@empresa.com"
                />
              </Field>

              <Field label="Teléfono principal" hint="Número principal de contacto.">
                <input
                  className={inputClass}
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+502 5555 5555"
                />
              </Field>

              <Field label="Representante o responsable" hint="Persona encargada del contrato o relación comercial.">
                <input
                  className={inputClass}
                  value={form.representativeName}
                  onChange={(e) => update('representativeName', e.target.value)}
                  placeholder="Dra. María Zavala"
                />
              </Field>

              <Field label="País" hint="País de operación de la empresa.">
                <input
                  className={inputClass}
                  value={form.country}
                  onChange={(e) => update('country', e.target.value)}
                  placeholder="Guatemala"
                />
              </Field>

              <Field label="Ciudad" hint="Ciudad principal.">
                <input
                  className={inputClass}
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  placeholder="Cobán"
                />
              </Field>

              <Field label="Código postal" hint="Código postal de la ubicación principal.">
                <input
                  className={inputClass}
                  value={form.postalCode}
                  onChange={(e) => update('postalCode', e.target.value)}
                  placeholder="16001"
                />
              </Field>

              <Field label="Mensualidad" hint="Monto que paga el cliente cada mes." required>
                <input
                  type="number"
                  className={inputClass}
                  value={form.monthlyFee}
                  onChange={(e) => update('monthlyFee', e.target.value)}
                  placeholder="250"
                />
              </Field>

              <Field label="Estado de pago" hint="Situación actual del cobro.">
                <select
                  className={inputClass}
                  value={form.paymentStatus}
                  onChange={(e) => update('paymentStatus', e.target.value)}
                >
                  <option value="current">Al día</option>
                  <option value="pending">Pendiente</option>
                  <option value="overdue">Vencido</option>
                  <option value="grace">En período de gracia</option>
                  <option value="suspended">Suspendido por pago</option>
                </select>
              </Field>

              <Field label="Estado de la empresa" hint="Controla si el cliente puede usar la plataforma.">
                <select
                  className={inputClass}
                  value={form.tenantStatus}
                  onChange={(e) => update('tenantStatus', e.target.value)}
                >
                  <option value="active">Activa</option>
                  <option value="trial">En prueba</option>
                  <option value="suspended">Suspendida</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </Field>

              <Field label="Moneda" hint="Moneda del cobro mensual.">
                <select
                  className={inputClass}
                  value={form.currency}
                  onChange={(e) => update('currency', e.target.value)}
                >
                  <option value="GTQ">Quetzales (GTQ)</option>
                  <option value="USD">Dólares (USD)</option>
                  <option value="MXN">Pesos mexicanos (MXN)</option>
                </select>
              </Field>

              <Field label="Próxima fecha de cobro" hint="Selecciona la siguiente fecha de vencimiento.">
                <div className="relative">
                  <DatePicker
                    selected={nextDate}
                    onChange={(date: Date | null) => {
                      setNextDate(date);
                      update('nextDueDate', date ? format(date, 'yyyy-MM-dd') : '');
                    }}
                    dateFormat="dd/MM/yyyy"
                    locale={es}
                    placeholderText="Seleccionar fecha"
                    className={`${inputClass} pr-12`}
                    calendarClassName="!border !border-slate-200 !rounded-2xl !shadow-lg"
                  />
                  <CalendarDays className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                </div>
              </Field>

              <div className="md:col-span-2">
                <Field label="Dirección" hint="Dirección física o fiscal de la empresa.">
                  <textarea
                    rows={4}
                    className={inputClass}
                    value={form.address}
                    onChange={(e) => update('address', e.target.value)}
                    placeholder="Zona, avenida, número, referencia..."
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-2xl font-bold text-slate-900">Administrador inicial</h2>
              <p className="mt-1 text-base text-slate-500">
                Usuario principal que tendrá acceso a la clínica.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
              <Field label="Nombre" hint="Nombre del usuario administrador." required>
                <input
                  className={inputClass}
                  value={form.adminFirstName}
                  onChange={(e) => update('adminFirstName', e.target.value)}
                  placeholder="Kevin"
                />
              </Field>

              <Field label="Apellido" hint="Apellido del usuario administrador." required>
                <input
                  className={inputClass}
                  value={form.adminLastName}
                  onChange={(e) => update('adminLastName', e.target.value)}
                  placeholder="Zavala"
                />
              </Field>

              <Field label="Correo del administrador" hint="Este será el usuario que iniciará sesión en la clínica." required>
                <input
                  type="email"
                  className={inputClass}
                  value={form.adminEmail}
                  onChange={(e) => update('adminEmail', e.target.value)}
                  placeholder="admin@clinica.com"
                />
              </Field>

              <Field label="Contraseña inicial" hint="Luego puede cambiarse." required>
                <input
                  type="password"
                  className={inputClass}
                  value={form.adminPassword}
                  onChange={(e) => update('adminPassword', e.target.value)}
                  placeholder="********"
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Notas internas" hint="Observaciones visibles solo para ti como superadmin.">
                  <textarea
                    rows={4}
                    className={inputClass}
                    value={form.notes}
                    onChange={(e) => update('notes', e.target.value)}
                    placeholder="Escribe aquí observaciones internas..."
                  />
                </Field>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-2xl font-bold text-slate-900">Identidad visual</h2>
              <p className="mt-1 text-base text-slate-500">
                Carga el logo de la empresa para personalizar su portal.
              </p>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex items-start gap-4">
                <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                  {logoPreview ? (
                    <>
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <ImagePlus className="mb-2 h-6 w-6" />
                      <span className="text-xs">Sin logo</span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <label className="inline-flex cursor-pointer items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                    Seleccionar imagen
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </label>

                  <p className="mt-3 text-sm text-slate-500">
                    Formatos recomendados: PNG, JPG o WEBP.
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Tamaño sugerido: 512 x 512 px.
                  </p>

                  {logoName ? (
                    <p className="mt-2 text-sm font-medium text-slate-700">{logoName}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-2xl font-bold text-slate-900">Resumen</h2>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Empresa</div>
                <div className="mt-1 text-base font-semibold text-slate-900">
                  {form.name || 'Sin definir'}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Subdominio</div>
                <div className="mt-1 break-all text-base font-semibold text-blue-700">
                  {subdomainPreview}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-3 text-sm text-slate-500">Mensualidad</div>
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700">
                    {form.currency}
                  </span>
                  <span className="text-2xl font-bold text-slate-900">
                    {Number(form.monthlyFee || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="sticky bottom-4 space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <button
              type="button"
              onClick={() => router.push('/superadmin/clients')}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70"
            >
              {loading ? 'Creando cliente...' : 'Crear cliente'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}