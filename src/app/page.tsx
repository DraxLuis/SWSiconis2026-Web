'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  RefreshCw,
  SlidersHorizontal,
  Building2,
  Layers,
  ArrowUpRight,
  TrendingDown,
  CheckCircle,
  CreditCard,
  ChevronDown,
  Activity,
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

interface MonthData {
  name: string;
  devengado: number;
  girado: number;
}

interface RubroOption {
  codigo: string;
  nombre: string;
}

const formatMoney = (val: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);

const formatMoneyCompact = (val: number) => {
  if (val >= 1_000_000) return `S/ ${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `S/ ${(val / 1_000).toFixed(1)}K`;
  return `S/ ${val.toFixed(0)}`;
};

// ─────────────────────────────────────────────────
// KPI Card Component
// ─────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: number;
  subValue?: string;
  subLabel?: string;
  icon: React.ElementType;
  accentColor: string;
  glowColor?: string;
  loading?: boolean;
  delay?: number;
}

function KpiCard({
  label, value, subValue, subLabel, icon: Icon,
  accentColor, glowColor, loading, delay = 0
}: KpiCardProps) {
  return (
    <div
      className="kpi-card animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Accent bar */}
      <span className="kpi-accent-bar" style={{ background: accentColor }} />

      {/* Icon */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}28` }}
        >
          <Icon className="h-4.5 w-4.5" style={{ color: accentColor }} />
        </div>
        {subValue && (
          <span className="badge badge-muted text-[9px]">{subValue}</span>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div className="space-y-2">
          <div className="skeleton h-6 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      ) : (
        <>
          <p className="text-[9px] font-800 uppercase tracking-widest text-[#4A6080] mb-1.5">{label}</p>
          <h3
            className="text-xl font-black leading-none tabular-nums"
            style={{ color: glowColor || '#F0F4FF' }}
          >
            {formatMoneyCompact(value)}
          </h3>
          <p className="text-[10px] text-[#4A6080] mt-1 font-medium">
            {formatMoney(value)}
          </p>
          {subLabel && (
            <p className="text-[9px] font-semibold mt-2" style={{ color: accentColor }}>
              {subLabel}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────
// Custom Chart Tooltip
// ─────────────────────────────────────────────────
interface TooltipPayloadItem { color: string; name: string; value: number; }
interface TooltipProps { active?: boolean; payload?: TooltipPayloadItem[]; label?: string; }

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card-elevated px-4 py-3 shadow-2xl border border-white/10 rounded-xl">
        <p className="text-[10px] font-bold text-[#4A6080] uppercase tracking-widest mb-2">{label}</p>
        {payload.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs mb-1 last:mb-0">
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
            <span className="text-slate-400 font-medium">{item.name}:</span>
            <span className="text-white font-bold tabular-nums">{formatMoney(item.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// ─────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [filterRubro, setFilterRubro] = useState('');
  const [filterClasificador, setFilterClasificador] = useState('');
  const [rubrosList, setRubrosList] = useState<RubroOption[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const [cards, setCards] = useState<CardData>({
    total_pia: 0, total_pim: 0, total_certif: 0,
    total_comprometido: 0, total_devengado: 0, total_girado: 0,
  });
  const [months, setMonths] = useState<MonthData[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/dashboard';
      const params = new URLSearchParams();
      if (filterRubro) params.append('rubro', filterRubro);
      if (filterClasificador) params.append('clasificador', filterClasificador);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCards(data.cards);
        setMonths(data.months);
        if (data.rubros && rubrosList.length === 0) setRubrosList(data.rubros);
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
    }
  }, [filterRubro, filterClasificador, rubrosList.length]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const progressPercent = cards.total_pim > 0
    ? (cards.total_devengado / cards.total_pim) * 100 : 0;

  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference - (circumference * Math.min(progressPercent, 100)) / 100;

  // Bar chart data for budget stages
  const stagesData = [
    { name: 'PIA',        value: cards.total_pia,          color: '#4A6080' },
    { name: 'PIM',        value: cards.total_pim,          color: '#1565C0' },
    { name: 'Certif.',    value: cards.total_certif,       color: '#7C3AED' },
    { name: 'Comprom.',   value: cards.total_comprometido, color: '#F59E0B' },
    { name: 'Devengado',  value: cards.total_devengado,    color: '#D40000' },
    { name: 'Girado',     value: cards.total_girado,       color: '#10B981' },
  ];

  return (
    <div className="space-y-7 stagger-children">

      {/* ── Page Header ────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="section-label mb-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Unidad Ejecutora 301548
          </div>
          <h1 className="page-title">
            Municipalidad Provincial<br className="hidden sm:block" /> de Huancabamba
          </h1>
          <p className="text-[12px] text-[#4A6080] mt-1.5 font-medium">
            Seguimiento de Ejecución Presupuestal — Año Fiscal 2026
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Filter toggle */}
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={cn(
              'btn-secondary',
              filterOpen && 'border-[#D40000]/40 text-white bg-white/[0.06]'
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
            <ChevronDown
              className={cn('h-3 w-3 transition-transform duration-200', filterOpen && 'rotate-180')}
            />
          </button>
          {/* Refresh */}
          <button onClick={fetchDashboardData} className="btn-secondary">
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin-smooth')} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ── Filter Panel (collapsible) ────────────── */}
      {filterOpen && (
        <div className="filter-panel animate-fade-in grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-700 uppercase tracking-widest text-[#4A6080]">
              <Layers className="h-3 w-3" />
              Fuente de Financiamiento (Rubro)
            </label>
            <div className="relative">
              <select
                value={filterRubro}
                onChange={(e) => setFilterRubro(e.target.value)}
                className="form-select pr-8"
              >
                <option value="">Todos los Rubros</option>
                {rubrosList.map((r) => (
                  <option key={r.codigo} value={r.codigo}>
                    {r.codigo} — {r.nombre}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#4A6080] pointer-events-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-700 uppercase tracking-widest text-[#4A6080]">
              <Layers className="h-3 w-3" />
              Clasificador Presupuestal
            </label>
            <input
              type="text"
              placeholder="Ej: 2.3 o 2.6..."
              value={filterClasificador}
              onChange={(e) => setFilterClasificador(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      )}

      {/* ── KPI Cards Grid ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          label="Presupuesto Apertura (PIA)"
          value={cards.total_pia}
          icon={DollarSign}
          accentColor="#4A6080"
          subLabel="Presupuesto Inicial Aprobado"
          loading={loading}
          delay={50}
        />
        <KpiCard
          label="Presupuesto Modificado (PIM)"
          value={cards.total_pim}
          icon={TrendingUp}
          accentColor="#1565C0"
          subLabel={`Δ ${formatMoneyCompact(cards.total_pim - cards.total_pia)} vs PIA`}
          loading={loading}
          delay={100}
        />
        <KpiCard
          label="Presupuesto Certificado"
          value={cards.total_certif}
          icon={CheckCircle}
          accentColor="#7C3AED"
          subLabel={`${((cards.total_certif / (cards.total_pim || 1)) * 100).toFixed(1)}% del PIM`}
          loading={loading}
          delay={150}
        />
        <KpiCard
          label="Monto Comprometido Anual"
          value={cards.total_comprometido}
          icon={Percent}
          accentColor="#F59E0B"
          subLabel="Contratos y compromisos formalizados"
          loading={loading}
          delay={200}
        />
        <KpiCard
          label="Gasto Devengado (Ejecutado)"
          value={cards.total_devengado}
          icon={ArrowUpRight}
          accentColor="#D40000"
          glowColor="#FF8080"
          subLabel="Obligaciones de pago reconocidas"
          loading={loading}
          delay={250}
        />
        <KpiCard
          label="Gasto Girado (Pagado)"
          value={cards.total_girado}
          icon={CreditCard}
          accentColor="#10B981"
          glowColor="#6EE7B7"
          subLabel="Transferencias y cheques emitidos"
          loading={loading}
          delay={300}
        />
      </div>

      {/* ── Charts Row ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Gauge Progress Card */}
        <div className="lg:col-span-4 glass-card p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-[#D40000]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              Avance de Ejecución
            </h3>
          </div>
          <p className="text-[10px] text-[#4A6080] mb-6">Devengado vs. PIM total</p>

          {/* SVG Gauge */}
          <div className="flex justify-center my-4">
            <div className="relative h-44 w-44">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full -rotate-90 drop-shadow-2xl"
              >
                {/* Track */}
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="8"
                />
                {/* Glow layer */}
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="rgba(212,0,0,0.12)"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
                {/* Main fill */}
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B0000" />
                    <stop offset="100%" stopColor="#D40000" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="url(#gaugeGrad)"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black tabular-nums text-white leading-none">
                  {progressPercent.toFixed(1)}%
                </span>
                <span className="text-[9px] font-bold text-[#4A6080] uppercase tracking-widest mt-1">
                  Ejecutado
                </span>
              </div>
            </div>
          </div>

          {/* Stats below gauge */}
          <div className="border-t border-white/[0.06] pt-4 space-y-3 mt-auto">
            {[
              { label: 'PIM Total',      value: cards.total_pim,      color: '#94A3B8' },
              { label: 'Devengado',      value: cards.total_devengado, color: '#D40000' },
              { label: 'Saldo',          value: cards.total_pim - cards.total_devengado, color: '#4A6080' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[#4A6080]">{row.label}</span>
                <span className="text-[11px] font-bold tabular-nums" style={{ color: row.color }}>
                  {formatMoneyCompact(row.value)}
                </span>
              </div>
            ))}

            <div className="progress-bar-track mt-2">
              <div
                className="progress-bar-fill red"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Area Chart */}
        <div className="lg:col-span-8 glass-card p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                Evolución Mensual del Gasto
              </h3>
              <p className="text-[10px] text-[#4A6080] mt-0.5">
                Devengados vs. Girados — 2026
              </p>
            </div>
            <div className="flex items-center gap-4">
              {[
                { color: '#D40000', label: 'Devengado' },
                { color: '#10B981', label: 'Girado' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className="h-2 w-3 rounded-sm" style={{ background: l.color }} />
                  <span className="text-[10px] font-semibold text-[#4A6080]">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-[220px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-[#2A3A50] animate-spin-smooth" />
              </div>
            ) : months.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={months} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradDev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D40000" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#D40000" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradGir" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="name"
                    stroke="#2A3A50"
                    tick={{ fill: '#4A6080', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#2A3A50"
                    tick={{ fill: '#4A6080', fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `S/ ${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="devengado"
                    name="Devengado"
                    stroke="#D40000"
                    strokeWidth={2.5}
                    fill="url(#gradDev)"
                  />
                  <Area
                    type="monotone"
                    dataKey="girado"
                    name="Girado"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#gradGir)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#2A3A50] text-xs font-semibold">
                No hay datos mensuales disponibles.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Budget Waterfall ──────────────────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingDown className="h-4 w-4 text-[#D40000]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
            Cascada Presupuestaria — Comparativa de Etapas
          </h3>
        </div>

        <div className="h-48">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-[#2A3A50] animate-spin-smooth" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stagesData}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#2A3A50"
                  tick={{ fill: '#4A6080', fontSize: 10, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#2A3A50"
                  tick={{ fill: '#4A6080', fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `S/ ${(v / 1_000_000).toFixed(1)}M`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" name="Monto" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {stagesData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} fillOpacity={0.85} />
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
