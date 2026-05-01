'use client';

import { useState, useTransition, useRef } from 'react';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  Edit2,
  X,
  Save,
  Mail,
  Phone,
  FileBadge,
  Power,
  PowerOff,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { saveProfessional, toggleProfessionalActive } from '@/server/actions/team';
import { uploadSettingsImage } from '@/server/actions/settings';

type Professional = {
  id: string;
  title: string | null;
  first_name: string;
  last_name: string;
  specialty: string | null;
  email: string | null;
  phone: string | null;
  license_number: string | null;
  photo_url: string | null;
  is_active: boolean;
  color: string | null;
};

const TITLES = ['Dr.', 'Dra.', 'Od.', 'Lic.'];
const SPECIALTIES = [
  'Odontologo general',
  'Endodoncia',
  'Ortodoncia',
  'Periodoncia',
  'Cirugia oral',
  'Odontopediatria',
  'Implantologia',
  'Protesis dental',
  'Estetica dental',
];

export function TabTeam(props: { professionals: Professional[] }) {
  const [editing, setEditing] = useState<Professional | 'new' | null>(null);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-700" />
              Profesionales
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {props.professionals.length} profesional{props.professionals.length === 1 ? '' : 'es'} registrado{props.professionals.length === 1 ? '' : 's'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setEditing('new')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Agregar
          </button>
        </div>

        {props.professionals.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No hay profesionales registrados. Agrega el primero.
          </div>
        ) : (
          <div className="space-y-2">
            {props.professionals.map((p) => (
              <ProfessionalRow
                key={p.id}
                professional={p}
                onEdit={() => setEditing(p)}
              />
            ))}
          </div>
        )}
      </div>

      {editing ? (
        <ProfessionalEditModal
          professional={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

function ProfessionalRow(props: { professional: Professional; onEdit: () => void }) {
  const [isPending, startTransition] = useTransition();
  const p = props.professional;
  const fullName = (p.title ? p.title + ' ' : '') + p.first_name + ' ' + p.last_name;

  const handleToggle = () => {
    startTransition(async () => {
      const res = await toggleProfessionalActive(p.id, !p.is_active);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(p.is_active ? 'Profesional desactivado' : 'Profesional activado');
    });
  };

  return (
    <div className={'rounded-lg border p-3 flex items-center gap-3 ' + (p.is_active ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60')}>
      {p.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.photo_url} alt={fullName} className="h-10 w-10 rounded-full object-cover border border-slate-200" />
      ) : (
        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">
          {p.first_name.charAt(0)}{p.last_name.charAt(0)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 truncate">{fullName}</p>
        <p className="text-xs text-slate-500 truncate">{p.specialty || 'Sin especialidad'}</p>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={props.onEdit}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          title="Editar"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className={'rounded-lg p-2 ' + (p.is_active ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50')}
          title={p.is_active ? 'Desactivar' : 'Activar'}
        >
          {p.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function ProfessionalEditModal(props: { professional: Professional | null; onClose: () => void }) {
  const isNew = !props.professional;
  const p = props.professional;

  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(p?.title || 'Dr.');
  const [firstName, setFirstName] = useState(p?.first_name || '');
  const [lastName, setLastName] = useState(p?.last_name || '');
  const [specialty, setSpecialty] = useState(p?.specialty || 'Odontologo general');
  const [email, setEmail] = useState(p?.email || '');
  const [phone, setPhone] = useState(p?.phone || '');
  const [licenseNumber, setLicenseNumber] = useState(p?.license_number || '');
  const [photoUrl, setPhotoUrl] = useState<string | null>(p?.photo_url || null);

  const handlePhotoUpload = async (file: File) => {
    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadSettingsImage(fd, 'photo');
    setIsUploading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setPhotoUrl(res.url);
    toast.success('Foto subida');
  };

  const handleSave = () => {
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      toast.error('Nombre y apellido obligatorios');
      return;
    }

    startTransition(async () => {
      const res = await saveProfessional({
        id: p?.id || null,
        title,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        specialty,
        email: email.trim() || null,
        phone: phone.trim() || null,
        license_number: licenseNumber.trim() || null,
        photo_url: photoUrl,
        is_active: true,
      });

      if (!res.ok) {
        toast.error(res.error || 'Error al guardar');
        return;
      }
      toast.success(isNew ? 'Profesional agregado' : 'Profesional actualizado');
      props.onClose();
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={props.onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            {isNew ? 'Agregar profesional' : 'Editar profesional'}
          </h3>
          <button type="button" onClick={props.onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {/* Foto */}
          <div className="flex items-center gap-3">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Foto" className="h-16 w-16 rounded-full object-cover border border-slate-200" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-slate-400" />
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {isUploading ? 'Subiendo...' : photoUrl ? 'Cambiar' : 'Subir foto'}
            </button>
          </div>

          {/* Nombre */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Titulo</label>
              <select value={title} onChange={(e) => setTitle(e.target.value)} className="team-input">
                {TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre *</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="team-input" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Apellido *</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="team-input" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Especialidad</label>
            <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="team-input">
              {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              Email
            </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="team-input" />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              Telefono
            </label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="team-input" />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
              <FileBadge className="h-3.5 w-3.5 text-slate-400" />
              Numero de colegiado
            </label>
            <input type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className="team-input" />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

        <style jsx>{`
          :global(.team-input) {
            width: 100%;
            border-radius: 0.5rem;
            border: 1px solid rgb(209 213 219);
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            background-color: white;
            outline: none;
          }
          :global(.team-input:focus) {
            border-color: rgb(59 130 246);
            box-shadow: 0 0 0 3px rgb(219 234 254);
          }
        `}</style>
      </div>
    </div>
  );
}
