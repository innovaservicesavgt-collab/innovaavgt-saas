'use client';

import { useState, useTransition, useRef } from 'react';
import { toast } from 'sonner';
import { User, Mail, Phone, FileBadge, ArrowRight, ArrowLeft, Upload, Image as ImageIcon } from 'lucide-react';
import { saveOnboardingStep2, uploadOnboardingImage } from '@/server/actions/onboarding';
import type { ProfessionalData } from '@/lib/types/onboarding';
import { COMMON_TITLES, COMMON_SPECIALTIES } from '@/lib/types/onboarding';

type Props = {
  data: ProfessionalData;
  onChange: (data: ProfessionalData) => void;
  onNext: () => void;
  onBack: () => void;
  vertical: string;
};

export function Step2Professional({ data, onChange, onNext, onBack, vertical }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof ProfessionalData>(key: K, value: ProfessionalData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const handlePhotoUpload = async (file: File) => {
    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadOnboardingImage(fd, 'photo');
    setIsUploading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    update('photo_url', res.url);
    toast.success('Foto subida');
  };

  const canSubmit =
    data.first_name.trim().length >= 2 && data.last_name.trim().length >= 2;

  const handleNext = () => {
    if (!canSubmit) {
      toast.error('Nombre y apellido son obligatorios');
      return;
    }

    startTransition(async () => {
      const res = await saveOnboardingStep2({
        title: data.title,
        first_name: data.first_name,
        last_name: data.last_name,
        specialty: data.specialty,
        email: data.email,
        phone: data.phone,
        license_number: data.license_number,
        photo_url: data.photo_url,
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
        <div className="mx-auto h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center mb-3">
          <User className="h-6 w-6 text-violet-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Tu primer {vertical === 'legal' ? 'abogado' : 'profesional'}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Podras agregar mas profesionales despues. Por ahora vamos con el principal.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Titulo</label>
            <select
              value={data.title || ''}
              onChange={(e) => update('title', e.target.value)}
              className="form-input"
            >
              {COMMON_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={data.first_name}
              onChange={(e) => update('first_name', e.target.value)}
              placeholder="Juan"
              className="form-input"
            />
          </div>
        </div>

        <Field label="Apellido *">
          <input
            type="text"
            value={data.last_name}
            onChange={(e) => update('last_name', e.target.value)}
            placeholder="Perez"
            className="form-input"
          />
        </Field>

        {vertical === 'dental' && (
          <Field label="Especialidad">
            <select
              value={data.specialty || ''}
              onChange={(e) => update('specialty', e.target.value)}
              className="form-input"
            >
              {COMMON_SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        )}

        <Field label="Email" icon={<Mail className="h-4 w-4" />}>
          <input
            type="email"
            value={data.email || ''}
            onChange={(e) => update('email', e.target.value)}
            placeholder="profesional@email.com"
            className="form-input"
          />
        </Field>

        <Field label="Telefono" icon={<Phone className="h-4 w-4" />}>
          <input
            type="tel"
            value={data.phone || ''}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="+502 1234-5678"
            className="form-input"
          />
        </Field>

        <Field label="Numero de colegiado" icon={<FileBadge className="h-4 w-4" />}>
          <input
            type="text"
            value={data.license_number || ''}
            onChange={(e) => update('license_number', e.target.value)}
            placeholder="Colegiado #1234"
            className="form-input"
          />
        </Field>

        <Field label="Foto del profesional (opcional)" icon={<ImageIcon className="h-4 w-4" />}>
          <div className="flex items-center gap-3">
            {data.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.photo_url}
                alt="Foto"
                className="h-16 w-16 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                <User className="h-6 w-6 text-slate-400" />
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {isUploading ? 'Subiendo...' : data.photo_url ? 'Cambiar' : 'Subir'}
            </button>
          </div>
        </Field>
      </div>

      <div className="mt-6 flex justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Atras
        </button>
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
