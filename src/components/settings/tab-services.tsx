'use client';

import { useState, useTransition, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Briefcase,
  Plus,
  Edit2,
  X,
  Save,
  Power,
  PowerOff,
  Search,
  Clock,
  Tag,
} from 'lucide-react';
import { saveService, toggleServiceActive, quickUpdateServicePrice } from '@/server/actions/services';

type Service = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  currency: string;
  duration_minutes: number;
  buffer_minutes: number | null;
  color: string | null;
  is_active: boolean;
  requires_confirmation: boolean;
};

const COMMON_CATEGORIES = [
  'Diagnostico',
  'Preventivo',
  'Restaurador',
  'Endodoncia',
  'Cirugia',
  'Estetica',
  'Protesis',
  'Periodoncia',
  'Ortodoncia',
  'Otros',
];

export function TabServices(props: { services: Service[] }) {
  const [editing, setEditing] = useState<Service | 'new' | null>(null);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('active');

  const filtered = useMemo(() => {
    return props.services.filter((s) => {
      if (filterActive === 'active' && !s.is_active) return false;
      if (filterActive === 'inactive' && s.is_active) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || (s.category || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [props.services, search, filterActive]);

  const grouped = useMemo(() => {
    const map: Record<string, Service[]> = {};
    filtered.forEach((s) => {
      const cat = s.category || 'Sin categoria';
      if (!map[cat]) map[cat] = [];
      map[cat].push(s);
    });
    return map;
  }, [filtered]);

  const totalActive = props.services.filter((s) => s.is_active).length;
  const totalInactive = props.services.filter((s) => !s.is_active).length;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-slate-700" />
              Catalogo de servicios
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {totalActive} activo{totalActive === 1 ? '' : 's'} | {totalInactive} inactivo{totalInactive === 1 ? '' : 's'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setEditing('new')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nuevo servicio
          </button>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar servicio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
            <option value="active">Solo activos</option>
            <option value="inactive">Solo inactivos</option>
            <option value="all">Todos</option>
          </select>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            {props.services.length === 0
              ? 'No hay servicios. Agrega el primero.'
              : 'Ningun servicio coincide con el filtro.'}
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-[11px] font-bold uppercase text-slate-500 mb-2 flex items-center gap-1.5">
                  <Tag className="h-3 w-3" />
                  {category} ({items.length})
                </h3>
                <div className="space-y-1.5">
                  {items.map((s) => (
                    <ServiceRow key={s.id} service={s} onEdit={() => setEditing(s)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing ? (
        <ServiceEditModal
          service={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

function ServiceRow(props: { service: Service; onEdit: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceValue, setPriceValue] = useState(props.service.price);
  const s = props.service;

  const handleToggle = () => {
    startTransition(async () => {
      const res = await toggleServiceActive(s.id, !s.is_active);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(s.is_active ? 'Servicio desactivado' : 'Servicio activado');
    });
  };

  const handleSavePrice = () => {
    if (priceValue === s.price) {
      setEditingPrice(false);
      return;
    }
    startTransition(async () => {
      const res = await quickUpdateServicePrice(s.id, priceValue);
      if (!res.ok) {
        toast.error(res.error);
        setPriceValue(s.price);
        return;
      }
      toast.success('Precio actualizado');
      setEditingPrice(false);
    });
  };

  return (
    <div className={'rounded-lg border p-3 flex items-center gap-3 ' + (s.is_active ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60')}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 truncate">{s.name}</p>
        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
          <Clock className="h-3 w-3" />
          {s.duration_minutes} min
          {s.buffer_minutes && s.buffer_minutes > 0 ? ' (+' + s.buffer_minutes + ' min buffer)' : ''}
          {s.requires_confirmation ? ' | Requiere confirmacion' : ''}
        </p>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <span className="text-xs text-slate-500">{s.currency}</span>
        {editingPrice ? (
          <input
            type="number"
            step="0.01"
            min="0"
            value={priceValue}
            onChange={(e) => setPriceValue(parseFloat(e.target.value) || 0)}
            onBlur={handleSavePrice}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSavePrice();
              if (e.key === 'Escape') {
                setPriceValue(s.price);
                setEditingPrice(false);
              }
            }}
            autoFocus
            disabled={isPending}
            className="w-24 rounded border border-blue-400 px-2 py-0.5 text-sm font-bold text-right tabular-nums"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingPrice(true)}
            disabled={!s.is_active}
            className="text-sm font-bold tabular-nums text-slate-900 hover:underline disabled:hover:no-underline"
            title="Click para editar precio"
          >
            {s.price.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </button>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-1">
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
          className={'rounded-lg p-2 ' + (s.is_active ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50')}
          title={s.is_active ? 'Desactivar' : 'Activar'}
        >
          {s.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function ServiceEditModal(props: { service: Service | null; onClose: () => void }) {
  const isNew = !props.service;
  const s = props.service;

  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(s?.name || '');
  const [description, setDescription] = useState(s?.description || '');
  const [category, setCategory] = useState(s?.category || 'Diagnostico');
  const [price, setPrice] = useState(s?.price || 0);
  const [duration, setDuration] = useState(s?.duration_minutes || 30);
  const [buffer, setBuffer] = useState(s?.buffer_minutes || 0);
  const [requiresConfirmation, setRequiresConfirmation] = useState(s?.requires_confirmation || false);

  const handleSave = () => {
    if (name.trim().length < 2) {
      toast.error('El nombre debe tener al menos 2 caracteres');
      return;
    }
    if (price < 0) {
      toast.error('El precio no puede ser negativo');
      return;
    }
    if (duration < 1) {
      toast.error('La duracion debe ser positiva');
      return;
    }

    startTransition(async () => {
      const res = await saveService({
        id: s?.id || null,
        name: name.trim(),
        description: description.trim() || null,
        category,
        price,
        duration_minutes: duration,
        buffer_minutes: buffer,
        requires_confirmation: requiresConfirmation,
        is_active: s?.is_active ?? true,
      });

      if (!res.ok) {
        toast.error(res.error || 'Error al guardar');
        return;
      }
      toast.success(isNew ? 'Servicio agregado' : 'Servicio actualizado');
      props.onClose();
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={props.onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            {isNew ? 'Nuevo servicio' : 'Editar servicio'}
          </h3>
          <button type="button" onClick={props.onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del servicio *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Limpieza dental profunda"
              className="svc-input"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="svc-input">
              {COMMON_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Descripcion (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles del servicio que ven los pacientes"
              rows={2}
              maxLength={500}
              className="svc-input resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Precio (GTQ) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="svc-input"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Duracion (min) *</label>
              <input
                type="number"
                min="5"
                step="5"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                className="svc-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tiempo de buffer entre citas (minutos)
            </label>
            <input
              type="number"
              min="0"
              max="120"
              value={buffer}
              onChange={(e) => setBuffer(parseInt(e.target.value) || 0)}
              className="svc-input"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Tiempo extra despues de la cita para limpieza/preparacion (default 0)
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresConfirmation}
                onChange={(e) => setRequiresConfirmation(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">
                Requiere confirmacion manual del recepcionista
              </span>
            </label>
            <p className="text-[11px] text-slate-500 mt-1 ml-6">
              Util para servicios costosos o complejos que no se aceptan automaticamente
            </p>
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
          :global(.svc-input) {
            width: 100%;
            border-radius: 0.5rem;
            border: 1px solid rgb(209 213 219);
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            background-color: white;
            outline: none;
          }
          :global(.svc-input:focus) {
            border-color: rgb(59 130 246);
            box-shadow: 0 0 0 3px rgb(219 234 254);
          }
        `}</style>
      </div>
    </div>
  );
}
