'use client';

import { useState, useTransition, useRef } from 'react';
import { toast } from 'sonner';
import { Image as ImageIcon, Palette, Save, Upload, Trash2 } from 'lucide-react';
import { updateBrandingSettings, uploadSettingsImage } from '@/server/actions/settings';

type Tenant = {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
};

export function TabBranding(props: { tenant: Tenant }) {
  const { tenant } = props;
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [logoUrl, setLogoUrl] = useState<string | null>(tenant.logo_url);
  const [primaryColor, setPrimaryColor] = useState(tenant.primary_color || '#2563eb');
  const [secondaryColor, setSecondaryColor] = useState(tenant.secondary_color || '#1e40af');

  const handleLogoUpload = async (file: File) => {
    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadSettingsImage(fd, 'logo');
    setIsUploading(false);

    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setLogoUrl(res.url);
    toast.success('Logo subido. Recuerda guardar los cambios.');
  };

  const handleSave = () => {
    if (!/^#[0-9a-fA-F]{6}$/.test(primaryColor)) {
      toast.error('Color principal invalido (formato #RRGGBB)');
      return;
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(secondaryColor)) {
      toast.error('Color secundario invalido (formato #RRGGBB)');
      return;
    }

    startTransition(async () => {
      const res = await updateBrandingSettings({
        logo_url: logoUrl,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
      });

      if (!res.ok) {
        toast.error(res.error || 'Error al guardar');
        return;
      }
      toast.success('Branding actualizado');
    });
  };

  return (
    <div className="space-y-4">
      {/* Card 1: Logo */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-slate-700" />
            Logo
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Aparece en recetas, recibos y cabeceras</p>
        </div>

        <div className="flex items-center gap-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Logo"
              className="h-24 w-24 rounded-lg object-cover border border-slate-200"
            />
          ) : (
            <div className="h-24 w-24 rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-slate-400" />
            </div>
          )}

          <div className="flex flex-col gap-2">
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
              {isUploading ? 'Subiendo...' : logoUrl ? 'Cambiar logo' : 'Subir logo'}
            </button>

            {logoUrl ? (
              <button
                type="button"
                onClick={() => setLogoUrl(null)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Quitar logo
              </button>
            ) : null}

            <p className="text-[11px] text-slate-400">JPG, PNG o WEBP. Maximo 5MB.</p>
          </div>
        </div>
      </div>

      {/* Card 2: Colores */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Palette className="h-5 w-5 text-slate-700" />
            Colores de marca
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Aparecen en botones, enlaces y badges</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Color principal</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-14 rounded cursor-pointer border border-slate-300"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#2563eb"
                className="sett-input flex-1 font-mono text-xs"
                maxLength={7}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Color secundario</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-10 w-14 rounded cursor-pointer border border-slate-300"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                placeholder="#1e40af"
                className="sett-input flex-1 font-mono text-xs"
                maxLength={7}
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Vista previa</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              Boton principal
            </button>
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm"
              style={{ backgroundColor: secondaryColor }}
            >
              Boton secundario
            </button>
            <span
              className="rounded-full px-3 py-1 text-xs font-bold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Badge
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
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
