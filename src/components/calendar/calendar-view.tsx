'use client';
import { useState } from 'react';
import Link from 'next/link';

interface Props { appointments: any[] }

export function CalendarView({ appointments }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const getAppts = (day: number) => {
    const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    return appointments.filter(a => a.appointment_date === dateStr);
  };

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const dayNames = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'];

  const statusDot: Record<string, string> = { scheduled: 'bg-blue-500', confirmed: 'bg-emerald-500', in_progress: 'bg-purple-500', completed: 'bg-slate-400' };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={prev} className="p-2 hover:bg-slate-100 rounded-lg"><svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></button>
          <h3 className="text-lg font-bold text-slate-800">{monthNames[month]} {year}</h3>
          <button onClick={next} className="p-2 hover:bg-slate-100 rounded-lg"><svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></button>
        </div>
        <Link href="/appointments/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">+ Nueva cita</Link>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Day names */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {dayNames.map(d => <div key={d} className="py-2.5 text-center text-xs font-medium text-slate-400 uppercase">{d}</div>)}
        </div>
        {/* Days */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            if (day === null) return <div key={'e'+i} className="min-h-[80px] lg:min-h-[100px] border-b border-r border-slate-50" />;
            const appts = getAppts(day);
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            return (
              <div key={day} className={"min-h-[80px] lg:min-h-[100px] border-b border-r border-slate-50 p-1.5 " + (isToday ? "bg-blue-50/50" : "hover:bg-slate-50/50")}>
                <p className={"text-xs font-medium mb-1 " + (isToday ? "text-blue-600 font-bold" : "text-slate-500")}>{day}</p>
                <div className="space-y-0.5">
                  {appts.slice(0, 3).map((a: any) => (
                    <Link key={a.id} href={'/appointments/' + a.id}
                      className="block px-1.5 py-0.5 rounded text-xs truncate hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: ((a.professionals as any)?.color || '#3b82f6') + '20', color: (a.professionals as any)?.color || '#3b82f6' }}>
                      <span className="font-medium">{a.start_time?.slice(0,5)}</span>
                      <span className="hidden lg:inline"> {(a.patients as any)?.first_name}</span>
                    </Link>
                  ))}
                  {appts.length > 3 && <p className="text-xs text-slate-400 px-1">+{appts.length - 3} mas</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
