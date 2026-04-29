'use client';

import { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Image as ImageIcon,
  Camera,
  ArrowLeftRight,
} from 'lucide-react';
import {
  CATEGORY_CONFIG,
  type PatientPhoto,
  type PhotoCategory,
} from '@/lib/types/photo';
import { PhotoUploader } from './photo-uploader';
import { PhotoLightbox } from './photo-lightbox';
import { BeforeAfterComparator } from './before-after-comparator';

type View = 'grid' | 'list' | 'compare';
type CategoryFilter = 'all' | PhotoCategory;

type Props = {
  patientId: string;
  photos: PatientPhoto[];
};

export function GalleryClient({ patientId, photos }: Props) {
  const [view, setView] = useState<View>('grid');
  const [showUploader, setShowUploader] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return photos.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (!q) return true;
      const teeth = (p.tooth_numbers || []).join(' ');
      const haystack = ((p.notes || '') + ' ' + teeth + ' ' + p.file_name).toLowerCase();
      return haystack.includes(q);
    });
  }, [photos, search, categoryFilter]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    photos.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + 1;
    });
    return map;
  }, [photos]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nota, pieza o nombre de archivo..."
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowUploader(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Subir fotos
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <CategoryChip
            active={categoryFilter === 'all'}
            onClick={() => setCategoryFilter('all')}
            label="Todas"
            count={photos.length}
          />
          {(Object.keys(CATEGORY_CONFIG) as PhotoCategory[]).map((cat) => {
            const cnt = categoryCounts[cat] || 0;
            if (cnt === 0) return null;
            const cfg = CATEGORY_CONFIG[cat];
            return (
              <CategoryChip
                key={cat}
                active={categoryFilter === cat}
                onClick={() => setCategoryFilter(cat)}
                label={cfg.label}
                count={cnt}
                bg={cfg.bg}
                color={cfg.color}
                border={cfg.border}
              />
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <ViewTab active={view === 'grid'} onClick={() => setView('grid')} icon={<LayoutGrid className="h-3.5 w-3.5" />} label="Grid" />
            <ViewTab active={view === 'list'} onClick={() => setView('list')} icon={<List className="h-3.5 w-3.5" />} label="Lista" />
            <ViewTab active={view === 'compare'} onClick={() => setView('compare')} icon={<ArrowLeftRight className="h-3.5 w-3.5" />} label="Comparar" />
          </div>
          <p className="text-xs text-slate-500">
            {filtered.length} de {photos.length} fotos
          </p>
        </div>
      </div>

      {photos.length === 0 ? (
        <EmptyState onUpload={() => setShowUploader(true)} />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-900">Sin coincidencias</p>
          <p className="mt-1 text-xs text-slate-500">Prueba cambiando los filtros</p>
        </div>
      ) : (
        <>
          {view === 'grid' && (
            <GridView photos={filtered} onSelect={(idx) => setSelectedPhotoIdx(idx)} />
          )}
          {view === 'list' && (
            <ListView photos={filtered} onSelect={(idx) => setSelectedPhotoIdx(idx)} />
          )}
          {view === 'compare' && (
            <BeforeAfterComparator photos={photos} />
          )}
        </>
      )}

      {showUploader && (
        <PhotoUploader
          patientId={patientId}
          onClose={() => setShowUploader(false)}
        />
      )}

      {selectedPhotoIdx !== null && filtered[selectedPhotoIdx] && (
        <PhotoLightbox
          photos={filtered}
          currentIdx={selectedPhotoIdx}
          onClose={() => setSelectedPhotoIdx(null)}
          onNavigate={(idx) => setSelectedPhotoIdx(idx)}
        />
      )}
    </div>
  );
}

function GridView({ photos, onSelect }: { photos: PatientPhoto[]; onSelect: (idx: number) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {photos.map((p, idx) => {
        const cfg = CATEGORY_CONFIG[p.category];
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(idx)}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 hover:shadow-lg transition"
          >
            {p.storage_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.storage_url}
                alt={p.notes || p.file_name}
                className="h-full w-full object-cover transition group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-100">
                <ImageIcon className="h-8 w-8 text-slate-300" />
              </div>
            )}

            <span className={'absolute top-1.5 left-1.5 inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-bold ' + cfg.bg + ' ' + cfg.color + ' ' + cfg.border}>
              {cfg.emoji}
            </span>

            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white">
              {p.tooth_numbers && p.tooth_numbers.length > 0 && (
                <p className="text-[10px] font-bold">Pieza: {p.tooth_numbers.join(', ')}</p>
              )}
              <p className="text-[10px]">{p.taken_at ? formatShortDate(p.taken_at) : '-'}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ListView({ photos, onSelect }: { photos: PatientPhoto[]; onSelect: (idx: number) => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr className="text-xs font-bold uppercase text-slate-600">
            <th className="px-3 py-2 text-left w-20">Foto</th>
            <th className="px-3 py-2 text-left">Categoria / Notas</th>
            <th className="px-3 py-2 text-left hidden sm:table-cell">Piezas</th>
            <th className="px-3 py-2 text-left hidden md:table-cell">Fecha</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {photos.map((p, idx) => {
            const cfg = CATEGORY_CONFIG[p.category];
            return (
              <tr
                key={p.id}
                onClick={() => onSelect(idx)}
                className="hover:bg-slate-50 cursor-pointer"
              >
                <td className="px-3 py-2">
                  {p.storage_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.storage_url} alt="" className="h-12 w-12 rounded-lg object-cover" loading="lazy" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-slate-300" />
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <span className={'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ' + cfg.bg + ' ' + cfg.color + ' ' + cfg.border}>
                    {cfg.label}
                  </span>
                  {p.notes && <p className="text-xs text-slate-700 mt-1 line-clamp-2">{p.notes}</p>}
                </td>
                <td className="px-3 py-2 text-xs text-slate-600 hidden sm:table-cell">
                  {p.tooth_numbers && p.tooth_numbers.length > 0 ? p.tooth_numbers.join(', ') : '-'}
                </td>
                <td className="px-3 py-2 text-xs text-slate-600 hidden md:table-cell">
                  {p.taken_at ? formatShortDate(p.taken_at) : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
      <Camera className="mx-auto h-12 w-12 text-slate-300" />
      <p className="mt-3 text-base font-bold text-slate-900">Sin fotos clinicas</p>
      <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
        Sube radiografias, fotos intraorales, antes y despues de tratamientos para llevar un registro visual del paciente.
      </p>
      <button
        type="button"
        onClick={onUpload}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 shadow-sm"
      >
        <Plus className="h-4 w-4" />
        Subir primera foto
      </button>
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
  count,
  bg,
  color,
  border,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  bg?: string;
  color?: string;
  border?: string;
}) {
  const activeCls = bg
    ? bg + ' ' + color + ' ' + border + ' ring-2 ring-offset-1 ring-emerald-400'
    : 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-offset-1 ring-emerald-400';
  const inactiveCls = 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50';
  return (
    <button
      type="button"
      onClick={onClick}
      className={'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition ' + (active ? activeCls : inactiveCls)}
    >
      {label}
      <span className="opacity-70 tabular-nums">{count}</span>
    </button>
  );
}

function ViewTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ' + (active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')}
    >
      {icon}
      {label}
    </button>
  );
}

function formatShortDate(s: string): string {
  const d = new Date(s + (s.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: '2-digit' });
}
