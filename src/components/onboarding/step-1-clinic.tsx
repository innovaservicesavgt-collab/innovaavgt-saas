'use client';

import { useState, useTransition, useRef } from 'react';
import { toast } from 'sonner';
import { Building2, MapPin, Phone, Image as ImageIcon, Palette, ArrowRight, Upload } from 'lucide-react';
import { saveOnboardingStep1, uploadOnboardingImage } from '@/server/actions/onboarding';
import type { ClinicData } from '@/lib/types/onboarding';

type Props = {
  data: ClinicData;
  onChange: (data: ClinicData) => void;
  onNext: () => void;
  vertical: string;
};

export function Step1Clinic({ data, onChange, onNext, vertical }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof ClinicData>(key: K, value: ClinicData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const handleLogoUpload = async (file: File) => {
    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadOnboardingImage(fd, 'logo');
    setIsUploading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    update('logo_url', res.url);
    toast.success('Logo subido');
  };

  const canSubmit = data.name.trim().length >= 2;

  const handleNext = () => {
    if (!canSubmit) {
      toast.error('Ingresa el nombre de tu ' + (vertical === 'legal' ? 'despacho' : 'clinica'));
      return;
    }

    startTransition(async () => {
      const res = await saveOnboardingStep1({
        name: data.name,
        address: data.address || null,
        phone: data.phone || null,
        logo_url: data.logo_url,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
      });
      if (!res.ok) {
        toast.error(res.error || 'Error');
        return;
      }
      onNext();
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
      <div className="text-center mb-6">
        <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
          <Building2 className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Datos de tu {vertical === 'legal' ? 'despacho' : 'clinica'}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Esta informacion aparecera en recibos, recetas y comunicaciones
        </p>
      </div>

      <div className="space-y-4">
        <Field label="Nombre comercial *" icon={<Building2 className="h-4 w-4" />}>
          <input
            type="text"
            value={data.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder={vertical === 'legal' ? 'Despacho Lopez & Asociados' : 'Clinica Dental Sonrisa'}
            className="form-input"
            maxLength={200}
          />
        </Field>

        <Field label="Direccion" icon={<MapPin className="h-4 w-4" />}>
          <input
            type="text"
            value={data.address}
            onChange={(e) => update('address', e.target.value)}
            placeholder="12 Calle 5-15, Zona 1, Guatemala"
            className="form-input"
            maxLength={500}
          />
        </Field>

        <Field label="Telefono" icon={<Phone className="h-4 w-4" />}>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="+502 1234-5678"
            className="form-input"
          />
        </Field>

        <Field label="Logo (opcional)" icon={<ImageIcon className="h-4 w-4" />}>
          <div className="flex items-center gap-3">
            {data.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.logo_url}
                alt="Logo"
                className="h-16 w-16 rounded-lg object-cover border border-slate-200"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-slate-400" />
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {isUploading ? 'Subiendo...' : data.logo_url ? 'Cambiar logo' : 'Subir logo'}
            </button>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Color principal" icon={<Palette className="h-4 w-4" />}>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={data.primary_color}
                onChange={(e) => update('primary_color', e.target.value)}
                className="h-10 w-14 rounded cursor-pointer border border-slate-300"
              />
              <input
                type="text"
                value={data.primary_color}
                onChange={(e) => update('primary_color', e.target.value)}
                placeholder="#2563eb"
                className="form-input flex-1 font-mono text-xs"
                maxLength={7}
              />
            </div>
          </Field>
          <Field label="Color secundario">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={data.secondary_color}
                onChange={(e) => update('secondary_color', e.target.value)}
                className="h-10 w-14 rounded cursor-pointer border border-slate-300"
              />
              <input
                type="text"
                value={data.secondary_color}
                onChange={(e) => update('secondary_color', e.target.value)}
                placeholder="#1e40af"
                className="form-input flex-1 font-mono text-xs"
                maxLength={7}
              />
            </div>
          </Field>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleNext}
          disabled={!canSubmit || isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm"
        >
          {isPending ? 'Guardando...' : 'Siguiente'}
          {!isPending && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>

      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(209 213 219);
          padding: 0.5rem 0.75rem;
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
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}
