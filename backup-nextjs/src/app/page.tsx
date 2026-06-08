'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Percent, 
  RefreshCw, 
  SlidersHorizontal,
  Building,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
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

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [filterRubro, setFilterRubro] = useState('');
  const [filterClasificador, setFilterClasificador] = useState('');
  const [rubrosList, setRubrosList] = useState<RubroOption[]>([]);
  
  const [cards, setCards] = useState<CardData>({
    total_pia: 0,
    total_pim: 0,
    total_certif: 0,
    total_comprometido: 0,
    total_devengado: 0,
    total_girado: 0,
  });
  
  const [months, setMonths] = useState<MonthData[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/dashboard';
      const params = new URLSearchParams();
      if (filterRubro) params.append('rubro', filterRubro);
      if (filterClasificador) params.append('clasificador', filterClasificador);
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCards(data.cards);
        setMonths(data.months);
        if (data.rubros && rubrosList.length === 0) {
          setRubrosList(data.rubros);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [filterRubro, filterClasificador, rubrosList.length]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Format money to PEN currency style: S/ 1,234.56
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  // Execution Avance Percentage
  const progressPercent = cards.total_pim > 0 
    ? (cards.total_devengado / cards.total_pim) * 100 
    : 0;

  // Custom Chart Tooltip
  interface TooltipPayloadItem {
    color: string;
    name: string;
    value: number;
  }

  interface TooltipProps {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0b1329]/95 border border-slate-700/60 p-4 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-xs font-bold text-slate-400 mb-2">{label}</p>
          {payload.map((item, idx: number) => (
            <div key={idx} className="flex items-center gap-3 text-xs mb-1 last:mb-0">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-slate-300 font-medium">{item.name}:</span>
              <span className="text-white font-bold">{formatMoney(item.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#d40000] text-xs font-bold uppercase tracking-widest mb-1">
            <Building className="h-4 w-4" />
            UNIDAD EJECUTORA 301548
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">
            Municipalidad Provincial de Huancabamba
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Seguimiento de la Ejecución de Inversiones — Año Presupuestal 2026
          </p>
        </div>

        <button 
          onClick={fetchDashboardData}
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg border border-slate-800 bg-[#0b1329]/40 hover:bg-slate-800/40 text-slate-300 hover:text-white transition-all duration-300 backdrop-blur-sm shadow-sm"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Actualizar Datos
        </button>
      </div>

      {/* Interactive Filters Panel */}
      <div className="p-5 rounded-2xl border border-slate-800/70 bg-[#091122]/40 backdrop-blur-md shadow-lg shadow-black/20 flex flex-col md:flex-row md:items-center gap-5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <SlidersHorizontal className="h-4 w-4 text-[#d40000]" />
          Filtros de Búsqueda
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
          {/* Rubro Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <Layers className="h-3 w-3" />
              Fuente de Financiamiento (Rubro)
            </label>
            <select
              value={filterRubro}
              onChange={(e) => setFilterRubro(e.target.value)}
              className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-300 focus:outline-none focus:border-[#d40000]/60 transition-all duration-300"
            >
              <option value="">Todos los Rubros</option>
              {rubrosList.map((r) => (
                <option key={r.codigo} value={r.codigo}>
                  {r.codigo} - {r.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Clasificador Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              Clasificador Presupuestal
            </label>
            <input
              type="text"
              placeholder="Ej: 2.3 o 2.6..."
              value={filterClasificador}
              onChange={(e) => setFilterClasificador(e.target.value)}
              className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#d40000]/60 transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Cards KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* PIA */}
        <div className="p-6 rounded-2xl border border-slate-800/50 bg-[#091224]/30 backdrop-blur-md hover:border-slate-700/40 hover:-translate-y-1 transition-all duration-300 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <DollarSign className="h-16 w-16 text-white" />
          </div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1.5">Presupuesto Apertura (PIA)</p>
          <h3 className="text-2xl font-black text-white">{formatMoney(cards.total_pia)}</h3>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
            Presupuesto Inicial Aprobado
          </div>
          <div className="absolute left-0 bottom-0 top-0 w-1 bg-slate-700" />
        </div>

        {/* PIM */}
        <div className="p-6 rounded-2xl border border-slate-800/50 bg-[#091224]/30 backdrop-blur-md hover:border-slate-700/40 hover:-translate-y-1 transition-all duration-300 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <TrendingUp className="h-16 w-16 text-white" />
          </div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1.5">Presupuesto Modificado (PIM)</p>
          <h3 className="text-2xl font-black text-white">{formatMoney(cards.total_pim)}</h3>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-500">
            Modificaciones: {formatMoney(cards.total_pim - cards.total_pia)}
          </div>
          <div className="absolute left-0 bottom-0 top-0 w-1 bg-gradient-to-b from-[#d40000] to-red-800" />
        </div>

        {/* Certificado */}
        <div className="p-6 rounded-2xl border border-slate-800/50 bg-[#091224]/30 backdrop-blur-md hover:border-slate-700/40 hover:-translate-y-1 transition-all duration-300 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <Percent className="h-16 w-16 text-white" />
          </div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1.5">Presupuesto Certificado</p>
          <h3 className="text-2xl font-black text-white">{formatMoney(cards.total_certif)}</h3>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
            Reserva presupuestal aprobada ({((cards.total_certif / (cards.total_pim || 1)) * 100).toFixed(1)}% del PIM)
          </div>
          <div className="absolute left-0 bottom-0 top-0 w-1 bg-blue-600" />
        </div>

        {/* Comprometido */}
        <div className="p-6 rounded-2xl border border-slate-800/50 bg-[#091224]/30 backdrop-blur-md hover:border-slate-700/40 hover:-translate-y-1 transition-all duration-300 shadow-xl relative overflow-hidden group">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1.5">Monto Comprometido Anual</p>
          <h3 className="text-2xl font-black text-white">{formatMoney(cards.total_comprometido)}</h3>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
            Contratos y compromisos formalizados
          </div>
          <div className="absolute left-0 bottom-0 top-0 w-1 bg-orange-600" />
        </div>

        {/* Devengado */}
        <div className="p-6 rounded-2xl border border-[#d40000]/25 bg-gradient-to-br from-[#091224]/30 to-[#d40000]/5 backdrop-blur-md hover:border-[#d40000]/50 hover:-translate-y-1 transition-all duration-300 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <ArrowUpRight className="h-16 w-16 text-[#d40000]" />
          </div>
          <p className="text-[10px] uppercase font-bold text-red-400 tracking-widest mb-1.5">Gasto Devengado (Ejecutado)</p>
          <h3 className="text-2xl font-black text-white">{formatMoney(cards.total_devengado)}</h3>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-[#d40000]">
            Obligaciones de pago reconocidas
          </div>
          <div className="absolute left-0 bottom-0 top-0 w-1 bg-[#d40000]" />
        </div>

        {/* Girado */}
        <div className="p-6 rounded-2xl border border-slate-800/50 bg-[#091224]/30 backdrop-blur-md hover:border-slate-700/40 hover:-translate-y-1 transition-all duration-300 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <TrendingDown className="h-16 w-16 text-white" />
          </div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1.5">Gasto Girado (Pagos Emitidos)</p>
          <h3 className="text-2xl font-black text-white">{formatMoney(cards.total_girado)}</h3>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
            Transferencias y cheques girados
          </div>
          <div className="absolute left-0 bottom-0 top-0 w-1 bg-emerald-600" />
        </div>
      </div>

      {/* Chart and Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Progress Card */}
        <div className="p-6 rounded-2xl border border-slate-800/60 bg-[#091122]/35 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-6">
              Avance de la Ejecución Financiera
            </h3>
            
            <div className="relative flex flex-col items-center justify-center my-6">
              {/* Circular Gauge Representation */}
              <div className="relative h-40 w-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    stroke="rgba(30, 41, 59, 0.5)" 
                    strokeWidth="10" 
                    fill="transparent" 
                  />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    stroke="url(#progressGradient)" 
                    strokeWidth="10" 
                    fill="transparent" 
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * Math.min(progressPercent, 100)) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#b91c1c" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white">{progressPercent.toFixed(1)}%</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Avance Real</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3.5 border-t border-slate-800/60 pt-6">
            <div className="flex justify-between text-xs font-semibold text-slate-400">
              <span>PIM Total:</span>
              <span className="text-white font-bold">{formatMoney(cards.total_pim)}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-400">
              <span>Devengado Total:</span>
              <span className="text-white font-bold">{formatMoney(cards.total_devengado)}</span>
            </div>
            
            {/* Linear Progress Bar fallback */}
            <div className="w-full bg-slate-800/40 rounded-full h-2 overflow-hidden border border-slate-700/20">
              <div 
                className="bg-gradient-to-r from-red-600 to-[#d40000] h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Monthly Trend Area Chart */}
        <div className="p-6 rounded-2xl border border-slate-800/60 bg-[#091122]/35 backdrop-blur-md shadow-xl lg:col-span-2 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Evolución Mensual del Gasto
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Devengados vs. Girados 2026</p>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-3 bg-[#d40000] rounded-sm" />
                Devengado
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-3 bg-emerald-600 rounded-sm" />
                Girado
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-slate-600 animate-spin" />
              </div>
            ) : months.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={months}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorDevengado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d40000" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#d40000" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGirado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(tick) => `S/ ${(tick / 1000).toFixed(0)}k`} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="devengado" 
                    name="Devengado"
                    stroke="#d40000" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorDevengado)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="girado" 
                    name="Girado"
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorGirado)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-500 text-xs font-semibold">
                No hay datos de ejecución mensual disponibles.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
