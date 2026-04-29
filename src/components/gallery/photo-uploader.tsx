'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  X,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { uploadPatientPhoto } from '@/server/actions/photos';
import {
  CATEGORY_OPTIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  type PhotoCategory,
} from '@/lib/types/photo';

type FileItem = {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
};

type Props = {
  patientId: string;
  onClose: () => void;
};

export function PhotoUploader({ patientId, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<FileItem[]>([]);
  const [category, setCategory] = useState<PhotoCategory>('general');
  const [toothNumbers, setToothNumbers] = useState('');
  const [takenAt, setTakenAt] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const addFiles = (newFiles: FileList | File[]) => {
    const items: FileItem[] = [];
    Array.from(newFiles).forEach((f) => {
      if (!ALLOWED_MIME_TYPES.includes(f.type)) {
        toast.error(f.name + ': formato no soportado');
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(f.name + ': mayor a 10MB');
        return;
      }
      items.push({
        id: Math.random().toString(36).slice(2),
        file: f,
        preview: URL.createObjectURL(f),
        status: 'pending',
      });
    });
    setFiles((prev) => [...prev, ...items]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleSelectFiles = () => {
    inputRef.current?.click();
  };

  const handleUpload = () => {
    if (files.length === 0) {
      toast.error('Selecciona al menos una foto');
      return;
    }

    const teethArr = toothNumbers
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    startTransition(async () => {
      let successCount = 0;
      let errorCount = 0;

      for (const item of files) {
        if (item.status === 'done') continue;
        setFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading' as const } : f))
        );

        const fd = new FormData();
        fd.append('file', item.file);
        fd.append(
          'metadata',
          JSON.stringify({
            patient_id: patientId,
            category,
            tooth_numbers: teethArr.length > 0 ? teethArr : null,
            taken_at: takenAt || null,
            notes: notes || null,
          })
        );

        const res = await uploadPatientPhoto(fd);

        if (res.ok) {
          successCount++;
          setFiles((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, status: 'done' as const } : f))
          );
        } else {
          errorCount++;
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id ? { ...f, status: 'error' as const, error: res.error } : f
            )
          );
        }
      }

      if (successCount > 0) {
        toast.success(successCount + ' foto' + (successCount > 1 ? 's' : '') + ' subida' + (successCount > 1 ? 's' : ''));
      }
      if (errorCount > 0) {
        toast.error(errorCount + ' foto' + (errorCount > 1 ? 's' : '') + ' con error');
      }

      if (errorCount === 0 && successCount > 0) {
        files.forEach((f) => URL.revokeObjectURL(f.preview));
        onClose();
        router.refresh();
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-emerald-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Subir fotos clinicas</h3>
            <p className="text-xs text-slate-600">Arrastra archivos o selecciona desde tu dispositivo</p>
          </div>
          <button onClick={onClose} disabled={isPending} className="rounded-lg p-2 text-slate-400 hover:bg-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleSelectFiles}
            className={
              'rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition ' +
              (dragActive
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100')
            }
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              multiple
              onChange={(e) => e.target.files && addFiles(e.target.files)}
              className="hidden"
            />
            <Upload className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-bold text-slate-700">
              {dragActive ? 'Suelta los archivos aqui' : 'Click o arrastra para seleccionar'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              JPG, PNG, WEBP, HEIC. Maximo 10 MB cada uno.
            </p>
          </div>

          {files.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-700">
                {files.length} foto{files.length === 1 ? '' : 's'} seleccionada{files.length === 1 ? '' : 's'}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {files.map((item) => (
                  <div key={item.id} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.preview}
                      alt=""
                      className="aspect-square w-full rounded-lg object-cover border border-slate-200"
                    />
                    {item.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => removeFile(item.id)}
                        className="absolute -top-1 -right-1 rounded-full bg-rose-600 p-1 text-white opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                    {item.status === 'uploading' && (
                      <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center">
                        <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      </div>
                    )}
                    {item.status === 'done' && (
                      <div className="absolute inset-0 rounded-lg bg-emerald-500/40 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                    )}
                    {item.status === 'error' && (
                      <div
                        className="absolute inset-0 rounded-lg bg-rose-500/40 flex items-center justify-center"
                        title={item.error}
                      >
                        <AlertCircle className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Categoria *">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PhotoCategory)}
                className="form-input"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fecha de la foto">
              <input
                type="date"
                value={takenAt}
                onChange={(e) => setTakenAt(e.target.value)}
                className="form-input"
              />
            </Field>
          </div>

          <Field label="Piezas dentales (separadas por coma)">
            <input
              type="text"
              value={toothNumbers}
              onChange={(e) => setToothNumbers(e.target.value)}
              placeholder="Ej: 36, 37 o solo 11"
              className="form-input"
            />
          </Field>

          <Field label="Notas clinicas (opcional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Caries profunda cara mesial, pre-tratamiento de endodoncia..."
              className="form-input"
            />
          </Field>

          <p className="text-[11px] text-slate-500 italic">
            Todas las fotos se aplicaran con la misma categoria, fecha, piezas y notas. Si necesitas
            valores distintos por foto, sube en grupos separados.
          </p>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={isPending || files.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
          >
            <Upload className="h-4 w-4" />
            {isPending ? 'Subiendo...' : 'Subir ' + (files.length > 0 ? files.length + ' foto' + (files.length === 1 ? '' : 's') : 'fotos')}
          </button>
        </div>

        <style jsx>{`
          :global(.form-input) {
            width: 100%;
            border-radius: 0.5rem;
            border: 1px solid rgb(203 213 225);
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            background-color: white;
            outline: none;
          }
          :global(.form-input:focus) {
            border-color: rgb(16 185 129);
            box-shadow: 0 0 0 4px rgb(209 250 229);
          }
        `}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
