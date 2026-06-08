'use client';

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface StageData {
  name: string;
  value: number;
  color: string;
}

interface TPItem {
  color: string;
  name: string;
  value: number;
}

const fmt = (val: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency', currency: 'PEN',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(val || 0);

function ChartTip({ active, payload, label }: { active?: boolean; payload?: TPItem[]; label?: string; }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0A1F35] px-4 py-3 shadow-2xl">
      <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      {payload.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-sm mb-1">
          <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
          <span className="text-slate-300 font-medium">{item.name}:</span>
          <span className="text-white font-bold tabular-nums">{fmt(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function WaterfallChart({ data }: { data: StageData[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="name" stroke="#2A3A50"
          tick={{ fill: '#64748B', fontSize: 13, fontWeight: 700 }}
          tickLine={false} axisLine={false} />
        <YAxis stroke="#2A3A50"
          tick={{ fill: '#64748B', fontSize: 12 }}
          tickLine={false} axisLine={false}
          tickFormatter={(v) => `S/ ${(v / 1_000_000).toFixed(1)}M`} />
        <Tooltip content={<ChartTip />} />
        <Bar dataKey="value" name="Monto" radius={[5, 5, 0, 0]} maxBarSize={72}>
          {data.map((s, i) => (
            <Cell key={i} fill={s.color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
