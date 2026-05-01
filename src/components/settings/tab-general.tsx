'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Building2, MapPin, Phone, Mail, Save } from 'lucide-react';
import { updateGeneralSettings } from '@/server/actions/settings';

type Tenant = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  email: string | null;
};

export function TabGeneral(props: { tenant: Tenant }) {
  const { tenant } = props;
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(tenant.name || '');
  const [address, setAddress] = useState(tenant.address || '');
  const [phone, setPhone] = useState(tenant.phone || '');
  const [email, setEmail] = useState(tenant.email || '');

  const handleSave = () => {
    if (name.trim().length < 2) {
      toast.error('El nombre debe tener al menos 2 caracteres');
      return;
    }

    startTransition(async () => {
      const res = await updateGeneralSettings({
        name: name.trim(),
        address: address.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
      });

      if (!res.ok) {
        toast.error(res.error || 'Error al guardar');
        return;
      }
      toast.success('Datos generales actualizados');
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">Datos generales</h2>
        <p className="text-sm text-slate-500 mt-0.5">Informacion basica de tu clinica</p>
      </div>

      <div className="space-y-4">
        <Field label="Nombre comercial" icon={<Building2 className="h-4 w-4" />} required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Clinica Dental Sonrisa"
            className="sett-input"
            maxLength={200}
          />
        </Field>

        <Field label="Direccion" icon={<MapPin className="h-4 w-4" />}>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="12 Calle 5-15, Zona 1, Guatemala"
            className="sett-input"
            maxLength={500}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Telefono" icon={<Phone className="h-4 w-4" />}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+502 1234-5678"
              className="sett-input"
              maxLength={50}
            />
          </Field>

          <Field label="Email de contacto" icon={<Mail className="h-4 w-4" />}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contacto@clinica.com"
              className="sett-input"
              maxLength={200}
            />
          </Field>
        </div>

        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Subdominio</p>
          <p className="text-sm font-mono font-bold text-slate-900">{tenant.slug}.innovaavgt.com</p>
          <p className="text-[11px] text-slate-400 mt-0.5">El subdominio no se puede cambiar despues de creado.</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm"
        >
          <Save className="h-4 w-4" />
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      <style jsx>{`
        :global(.sett-input) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(209 213 219);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background-color: white;
          outline: none;
        }
        :global(.sett-input:focus) {
          border-color: rgb(59 130 246);
          box-shadow: 0 0 0 3px rgb(219 234 254);
        }
      `}</style>
    </div>
  );
}

function Field(props: { label: string; icon?: React.ReactNode; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
        {props.icon ? <span className="text-slate-400">{props.icon}</span> : null}
        {props.label}
        {props.required ? <span className="text-rose-500">*</span> : null}
      </label>
      {props.children}
    </div>
  );
}
