'use client';

import { useState, useMemo } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { CATEGORY_CONFIG, type PatientPhoto } from '@/lib/types/photo';

type Props = {
  photos: PatientPhoto[];
};

export function BeforeAfterComparator({ photos }: Props) {
  const initialBefore = photos.find((p) => p.category === 'before')?.id || photos[0]?.id || '';
  const initialAfter = photos.find((p) => p.category === 'after')?.id || photos[1]?.id || '';

  const [beforeId, setBeforeId] = useState(initialBefore);
  const [afterId, setAfterId] = useState(initialAfter);
  const [sliderPos, setSliderPos] = useState(50);

  const beforePhoto = useMemo(() => photos.find((p) => p.id === beforeId), [photos, beforeId]);
  const afterPhoto = useMemo(() => photos.find((p) => p.id === afterId), [photos, afterId]);

  if (photos.length < 2) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
        <ArrowLeftRight className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-bold text-slate-900">Necesitas al menos 2 fotos</p>
        <p className="mt-1 text-xs text-slate-500">Sube fotos antes y despues del tratamiento para comparar</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PhotoSelect label="Antes" photos={photos} value={beforeId} onChange={setBeforeId} />
          <PhotoSelect label="Despues" photos={photos} value={afterId} onChange={setAfterId} />
        </div>
      </div>

      {beforePhoto && afterPhoto && beforePhoto.storage_url && afterPhoto.storage_url && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="relative aspect-video bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={afterPhoto.storage_url}
              alt="Despues"
              className="absolute inset-0 w-full h-full object-contain"
            />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: 'inset(0 ' + (100 - sliderPos) + '% 0 0)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={beforePhoto.storage_url}
                alt="Antes"
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none shadow-lg"
              style={{ left: sliderPos + '%' }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                <ArrowLeftRight className="h-4 w-4 text-slate-700" />
              </div>
            </div>
            <span className="absolute top-3 left-3 rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white">
              ANTES
            </span>
            <span className="absolute top-3 right-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
              DESPUES
            </span>
          </div>

          <div className="px-4 py-3 border-t border-slate-100">
            <input
              type="range"
              min={0}
              max={100}
              value={sliderPos}
              onChange={(e) => setSliderPos(parseInt(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <p className="text-[11px] text-slate-500 text-center mt-1">
              Arrastra el control para comparar
            </p>
          </div>
        </div>
      )}

      {beforePhoto && afterPhoto && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PhotoInfoCard photo={beforePhoto} label="Antes" color="rose" />
          <PhotoInfoCard photo={afterPhoto} label="Despues" color="emerald" />
        </div>
      )}
    </div>
  );
}

function PhotoSelect({
  label,
  photos,
  value,
  onChange,
}: {
  label: string;
  photos: PatientPhoto[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      >
        {photos.map((p) => {
          const cfg = CATEGORY_CONFIG[p.category];
          const teeth = p.tooth_numbers && p.tooth_numbers.length > 0 ? ' #' + p.tooth_numbers.join(',') : '';
          const date = p.taken_at ? ' - ' + p.taken_at : '';
          return (
            <option key={p.id} value={p.id}>
              [{cfg.label}]{teeth}{date}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function PhotoInfoCard({
  photo,
  label,
  color,
}: {
  photo: PatientPhoto;
  label: string;
  color: 'rose' | 'emerald';
}) {
  const cls = color === 'rose' ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50';
  const labelCls = color === 'rose' ? 'text-rose-700' : 'text-emerald-700';
  return (
    <div className={'rounded-xl border p-3 ' + cls}>
      <p className={'text-[10px] font-bold uppercase ' + labelCls}>{label}</p>
      <p className="text-sm font-semibold text-slate-900 mt-0.5">
        {photo.taken_at
          ? new Date(photo.taken_at + 'T00:00:00').toLocaleDateString('es-GT', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })
          : 'Sin fecha'}
      </p>
      {photo.tooth_numbers && photo.tooth_numbers.length > 0 && (
        <p className="text-xs text-slate-600 mt-0.5">Piezas: {photo.tooth_numbers.join(', ')}</p>
      )}
      {photo.notes && (
        <p className="text-xs text-slate-700 mt-1 line-clamp-2">{photo.notes}</p>
      )}
    </div>
  );
}
