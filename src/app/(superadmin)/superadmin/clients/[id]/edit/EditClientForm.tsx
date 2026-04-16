'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  Upload,
  Image as ImageIcon,
  X,
  ShieldCheck,
  CircleDollarSign,
  Building2,
  Mail,
  Phone,
  User,
  MapPin,
  History,
  Pencil,
  CreditCard,
} from 'lucide-react';

type Client = {
  id: string;
  name: string | null;
  legal_name: string | null;
  slug: string | null;
  subdomain: string | null;
  email: string | null;
  phone: string | null;
  representative_name: string | null;
  country: string | null;
  city: string | null;
  postal_code: string | null;
  address: string | null;
  monthly_fee: number | null;
  currency: string | null;
  payment_status: string | null;
  tenant_status: string | null;
  next_due_date: string | null;
  notes: string | null;
  logo_url?: string | null;
  admin_name?: string | null;
  admin_email?: string | null;
  admin_phone?: string | null;
  admin_role?: string | null;
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
  children,
  required,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </label>
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {children}
    </div>
  );
}

function statusBadge(value: string) {
  switch (value) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'trial':
      return 'bg-violet-100 text-violet-700 border border-violet-200';
    case 'suspended':
      return 'bg-rose-100 text-rose-700 border border-rose-200';
    case 'cancelled':
      return 'bg-slate-200 text-slate-700 border border-slate-300';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

function statusText(value: string) {
  switch (value) {
    case 'active':
      return 'Activa';
    case 'trial':
      return 'En prueba';
    case 'suspended':
      return 'Suspendida';
    case 'cancelled':
      return 'Cancelada';
    default:
      return 'Sin definir';
  }
}

function paymentBadge(value: string) {
  switch (value) {
    case 'current':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'pending':
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'overdue':
      return 'bg-rose-100 text-rose-700 border border-rose-200';
    case 'grace':
      return 'bg-sky-100 text-sky-700 border border-sky-200';
    case 'suspended':
      return 'bg-slate-200 text-slate-700 border border-slate-300';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

function paymentText(value: string) {
  switch (value) {
    case 'current':
      return 'Al día';
    case 'pending':
      return 'Pendiente';
    case 'overdue':
      return 'Vencido';
    case 'grace':
      return 'En gracia';
    case 'suspended':
      return 'Suspendido';
    default:
      return 'Sin definir';
  }
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export default function EditClientForm({ client }: { client: Client }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    name: client.name || '',
    legalName: client.legal_name || '',
    slug: client.slug || '',
    email: client.email || '',
    phone: client.phone || '',
    representativeName: client.representative_name || '',
    country: client.country || '',
    city: client.city || '',
    postalCode: client.postal_code || '',
    address: client.address || '',
    monthlyFee: String(client.monthly_fee ?? 0),
    currency: client.currency || 'GTQ',
    paymentStatus: client.payment_status || 'current',
    tenantStatus: client.tenant_status || 'active',
    nextDueDate: client.next_due_date || '',
    notes: client.notes || '',
    logoUrl: client.logo_url || '',
    adminName: client.admin_name || '',
    adminEmail: client.admin_email || '',
    adminPhone: client.admin_phone || '',
    adminRole: client.admin_role || 'Administrador',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const subdomainPreview = useMemo(() => {
    const slug = normalizeSlug(form.slug || form.name || '');
    return slug ? `${slug}.innovaservicesav.com` : 'cliente.innovaservicesav.com';
  }, [form.slug, form.name]);

  const update = (key: string, value: string) => {
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

  const handleLogoSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isValidType = ['image/png', 'image/jpeg', 'image/webp'].includes(
      file.type
    );

    if (!isValidType) {
      setError('Solo se permiten imágenes PNG, JPG o WEBP.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no debe superar 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setForm((prev) => ({ ...prev, logoUrl: result }));
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setForm((prev) => ({ ...prev, logoUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/superadmin/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          slug: normalizeSlug(form.slug || form.name),
          monthlyFee: Number(form.monthlyFee || 0),
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const payload = isJson ? await res.json() : null;

      if (!res.ok) {
        setError(payload?.error || `No se pudo guardar. Código: ${res.status}`);
        setLoading(false);
        return;
      }

      setSuccess('Cambios guardados correctamente');
      setLoading(false);
      router.refresh();
    } catch {
      setError('No se pudo conectar con la API.');
      setLoading(false);
    }
  };

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    // @ts-ignore
    if (typeof input.showPicker === 'function') input.showPicker();
    else input.focus();
  };

  const formatDate = (date: string) => {
    if (!date) return 'Sin definir';
    const d = new Date(date + 'T12:00:00');
    return d.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Breadcrumb + Actions */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          <Link href="/superadmin" className="hover:text-slate-700">Inicio</Link>
          <span className="mx-2 text-slate-300">›</span>
          <Link href="/superadmin/clients" className="hover:text-slate-700">Clientes</Link>
          <span className="mx-2 text-slate-300">›</span>
          <span className="text-slate-600">{client.name}</span>
          <span className="mx-2 text-slate-300">›</span>
          <span className="font-medium text-slate-900">Modificar</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <History className="h-4 w-4" />
            Historial
          </button>
          <Link
            href="/superadmin/clients"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Regresar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* LEFT COLUMN - MAIN FORM */}
        <div className="xl:col-span-8">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Card header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900">Datos de la empresa</h2>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-100">
                    <Pencil className="h-3 w-3" />
                    Editar
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Edita toda la información comercial y operativa del cliente.
                </p>
              </div>
            </div>

            {/* Two columns inside: Empresa + Admin */}
            <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
              {/* COLUMN 1: DATOS DE LA EMPRESA */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Datos de la empresa
                </h3>

                <Field label="Nombre comercial" required>
                  <input
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Clinica dental Zavala"
                  />
                </Field>

                <Field label="Razón social">
                  <input
                    className={inputClass}
                    value={form.legalName}
                    onChange={(e) => update('legalName', e.target.value)}
                    placeholder="Clinica Dental Zavala S.A."
                  />
                </Field>

                <Field label="Slug / subdominio" required>
                  <input
                    className={inputClass}
                    value={form.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="clinica-dental-zavala"
                  />
                </Field>

                <Field label="Teléfono principal">
                  <input
                    className={inputClass}
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="38079626"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Dirección">
                    <input
                      className={inputClass}
                      value={form.address}
                      onChange={(e) => update('address', e.target.value)}
                      placeholder="San Pedro Carchá"
                    />
                  </Field>

                  <Field label="Código postal">
                    <input
                      className={inputClass}
                      value={form.postalCode}
                      onChange={(e) => update('postalCode', e.target.value)}
                      placeholder="16001"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Estado">
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

                  <Field label="Ciudad">
                    <input
                      className={inputClass}
                      value={form.city}
                      onChange={(e) => update('city', e.target.value)}
                      placeholder="Alta Verapaz"
                    />
                  </Field>
                </div>

                <Field label="Mensualidad">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={`${inputClass} pr-20`}
                      value={form.monthlyFee}
                      onChange={(e) => update('monthlyFee', e.target.value)}
                      placeholder="150.00"
                    />
                    <select
                      value={form.currency}
                      onChange={(e) => update('currency', e.target.value)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 outline-none"
                    >
                      <option value="GTQ">GTQ</option>
                      <option value="USD">USD</option>
                      <option value="MXN">MXN</option>
                    </select>
                  </div>
                </Field>

                <Field label="Próximo cobro">
                  <div className="relative">
                    <input
                      ref={dateInputRef}
                      type="date"
                      className={`${inputClass} pr-11`}
                      value={form.nextDueDate}
                      onChange={(e) => update('nextDueDate', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={openDatePicker}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <CalendarDays className="h-4 w-4" />
                    </button>
                  </div>
                </Field>
              </div>

              {/* COLUMN 2: ADMINISTRADOR PRINCIPAL */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Administrador principal
                </h3>

                <Field label="Nombre">
                  <div className="relative">
                    <input
                      className={`${inputClass} pl-10`}
                      value={form.adminName}
                      onChange={(e) => update('adminName', e.target.value)}
                      placeholder="Alicia Zavala"
                    />
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </Field>

                <Field label="Rol">
                  <select
                    className={inputClass}
                    value={form.adminRole}
                    onChange={(e) => update('adminRole', e.target.value)}
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Doctora">Doctora</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Asistente">Asistente</option>
                    <option value="Recepción">Recepción</option>
                    <option value="Caja">Caja</option>
                  </select>
                </Field>

                <Field label="Correo">
                  <div className="relative">
                    <input
                      type="email"
                      className={`${inputClass} pl-10`}
                      value={form.adminEmail}
                      onChange={(e) => update('adminEmail', e.target.value)}
                      placeholder="adentalzavala@gmail.com"
                    />
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </Field>

                <Field label="Teléfono principal">
                  <div className="relative">
                    <input
                      className={`${inputClass} pl-10`}
                      value={form.adminPhone}
                      onChange={(e) => update('adminPhone', e.target.value)}
                      placeholder="38079626"
                    />
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </Field>

                <Field label="Código postal">
                  <input
                    className={inputClass}
                    value={form.postalCode}
                    onChange={(e) => update('postalCode', e.target.value)}
                    placeholder="16001"
                  />
                </Field>

                <Field label="Notas internas">
                  <textarea
                    rows={6}
                    className={`${inputClass} resize-none`}
                    value={form.notes}
                    onChange={(e) => update('notes', e.target.value)}
                    placeholder="Escribe notas internas aquí..."
                  />
                </Field>

                {/* Logo upload */}
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <p className="mb-3 text-xs font-medium text-slate-600">Logo de la empresa</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoSelect}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {form.logoUrl ? 'Cambiar' : 'Seleccionar'}
                    </button>
                    {form.logoUrl && (
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN - SUMMARY */}
        <div className="space-y-4 xl:col-span-4">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-xl font-bold text-slate-900">Resumen</h2>
            </div>

            <div className="space-y-4 p-6">
              {/* Logo preview */}
              <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-6">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Logo"
                    className="max-h-24 max-w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-300">
                    <ImageIcon className="h-10 w-10" />
                    <span className="text-xs">Sin logo</span>
                  </div>
                )}
              </div>

              {/* Empresa */}
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Empresa
                </div>
                <div className="mt-1 text-base font-semibold text-slate-900">
                  {form.name || 'Sin definir'}
                </div>
              </div>

              {/* Subdominio */}
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Subdominio
                </div>
                <div className="mt-1 break-all text-sm font-semibold text-blue-600">
                  {subdomainPreview}
                </div>
              </div>

              {/* Dos columnas: Cobro + Estado */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Próximo cobro
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    {formatDate(form.nextDueDate)}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Estado del cliente
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    {statusText(form.tenantStatus)}
                  </div>
                </div>
              </div>

              {/* Mensualidad + Pago */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Mensualidad
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    {Number(form.monthlyFee || 0).toFixed(0)} {form.currency}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <CircleDollarSign className="h-3 w-3" />
                    Estado de pago
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    {paymentText(form.paymentStatus)}
                  </div>
                </div>
              </div>

              {/* Metodo de pago */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <CreditCard className="h-3 w-3" />
                    Método
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    Transferencia
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <ShieldCheck className="h-3 w-3" />
                    Estado
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    {form.monthlyFee} {form.currency}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Action buttons */}
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Guardando cambios...' : 'Guardar cambios'}
            </button>

            <Link
              href="/superadmin/clients"
              className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </Link>
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}
        </div>
      </div>
    </form>
  );
}