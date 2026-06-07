'use client';

import { useState, useEffect, useCallback } from 'react';
import { FolderOpen, Search, FileSpreadsheet, RefreshCw, SlidersHorizontal, AlertTriangle, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface ProyRow {
  act_proy: string; act_proy_nombre: string; tipo: string;
  pia: number; pim: number; certif: number; comprometido: number;
  devengado: number; girado: number; metas_count: number;
}

export default function ProyectosPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ProyRow[]>([]);
  const [rubros, setRubros] = useState<{ codigo: string; nombre: string }[]>([]);
  const [filterRubro, setFilterRubro] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRubro) params.append('rubro', filterRubro);
      const res = await fetch(`/api/proyectos?${params}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.rows ?? []);
        if (data.rubros?.length) setRubros(data.rubros);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filterRubro]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fmt = (v: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(v || 0);

  const filtered = rows.filter(r => {
    if (filterTipo && r.tipo !== filterTipo) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.act_proy_nombre.toLowerCase().includes(q) && !r.act_proy.includes(q)) return false;
    }
    return true;
  });

  const totals = filtered.reduce((a, r) => ({
    pia: a.pia + r.pia, pim: a.pim + r.pim, certif: a.certif + r.certif,
    devengado: a.devengado + r.devengado, girado: a.girado + r.girado,
  }), { pia: 0, pim: 0, certif: 0, devengado: 0, girado: 0 });

  const tipoBadge = (tipo: string) => {
    const map: Record<string, [string, string]> = {
      P: ['Proyecto', 'bg-purple-900/40 text-purple-300 border-purple-800/30'],
      A: ['Actividad', 'bg-blue-900/40 text-blue-300 border-blue-800/30'],
      O: ['Obra', 'bg-orange-900/40 text-orange-300 border-orange-800/30'],
    };
    const [label, cls] = map[tipo] ?? ['Otro', 'bg-slate-900/40 text-slate-400 border-slate-700'];
    return <span className={cn('inline-flex px-2 py-0.5 rounded text-[10px] font-bold border', cls)}>{label}</span>;
  };

  const exportExcel = () => {
    const data = filtered.map(r => ({
      'Act/Proy': r.act_proy, 'Nombre': r.act_proy_nombre, 'Tipo': r.tipo,
      'N° Metas': r.metas_count,
      'PIA (S/)': r.pia, 'PIM (S/)': r.pim, 'Certificado (S/)': r.certif,
      'Comprometido (S/)': r.comprometido,
      'Devengado (S/)': r.devengado, 'Girado (S/)': r.girado,
      '% Avance': r.pim > 0 ? ((r.devengado / r.pim) * 100).toFixed(2) : '0.00',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Proyectos y Actividades');
    XLSX.writeFile(wb, `SWSiconis_Proyectos_2026.xlsx`);
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#d40000] text-xs font-bold uppercase tracking-widest mb-1">
            <FolderOpen className="h-4 w-4" /> Módulo de Presupuesto
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">
            Ejecución por Actividad / Proyecto
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Presupuesto agrupado por código de Actividad o Proyecto de Inversión — 2026
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportExcel} disabled={loading || !filtered.length}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg border border-emerald-800/60 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 hover:text-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            <FileSpreadsheet className="h-4 w-4" /> Exportar Excel
          </button>
          <button onClick={fetchData}
            className="p-2.5 rounded-lg border border-slate-800 bg-[#0b1329]/40 hover:bg-slate-800/40 text-slate-300 hover:text-white transition-all">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-5 rounded-2xl border border-slate-800/70 bg-[#091122]/40 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
          <SlidersHorizontal className="h-4 w-4 text-[#d40000]" /> Filtros
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <Layers className="h-3 w-3" /> Rubro
            </label>
            <select value={filterRubro} onChange={e => setFilterRubro(e.target.value)}
              className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-300 focus:outline-none focus:border-[#d40000]/60 transition-all">
              <option value="">Todos los Rubros</option>
              {rubros.map(r => <option key={r.codigo} value={r.codigo}>{r.codigo} - {r.nombre}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tipo</label>
            <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}
              className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-300 focus:outline-none focus:border-[#d40000]/60 transition-all">
              <option value="">Todos</option>
              <option value="A">Actividades</option>
              <option value="P">Proyectos</option>
              <option value="O">Obras</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <Search className="h-3 w-3" /> Buscar
            </label>
            <div className="relative">
              <input type="text" placeholder="Nombre o código..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#d40000]/60 transition-all" />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'PIM Total', val: totals.pim, color: 'text-white' },
          { label: 'Certificado', val: totals.certif, color: 'text-blue-400' },
          { label: 'Devengado', val: totals.devengado, color: 'text-red-400' },
          { label: '% Avance', val: totals.pim > 0 ? (totals.devengado / totals.pim) * 100 : 0, color: 'text-orange-400', isPercent: true },
        ].map(({ label, val, color, isPercent }) => (
          <div key={label} className="p-4 rounded-xl border border-slate-800/50 bg-[#091224]/20 backdrop-blur-md">
            <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-1">{label}</p>
            <p className={cn('text-sm font-extrabold', color)}>
              {isPercent ? `${val.toFixed(1)}%` : fmt(val)}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#081020]/60 backdrop-blur-md shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/35 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-3.5 px-4 w-28">Código</th>
                <th className="py-3.5 px-4">Nombre</th>
                <th className="py-3.5 px-3 w-24 text-center">Tipo</th>
                <th className="py-3.5 px-3 w-16 text-center">Metas</th>
                <th className="py-3.5 px-4 text-right">PIM</th>
                <th className="py-3.5 px-4 text-right">Devengado</th>
                <th className="py-3.5 px-4 text-right">Girado</th>
                <th className="py-3.5 px-4 text-center w-28">% Avance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-medium text-slate-300">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="py-4 px-4"><div className="h-3.5 bg-slate-800 rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-slate-600" />
                      <span className="font-semibold">No se encontraron actividades o proyectos.</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(row => {
                const avance = row.pim > 0 ? (row.devengado / row.pim) * 100 : 0;
                return (
                  <tr key={row.act_proy} className="hover:bg-[#0c162b]/40 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-400 text-[11px]">{row.act_proy}</td>
                    <td className="py-4 px-4 max-w-[280px]">
                      <p className="font-semibold text-slate-200 truncate" title={row.act_proy_nombre}>{row.act_proy_nombre || '—'}</p>
                    </td>
                    <td className="py-4 px-3 text-center">{tipoBadge(row.tipo)}</td>
                    <td className="py-4 px-3 text-center font-bold text-slate-400">{row.metas_count}</td>
                    <td className="py-4 px-4 text-right font-mono font-semibold text-white">{fmt(row.pim)}</td>
                    <td className="py-4 px-4 text-right font-mono font-semibold text-red-400">{fmt(row.devengado)}</td>
                    <td className="py-4 px-4 text-right font-mono font-semibold text-emerald-400">{fmt(row.girado)}</td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-bold font-mono text-white text-[11px]">{avance.toFixed(1)}%</span>
                        <div className="w-20 bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all duration-500',
                            avance >= 75 ? 'bg-emerald-500' : avance >= 40 ? 'bg-orange-500' : 'bg-red-600'
                          )} style={{ width: `${Math.min(avance, 100)}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {!loading && filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-700/60 bg-slate-900/30 text-xs font-bold">
                  <td colSpan={4} className="py-3 px-4 text-slate-400 uppercase text-[10px] tracking-wider">
                    TOTALES · {filtered.length} items
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-white">{fmt(totals.pim)}</td>
                  <td className="py-3 px-4 text-right font-mono text-red-400">{fmt(totals.devengado)}</td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-400">{fmt(totals.girado)}</td>
                  <td className="py-3 px-4 text-center font-mono text-orange-400">
                    {totals.pim > 0 ? ((totals.devengado / totals.pim) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
