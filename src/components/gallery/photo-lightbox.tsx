'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Download,
  Calendar,
  Hash,
} from 'lucide-react';
import { CATEGORY_CONFIG, type PatientPhoto } from '@/lib/types/photo';
import { deletePatientPhoto } from '@/server/actions/photos';

type Props = {
  photos: PatientPhoto[];
  currentIdx: number;
  onClose: () => void;
  onNavigate: (idx: number) => void;
};

export function PhotoLightbox({ photos, currentIdx, onClose, onNavigate }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const photo = photos[currentIdx];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && currentIdx > 0) onNavigate(currentIdx - 1);
      else if (e.key === 'ArrowRight' && currentIdx < photos.length - 1) onNavigate(currentIdx + 1);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [currentIdx, photos.length, onClose, onNavigate]);

  if (!photo) return null;

  const cfg = CATEGORY_CONFIG[photo.category];

  const handleDelete = () => {
    if (!confirm('Eliminar esta foto? La accion se puede revertir desde la BD pero no desde la interfaz.')) return;
    startTransition(async () => {
      const res = await deletePatientPhoto(photo.id, false);
      if (!res.ok) {
        toast.error(res.error || 'Error');
        return;
      }
      toast.success('Foto eliminada');
      onClose();
      router.refresh();
    });
  };

  const handleDownload = () => {
    if (!photo.storage_url) return;
    window.open(photo.storage_url, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 p-3 text-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={'inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold ' + cfg.bg + ' ' + cfg.color + ' ' + cfg.border}>
            {cfg.label}
          </span>
          <p className="text-xs text-slate-300 hidden sm:inline">
            {currentIdx + 1} de {photos.length}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-lg p-2 text-white hover:bg-white/10"
            title="Descargar"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/20"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
        {currentIdx > 0 && (
          <button
            type="button"
            onClick={() => onNavigate(currentIdx - 1)}
            className="absolute left-2 sm:left-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 backdrop-blur"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {currentIdx < photos.length - 1 && (
          <button
            type="button"
            onClick={() => onNavigate(currentIdx + 1)}
            className="absolute right-2 sm:right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 backdrop-blur"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
        {photo.storage_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.storage_url}
            alt={photo.notes || photo.file_name}
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>

      <div className="p-3 text-white text-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {photo.taken_at && (
            <span className="inline-flex items-center gap-1 text-slate-300">
              <Calendar className="h-3 w-3" />
              {formatDate(photo.taken_at)}
            </span>
          )}
          {photo.tooth_numbers && photo.tooth_numbers.length > 0 && (
            <span className="inline-flex items-center gap-1 text-slate-300">
              <Hash className="h-3 w-3" />
              Piezas: {photo.tooth_numbers.join(', ')}
            </span>
          )}
          <span className="text-slate-400">{photo.file_name}</span>
        </div>
        {photo.notes && (
          <p className="mt-1.5 text-xs text-slate-200 max-w-3xl">{photo.notes}</p>
        )}
      </div>
    </div>
  );
}

function formatDate(s: string): string {
  const d = new Date(s + (s.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' });
}
