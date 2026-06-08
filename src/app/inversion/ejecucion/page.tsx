'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportEjecucionActProy } from '@/lib/excel-exports';

interface ProjectRow {
  act_proy: string;
  act_proy_nombre: string;
  tipo: string; // P = Proyecto, A = Actividad, O = Obra
  pia: number;
  pim: number;
  certif: number;
  comprometido: number; // Compromiso Anual
  atcp: number; // Compromiso Mensual
  devengado: number;
  girado: number;
  metas_count: number;
}

interface Rubro {
  codigo: string;
  nombre: string;
}

const formatMoney = (val: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);

export default function EjecucionProyectosPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [filterRubro, setFilterRubro] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [search, setSearch] = useState('');
  const [selectedRow, setSelectedRow] = useState<ProjectRow | null>(null);

  const fetchEjecucion = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRubro) params.append('rubro', filterRubro);
      const res = await fetch(`/api/proyectos?${params}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.rows || []);
        if (data.rubros) setRubros(data.rubros);
        if (data.rows.length > 0) {
          setSelectedRow(data.rows[0]);
        } else {
          setSelectedRow(null);
        }
      }
    } catch (e) {
      console.error('Error fetching proyectos:', e);
    } finally {
      setLoading(false);
    }
  }, [filterRubro]);

  useEffect(() => {
    fetchEjecucion();
  }, [fetchEjecucion]);

  // Filtering
  const filteredRows = rows.filter(r => {
    if (filterTipo && r.tipo !== filterTipo) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.act_proy.toLowerCase().includes(q) ||
        r.act_proy_nombre.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Totals calculations
  const totals = filteredRows.reduce(
    (acc, r) => {
      acc.pia += r.pia;
      acc.pim += r.pim;
      acc.certif += r.certif;
      acc.comprometido += r.comprometido;
      acc.atcp += r.atcp;
      acc.devengado += r.devengado;
      acc.girado += r.girado;
      return acc;
    },
    { pia: 0, pim: 0, certif: 0, comprometido: 0, atcp: 0, devengado: 0, girado: 0 }
  );

  const totalMod = totals.pim - totals.pia;
  const totalSaldo = totals.pim - totals.devengado;
  const totalAvance = totals.pim > 0 ? (totals.devengado / totals.pim) * 100 : 0;

  const handleExport = () => {
    if (filteredRows.length === 0) return;
    exportEjecucionActProy(filteredRows);
  };

  const tipoBadge = (tipo: string) => {
    const map: Record<string, [string, string]> = {
      P: ['Proyecto', 'bg-purple-900/40 text-purple-300 border-purple-800/30'],
      A: ['Actividad', 'bg-blue-900/40 text-blue-300 border-blue-800/30'],
      O: ['Obra', 'bg-orange-900/40 text-orange-300 border-orange-800/30'],
    };
    const [label, cls] = map[tipo] ?? ['Otro', 'bg-slate-900/40 text-slate-400 border-slate-700'];
    return <span className={cn('inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold border leading-none', cls)}>{label}</span>;
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 space-y-6">
      {/* Outer VFP Window Wrapper - SOLID BACKGROUND, NO TRANSPARENCY OVERLAPS */}
      <div className="rounded-xl border border-slate-700 bg-[#070e1b] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Window Top Title / Metadata Banner */}
        <div className="bg-[#0c1938] border-b border-slate-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
              Ejecución Presupuestal: Actividades y Proyectos
            </span>
          </div>
          <div className="text-xs font-bold text-[#d40000] bg-red-950/40 border border-red-900/60 rounded px-2.5 py-0.5">
            301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA
          </div>
        </div>

        {/* Inner Header Banner - Dark teal solid background */}
        <div className="bg-[#10b981] text-[#070e1b] px-4 py-2.5 flex items-center justify-between shadow-md">
          <h2 className="font-extrabold text-sm tracking-wide uppercase">
            Ejecución Presupuestal - Actividad / Proyecto - 2026
          </h2>
          <button 
            onClick={fetchEjecucion}
            className="flex items-center gap-1.5 text-[11px] font-bold bg-[#070e1b]/40 hover:bg-[#070e1b]/80 border border-emerald-950/60 text-[#070e1b] rounded px-2.5 py-1 transition-all"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            Recargar
          </button>
        </div>

        {/* Filters Panel */}
        <div className="p-4 bg-[#0a1426] border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            <SlidersHorizontal className="h-4 w-4 text-[#10b981]" /> Filtros de Búsqueda
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                <Layers className="h-3 w-3" /> Rubro Presupuestal
              </label>
              <select 
                value={filterRubro} 
                onChange={e => setFilterRubro(e.target.value)}
                className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-[#10b981]/60 transition-all"
              >
                <option value="">Todos los Rubros</option>
                {rubros.map(r => <option key={r.codigo} value={r.codigo}>{r.codigo} - {r.nombre}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tipo</label>
              <select 
                value={filterTipo} 
                onChange={e => setFilterTipo(e.target.value)}
                className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-[#10b981]/60 transition-all"
              >
                <option value="">Todos (Actividades, Proyectos, Obras)</option>
                <option value="A">Actividades</option>
                <option value="P">Proyectos</option>
                <option value="O">Obras / Acc. Inv.</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                <Search className="h-3 w-3" /> Buscar por Texto
              </label>
              <input 
                type="text" 
                placeholder="Código o descripción..."
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded-lg px-3 py-2 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#10b981]/60 transition-all" 
              />
            </div>
          </div>
        </div>

        {/* 12-Column Execution Grid */}
        <div className="overflow-x-auto bg-[#080f1d]">
          <table className="w-full text-left border-collapse table-fixed min-w-[1500px]">
            <thead className="sticky top-0 bg-[#0c182e] border-b border-slate-700 text-slate-400 text-[10px] uppercase font-black tracking-wider z-20">
              <tr>
                <th className="py-2.5 px-4 w-[35px]"></th>
                <th className="py-2.5 px-3 w-[95px]">Código</th>
                <th className="py-2.5 px-3 w-[450px]">Nombre Actividad / Proyecto</th>
                <th className="py-2.5 px-2 w-[80px] text-center">Tipo</th>
                <th className="py-2.5 px-2 w-[70px] text-center">Metas</th>
                <th className="py-2.5 px-3 text-right">PIA</th>
                <th className="py-2.5 px-3 text-right">Mod</th>
                <th className="py-2.5 px-3 text-right">PIM</th>
                <th className="py-2.5 px-3 text-right">Certificado</th>
                <th className="py-2.5 px-3 text-right">Comp. Anual</th>
                <th className="py-2.5 px-3 text-right">Comp. Mensual</th>
                <th className="py-2.5 px-3 text-right">Devengado</th>
                <th className="py-2.5 px-3 text-right">Girado</th>
                <th className="py-2.5 px-3 text-right">Saldo</th>
                <th className="py-2.5 px-3 text-center w-[90px]">Avance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-semibold text-slate-300">
              {loading ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={15} className="py-3 px-4"><div className="h-4 bg-slate-800 rounded w-full" /></td>
                  </tr>
                ))
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-16 text-center text-slate-500 font-bold">
                    No se encontraron registros de ejecución.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isSelected = selectedRow?.act_proy === row.act_proy;
                  const mod = row.pim - row.pia;
                  const saldo = row.pim - row.devengado;
                  const avance = row.pim > 0 ? (row.devengado / row.pim) * 100 : 0;
                  return (
                    <tr 
                      key={row.act_proy}
                      onClick={() => setSelectedRow(row)}
                      className={cn(
                        "cursor-pointer hover:bg-slate-800/20 transition-all select-none",
                        isSelected ? "bg-[#f59e0b] text-[#070e1b] font-bold" : "even:bg-[#070e1a]/50"
                      )}
                    >
                      {/* Triangulito indicator ▶ */}
                      <td className="py-2 px-2 text-center font-black">
                        {isSelected && <span className="text-red-600">▶</span>}
                      </td>
                      <td className={cn("py-2 px-3 font-mono text-[11px]", isSelected ? "text-[#070e1b]" : "text-slate-400")}>
                        {row.act_proy}
                      </td>
                      <td className="py-2 px-3 truncate" title={row.act_proy_nombre}>
                        {row.act_proy_nombre}
                      </td>
                      <td className="py-2 px-2 text-center">{tipoBadge(row.tipo)}</td>
                      <td className="py-2 px-2 text-center font-bold">{row.metas_count}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatMoney(row.pia)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatMoney(mod)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatMoney(row.pim)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatMoney(row.certif)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatMoney(row.comprometido)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatMoney(row.atcp)}</td>
                      <td className={cn("py-2 px-3 text-right font-mono", isSelected ? "text-[#070e1b]" : "text-red-400")}>
                        {formatMoney(row.devengado)}
                      </td>
                      <td className={cn("py-2 px-3 text-right font-mono", isSelected ? "text-[#070e1b]" : "text-emerald-400")}>
                        {formatMoney(row.girado)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">{formatMoney(saldo)}</td>
                      <td className="py-2 px-3 text-center font-mono">{avance.toFixed(1)}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {!loading && filteredRows.length > 0 && (
              <tfoot className="sticky bottom-0 bg-[#0c182e] border-t-2 border-slate-700 z-10 text-xs font-bold">
                <tr>
                  <td colSpan={5} className="py-2.5 px-4 text-slate-400 uppercase text-[10px] tracking-wider">
                    TOTAL GENERAL ( {filteredRows.length} ÍTEMS )
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatMoney(totals.pia)}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatMoney(totalMod)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-white">{formatMoney(totals.pim)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-400">{formatMoney(totals.certif)}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatMoney(totals.comprometido)}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatMoney(totals.atcp)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-red-400">{formatMoney(totals.devengado)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-400">{formatMoney(totals.girado)}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatMoney(totalSaldo)}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-orange-400">{totalAvance.toFixed(1)}%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Window Bottom Actions */}
        <div className="bg-[#0c1938] border-t border-slate-700 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            SICONIS 2026 · EJECUCIÓN PRESUPUESTARAL
          </div>
          <button
            onClick={handleExport}
            disabled={loading || filteredRows.length === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg border border-emerald-800 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 hover:text-emerald-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Ejecución (Excel)
          </button>
        </div>

      </div>
    </div>
  );
}
