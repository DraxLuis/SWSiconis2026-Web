'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  CheckCircle,
  Percent,
  ArrowUpRight,
  CreditCard,
  RefreshCw,
  SlidersHorizontal,
  Building2,
  ChevronDown,
  Activity,
  TrendingDown,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

interface CardData {
  total_pia: number;
  total_pim: number;
  total_certif: number;
  total_comprometido: number;
  total_devengado: number;
  total_girado: number;
}

interface MonthData { name: string; devengado: number; girado: number; }
interface RubroOption { codigo: string; nombre: string; }

const fmt = (val: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency', currency: 'PEN',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(val || 0);

const fmtM = (val: number) => {
  if (val >= 1_000_000) return `S/ ${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000)     return `S/ ${(val / 1_000).toFixed(1)}K`;
  return `S/ ${(val || 0).toFixed(0)}`;
};

// ── Custom Tooltip ─────────────────────────────────────
interface TPItem { color: string; name: string; value: number; }
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

// ── KPI Card ───────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, color, glow, loading, delay = 0,
}: {
  label: string; value: number; sub?: string;
  icon: React.ElementType; color: string; glow?: string;
  loading?: boolean; delay?: number;
}) {
  return (
    <div
      className="kpi-card animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="kpi-accent-bar" style={{ background: color }} />

      <div className="flex items-start justify-between mb-5">
        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-8 w-3/4 rounded-lg" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
      ) : (
        <>
          <p className="text-sm font-bold uppercase tracking-widest mb-2"
            style={{ color: 'rgba(148,163,184,0.7)' }}>
            {label}
          </p>
          <h3 className="text-4xl font-black leading-none tabular-nums mb-2"
            style={{ color: glow || '#F0F4FF' }}>
            {fmtM(value)}
          </h3>
          <p className="text-base text-slate-400 font-semibold tabular-nums">
            {fmt(value)}
          </p>
          {sub && (
            <p className="text-sm font-bold mt-3" style={{ color }}>
              {sub}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterRubro, setFilterRubro] = useState('');
  const [filterClasificador, setFilterClasificador] = useState('');
  const [rubros, setRubros] = useState<RubroOption[]>([]);
  const [cards, setCards] = useState<CardData>({
    total_pia: 0, total_pim: 0, total_certif: 0,
    total_comprometido: 0, total_devengado: 0, total_girado: 0,
  });
  const [months, setMonths] = useState<MonthData[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRubro) params.append('rubro', filterRubro);
      if (filterClasificador) params.append('clasificador', filterClasificador);
      const url = `/api/dashboard${params.toString() ? `?${params}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCards(data.cards);
        setMonths(data.months || []);
        setRubros(prev => prev.length === 0 && data.rubros ? data.rubros : prev);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filterRubro, filterClasificador]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pct = cards.total_pim > 0
    ? (cards.total_devengado / cards.total_pim) * 100 : 0;

  const C = 2 * Math.PI * 42;
  const dashOffset = C - (C * Math.min(pct, 100)) / 100;

  const stages = [
    { name: 'PIA',       value: cards.total_pia,          color: '#4A6080' },
    { name: 'PIM',       value: cards.total_pim,          color: '#1565C0' },
    { name: 'Certif.',   value: cards.total_certif,       color: '#7C3AED' },
    { name: 'Comprom.',  value: cards.total_comprometido, color: '#F59E0B' },
    { name: 'Deveng.',   value: cards.total_devengado,    color: '#D40000' },
    { name: 'Girado',    value: cards.total_girado,       color: '#10B981' },
  ];

  return (
    <div className="space-y-8">

      {/* ── HEADER ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-white/[0.05]">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-5 w-5 text-[#D40000]" />
            <span className="text-base font-bold uppercase tracking-widest text-[#D40000]">
              Unidad Ejecutora 301548
            </span>
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">
            Municipalidad Provincial<br className="hidden sm:block" /> de Huancabamba
          </h1>
          <p className="text-lg text-slate-400 mt-2 font-medium">
            Seguimiento de Ejecución Presupuestal — Año Fiscal 2026
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 mt-2">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={cn('btn-secondary !text-sm !px-4 !py-2.5',
              filterOpen && 'border-[#D40000]/40 text-white bg-white/[0.06]')}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', filterOpen && 'rotate-180')} />
          </button>
          <button
            onClick={fetchData}
            className="btn-secondary !text-sm !px-4 !py-2.5"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin-smooth')} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ── FILTROS ─────────────────────────────────── */}
      {filterOpen && (
        <div className="filter-panel animate-fade-in grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400">
              <Layers className="h-4 w-4" /> Rubro de Financiamiento
            </label>
            <div className="relative">
              <select value={filterRubro} onChange={(e) => setFilterRubro(e.target.value)}
                className="form-select !text-sm !py-3">
                <option value="">Todos los Rubros</option>
                {rubros.map((r) => (
                  <option key={r.codigo} value={r.codigo}>{r.codigo} — {r.nombre}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400">
              <Layers className="h-4 w-4" /> Clasificador Presupuestal
            </label>
            <input type="text" placeholder="Ej: 2.3 · 2.6 · 2.1..." value={filterClasificador}
              onChange={(e) => setFilterClasificador(e.target.value)}
              className="form-input !text-sm !py-3" />
          </div>
        </div>
      )}

      {/* ── KPI CARDS ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
        <KpiCard label="Presupuesto Apertura (PIA)" value={cards.total_pia}
          icon={DollarSign} color="#4A6080"
          sub="Presupuesto Inicial Aprobado"
          loading={loading} delay={0} />
        <KpiCard label="Presupuesto Modificado (PIM)" value={cards.total_pim}
          icon={TrendingUp} color="#1565C0"
          sub={`Δ ${fmtM(cards.total_pim - cards.total_pia)} vs. PIA`}
          loading={loading} delay={80} />
        <KpiCard label="Presupuesto Certificado" value={cards.total_certif}
          icon={CheckCircle} color="#7C3AED"
          sub={`${cards.total_pim > 0 ? ((cards.total_certif / cards.total_pim) * 100).toFixed(1) : 0}% del PIM`}
          loading={loading} delay={160} />
        <KpiCard label="Monto Comprometido" value={cards.total_comprometido}
          icon={Percent} color="#F59E0B"
          sub="Compromisos formalizados"
          loading={loading} delay={240} />
        <KpiCard label="Gasto Devengado" value={cards.total_devengado}
          icon={ArrowUpRight} color="#D40000" glow="#FCA5A5"
          sub="Obligaciones reconocidas de pago"
          loading={loading} delay={320} />
        <KpiCard label="Gasto Girado (Pagado)" value={cards.total_girado}
          icon={CreditCard} color="#10B981" glow="#6EE7B7"
          sub="Cheques y transferencias emitidas"
          loading={loading} delay={400} />
      </div>

      {/* ── CHARTS ROW ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Gauge */}
        <div className="lg:col-span-4 glass-card p-7 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-5 w-5 text-[#D40000]" />
            <h3 className="text-lg font-bold text-slate-200">Avance de Ejecución</h3>
          </div>
          <p className="text-sm text-slate-400 mb-6">Devengado vs. PIM total</p>

          {/* SVG ring */}
          <div className="flex justify-center my-4">
            <div className="relative h-52 w-52">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 drop-shadow-2xl">
                <circle cx="50" cy="50" r="42" fill="none"
                  stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
                <circle cx="50" cy="50" r="42" fill="none"
                  stroke="rgba(212,0,0,0.1)" strokeWidth="13"
                  strokeDasharray={C} strokeDashoffset={dashOffset} />
                <defs>
                  <linearGradient id="ggrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B0000" />
                    <stop offset="100%" stopColor="#D40000" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="42" fill="none"
                  stroke="url(#ggrad)" strokeWidth="9"
                  strokeDasharray={C} strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black tabular-nums text-white leading-none">
                  {pct.toFixed(1)}%
                </span>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">
                  Ejecutado
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-5 space-y-3.5 mt-auto">
            {[
              { label: 'PIM Total',  value: cards.total_pim,            color: '#94A3B8' },
              { label: 'Devengado', value: cards.total_devengado,       color: '#D40000' },
              { label: 'Saldo',     value: cards.total_pim - cards.total_devengado, color: '#4A6080' },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-base font-semibold text-slate-400">{r.label}</span>
                <span className="text-base font-bold tabular-nums" style={{ color: r.color }}>
                  {fmtM(r.value)}
                </span>
              </div>
            ))}
            <div className="progress-bar-track mt-1" style={{ height: '6px' }}>
              <div className="progress-bar-fill red" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Area chart */}
        <div className="lg:col-span-8 glass-card p-7 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-200">Evolución Mensual del Gasto</h3>
              <p className="text-sm text-slate-400 mt-0.5">Devengados vs. Girados — 2026</p>
            </div>
            <div className="flex items-center gap-5">
              {[
                { color: '#D40000', label: 'Devengado' },
                { color: '#10B981', label: 'Girado' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-4 rounded-sm" style={{ background: l.color }} />
                  <span className="text-sm font-semibold text-slate-400">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-[240px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <RefreshCw className="h-10 w-10 text-slate-700 animate-spin-smooth" />
              </div>
            ) : months.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={months} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 text-base font-semibold">
                No hay datos mensuales disponibles.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── WATERFALL BAR ───────────────────────────── */}
      <div className="glass-card p-7">
        <div className="flex items-center gap-3 mb-6">
          <TrendingDown className="h-5 w-5 text-[#D40000]" />
          <h3 className="text-lg font-bold text-slate-200">
            Cascada Presupuestaria — Comparativa de Etapas
          </h3>
        </div>
        <div className="h-56">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-slate-700 animate-spin-smooth" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stages} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
                  {stages.map((s, i) => (
                    <Cell key={i} fill={s.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}
