'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface MonthData {
  name: string;
  devengado: number;
  girado: number;
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

export function EvolutionChart({ data }: { data: MonthData[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gDev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D40000" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#D40000" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gGir" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="name" stroke="#2A3A50"
          tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }}
          tickLine={false} axisLine={false} />
        <YAxis stroke="#2A3A50"
          tick={{ fill: '#64748B', fontSize: 12 }}
          tickLine={false} axisLine={false}
          tickFormatter={(v) => `S/ ${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<ChartTip />} />
        <Area type="monotone" dataKey="devengado" name="Devengado"
          stroke="#D40000" strokeWidth={3} fill="url(#gDev)" />
        <Area type="monotone" dataKey="girado" name="Girado"
          stroke="#10B981" strokeWidth={2.5} fill="url(#gGir)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
