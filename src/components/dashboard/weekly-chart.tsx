'use client';

interface DayData { name: string; total: number; completed: number; cancelled: number; isToday: boolean }
interface Props { data: DayData[]; maxVal: number }

export function WeeklyChart({ data, maxVal }: Props) {
  return (
    <div className="flex items-end gap-2 h-36">
      {data.map((day) => {
        const height = maxVal > 0 ? (day.total / maxVal) * 100 : 0;
        const completedH = maxVal > 0 ? (day.completed / maxVal) * 100 : 0;
        const cancelledH = maxVal > 0 ? (day.cancelled / maxVal) * 100 : 0;
        const scheduledH = height - completedH - cancelledH;
        return (
          <div key={day.name} className="flex-1 flex flex-col items-center gap-1">
            {/* Count */}
            <span className={"text-xs font-medium " + (day.isToday ? "text-blue-600" : "text-slate-400")}>{day.total > 0 ? day.total : ''}</span>
            {/* Bar */}
            <div className={"w-full rounded-t-md overflow-hidden flex flex-col justify-end " + (day.isToday ? "bg-blue-50" : "bg-slate-50")} style={{ height: '100px' }}>
              {day.total > 0 && (
                <div className="w-full flex flex-col justify-end" style={{ height: height + '%' }}>
                  {cancelledH > 0 && <div className="w-full bg-red-300 rounded-t-sm" style={{ height: (cancelledH / height * 100) + '%', minHeight: '3px' }} />}
                  {scheduledH > 0 && <div className={"w-full " + (day.isToday ? "bg-blue-400" : "bg-blue-300")} style={{ height: (scheduledH / height * 100) + '%', minHeight: '3px' }} />}
                  {completedH > 0 && <div className="w-full bg-emerald-400" style={{ height: (completedH / height * 100) + '%', minHeight: '3px' }} />}
                </div>
              )}
            </div>
            {/* Day name */}
            <span className={"text-xs font-medium " + (day.isToday ? "text-blue-600" : "text-slate-400")}>{day.name}</span>
          </div>
        );
      })}
    </div>
  );
}
