'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface ServiceItem { service_id: string; description: string; quantity: number; unit_price: number; total: number }

export default function NewQuotationPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [patientId, setPatientId] = useState('');
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    supabase.from('patients').select('id, first_name, last_name').eq('is_active', true).then(({ data }) => setPatients(data || []));
    supabase.from('services').select('id, name, price, duration_minutes').eq('is_active', true).then(({ data }) => setServices(data || []));
  }, []);

  const addItem = (serviceId: string) => {
    const svc = services.find(s => s.id === serviceId);
    if (!svc) return;
    setItems([...items, { service_id: svc.id, description: svc.name, quantity: 1, unit_price: Number(svc.price) || 0, total: Number(svc.price) || 0 }]);
  };

  const updateItem = (index: number, field: string, value: number) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    updated[index].total = updated[index].quantity * updated[index].unit_price;
    setItems(updated);
  };

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  const handleSubmit = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/quotations', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId || null, items, discount_percent: discount, discount_amount: discountAmount, subtotal, total, notes })
      });
      if (res.ok) { router.push('/dental/quotations'); router.refresh(); }
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/dental/quotations" className="text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></Link>
        <h2 className="text-xl font-bold text-slate-800">Nueva cotizacion</h2>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        {/* Patient */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Paciente (opcional)</label>
          <select value={patientId} onChange={e => setPatientId(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none bg-white">
            <option value="">Sin paciente</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
          </select>
        </div>

        {/* Add service */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Agregar servicio</label>
          <select onChange={e => { addItem(e.target.value); e.target.value = ''; }} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none bg-white">
            <option value="">Seleccionar servicio...</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name} - Q{Number(s.price || 0).toFixed(2)}</option>)}
          </select>
        </div>

        {/* Items table */}
        {items.length > 0 && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr><th className="text-left px-3 py-2 text-slate-500 font-medium">Servicio</th><th className="w-20 px-2 py-2 text-slate-500 font-medium">Cant.</th><th className="w-28 px-2 py-2 text-slate-500 font-medium">Precio</th><th className="w-28 px-2 py-2 text-slate-500 font-medium">Total</th><th className="w-10"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-slate-700">{item.description}</td>
                    <td className="px-2 py-2"><input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} className="w-full px-2 py-1 border border-slate-200 rounded text-center text-sm" /></td>
                    <td className="px-2 py-2"><input type="number" step="0.01" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 border border-slate-200 rounded text-sm" /></td>
                    <td className="px-2 py-2 font-medium text-slate-700">Q{item.total.toFixed(2)}</td>
                    <td className="px-2 py-2"><button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        {items.length > 0 && (
          <div className="flex flex-col items-end gap-1 text-sm">
            <div className="flex gap-8"><span className="text-slate-500">Subtotal:</span><span className="font-medium w-28 text-right">Q{subtotal.toFixed(2)}</span></div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Descuento:</span>
              <input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-16 px-2 py-1 border border-slate-200 rounded text-sm text-center" />
              <span className="text-slate-500">%</span>
              <span className="font-medium w-28 text-right text-red-600">-Q{discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex gap-8 text-base border-t border-slate-200 pt-2 mt-1"><span className="font-semibold text-slate-700">Total:</span><span className="font-bold w-28 text-right text-slate-800">Q{total.toFixed(2)}</span></div>
          </div>
        )}

        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none resize-none" placeholder="Observaciones..." />
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/dental/quotations" className="flex-1 py-2.5 text-center bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">Cancelar</Link>
          <button onClick={handleSubmit} disabled={loading || items.length === 0} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? 'Guardando...' : 'Guardar cotizacion'}</button>
        </div>
      </div>
    </div>
  );
}
