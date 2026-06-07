'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import {
  Target, Search, FileSpreadsheet, RefreshCw, SlidersHorizontal,
  ChevronDown, ChevronUp, AlertTriangle, ChevronLeft, ChevronRight, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface MetaRow {
  sec_func: string; act_proy: string; componente: string;
  funcion: string; programa: string;
  meta_nombre: string; finalidad_nombre: string; act_proy_nombre: string;
  unidmed: string; cantidad: number;
  pia: number; pim: number; certif: number; comprometido: number;
  devengado: number; girado: number;
  dev_01: number; dev_02: number; dev_03: number; dev_04: number;
  dev_05: number; dev_06: number; dev_07: number; dev_08: number;
  dev_09: number; dev_10: number; dev_11: number; dev_12: number;
  gir_01: number; gir_02: number; gir_03: number; gir_04: number;
  gir_05: number; gir_06: number; gir_07: number; gir_08: number;
  gir_09: number; gir_10: number; gir_11: number; gir_12: number;
}

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'];

export default function MetasPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<MetaRow[]>([]);
  const [rubros, setRubros] = useState<{ codigo: string; nombre: string }[]>([]);
  const [funciones, setFunciones] = useState<string[]>([]);
  const [filterRubro, setFilterRubro] = useState('');
  const [filterFuncion, setFilterFuncion] = useState('');
  const [search, setSearch] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRubro) params.append('rubro', filterRubro);
      if (filterFuncion) params.append('funcion', filterFuncion);
      const res = await fetch(`/api/metas?${params}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.rows ?? []);
        if (data.rubros?.length) setRubros(data.rubros);
        if (data.funciones?.length) setFunciones(data.funciones);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filterRubro, filterFuncion]);

  useEffect(() => { fetchData(); setPage(1); }, [fetchData]);

  const fmt = (v: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(v || 0);

  const filtered = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.meta_nombre.toLowerCase().includes(q) ||
      r.sec_func.includes(q) || r.act_proy.toLowerCase().includes(q) ||
      r.act_proy_nombre.toLowerCase().includes(q);
  });

  const totals = filtered.reduce((acc, r) => ({
    pia: acc.pia + r.pia, pim: acc.pim + r.pim, certif: acc.certif + r.certif,
    devengado: acc.devengado + r.devengado, girado: acc.girado + r.girado,
  }), { pia: 0, pim: 0, certif: 0, devengado: 0, girado: 0 });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleRow = (id: string) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

  const exportExcel = () => {
    const data = filtered.map(r => ({
      'Meta': r.sec_func, 'Nombre Meta': r.meta_nombre,
      'Act/Proy': r.act_proy, 'Nombre Act/Proy': r.act_proy_nombre,
      'Función': r.funcion, 'Programa': r.programa,
      'Unidad Med.': r.unidmed, 'Cantidad': r.cantidad,
      'PIA (S/)': r.pia, 'PIM (S/)': r.pim, 'Certificado (S/)': r.certif,
      'Comprometido (S/)': r.comprometido, 'Devengado (S/)': r.devengado,
      'Girado (S/)': r.girado,
      '% Avance Dev': r.pim > 0 ? ((r.devengado / r.pim) * 100).toFixed(2) : '0.00',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ejecución por Meta');
    XLSX.writeFile(wb, `SWSiconis_Metas_2026.xlsx`);
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#d40000] text-xs font-bold uppercase tracking-widest mb-1">
            <Target className="h-4 w-4" /> Módulo de Presupuesto
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">
            Ejecución por Meta Presupuestal
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Seguimiento de PIA, PIM y ejecución agrupado por Sección Funcional (Meta) — 2026
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportExcel} disabled={loading || !filtered.length}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg border border-emerald-800/60 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 hover:text-emerald-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
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
          <SlidersHorizontal className="h-4 w-4 text-[#d40000]" /> Filtros y Búsqueda
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <Layers className="h-3 w-3" /> Rubro / Fuente
            </label>
            <select value={filterRubro} onChange={e => setFilterRubro(e.target.value)}
              className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-300 focus:outline-none focus:border-[#d40000]/60 transition-all">
              <option value="">Todos los Rubros</option>
              {rubros.map(r => <option key={r.codigo} value={r.codigo}>{r.codigo} - {r.nombre}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <Target className="h-3 w-3" /> Función
            </label>
            <select value={filterFuncion} onChange={e => setFilterFuncion(e.target.value)}
              className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-300 focus:outline-none focus:border-[#d40000]/60 transition-all">
              <option value="">Todas las Funciones</option>
              {funciones.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <Search className="h-3 w-3" /> Buscar meta
            </label>
            <div className="relative">
              <input type="text" placeholder="Nombre de meta o actividad..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#d40000]/60 transition-all" />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary mini-cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'PIM Total', val: totals.pim, color: 'text-white' },
          { label: 'Certificado', val: totals.certif, color: 'text-blue-400' },
          { label: 'Devengado', val: totals.devengado, color: 'text-red-400' },
          { label: 'Girado', val: totals.girado, color: 'text-emerald-400' },
          { label: '% Avance (Dev/PIM)', val: totals.pim > 0 ? (totals.devengado / totals.pim) * 100 : 0, color: 'text-orange-400', isPercent: true },
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
                <th className="py-3.5 px-4 w-10"></th>
                <th className="py-3.5 px-4 w-24">Meta</th>
                <th className="py-3.5 px-4">Nombre / Actividad-Proyecto</th>
                <th className="py-3.5 px-3 w-20 text-center">Unid/Cant</th>
                <th className="py-3.5 px-4 text-right">PIM</th>
                <th className="py-3.5 px-4 text-right">Certificado</th>
                <th className="py-3.5 px-4 text-right">Devengado</th>
                <th className="py-3.5 px-4 text-right">Girado</th>
                <th className="py-3.5 px-4 text-center w-28">% Avance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-medium text-slate-300">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-slate-600" />
                      <span className="font-semibold">No se encontraron metas presupuestales.</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.map(row => {
                const id = row.sec_func;
                const isExp = !!expandedRows[id];
                const avance = row.pim > 0 ? (row.devengado / row.pim) * 100 : 0;
                return (
                  <Fragment key={id}>
                    <tr
                      className={cn('hover:bg-[#0c162b]/40 transition-colors cursor-pointer',
                        isExp && 'bg-[#0b152d]/60 border-l-2 border-[#d40000]'
                      )}
                      onClick={() => toggleRow(id)}
                    >
                      <td className="py-4 px-4 text-center">
                        <button className="p-1 rounded hover:bg-slate-800/80">
                          {isExp ? <ChevronUp className="h-4 w-4 text-[#d40000]" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </button>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-slate-400 text-[11px]">{row.sec_func}</td>
                      <td className="py-4 px-4 max-w-[280px]">
                        <p className="font-semibold text-slate-200 truncate" title={row.meta_nombre}>{row.meta_nombre}</p>
                        <p className="text-[10px] text-slate-500 truncate">{row.act_proy} · {row.act_proy_nombre}</p>
                        {row.funcion && <p className="text-[9px] text-slate-600 truncate">F:{row.funcion} P:{row.programa}</p>}
                      </td>
                      <td className="py-4 px-3 text-center">
                        <p className="text-[10px] text-slate-500 font-semibold">{row.unidmed}</p>
                        <p className="text-[11px] font-bold text-slate-300">{row.cantidad > 0 ? row.cantidad.toLocaleString('es-PE') : '—'}</p>
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-semibold text-white">{fmt(row.pim)}</td>
                      <td className="py-4 px-4 text-right font-mono font-semibold text-blue-400">{fmt(row.certif)}</td>
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
                    {isExp && (
                      <tr>
                        <td colSpan={9} className="p-0 bg-slate-950/45 border-b border-slate-800/40">
                          <div className="p-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-[#d40000]" />
                              Distribución Mensual — Meta {row.sec_func}
                            </h4>
                            <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#091124]/40">
                              <table className="w-full min-w-[700px] border-collapse text-[11px]">
                                <thead>
                                  <tr className="bg-slate-900/40 text-slate-500 font-bold border-b border-slate-800">
                                    <th className="py-2.5 px-3 text-left w-24">Concepto</th>
                                    {MONTHS.map(m => <th key={m} className="py-2.5 px-2 text-right">{m}</th>)}
                                    <th className="py-2.5 px-3 text-right font-extrabold text-slate-400">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/40 font-mono font-medium">
                                  {(['devengado', 'girado'] as const).map(tipo => (
                                    <tr key={tipo} className="hover:bg-slate-900/10">
                                      <td className={cn('py-2.5 px-3 text-left font-sans font-bold',
                                        tipo === 'devengado' ? 'text-red-400' : 'text-emerald-400'
                                      )}>
                                        {tipo === 'devengado' ? 'Devengado' : 'Girado'}
                                      </td>
                                      {Array.from({ length: 12 }, (_, i) => {
                                        const mk = (i + 1).toString().padStart(2, '0');
                                        const key = `${tipo === 'devengado' ? 'dev' : 'gir'}_${mk}` as keyof MetaRow;
                                        return <td key={i} className="py-2.5 px-2 text-right">{fmt(row[key] as number)}</td>;
                                      })}
                                      <td className={cn('py-2.5 px-3 text-right font-bold',
                                        tipo === 'devengado' ? 'text-red-400 bg-red-950/10' : 'text-emerald-400 bg-emerald-950/10'
                                      )}>
                                        {fmt(tipo === 'devengado' ? row.devengado : row.girado)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {/* Extra meta info */}
                            {row.finalidad_nombre && (
                              <p className="text-[11px] text-slate-500 font-medium">
                                <span className="text-slate-400 font-bold">Finalidad:</span> {row.finalidad_nombre}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
            {/* Totals footer */}
            {!loading && filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-700/60 bg-slate-900/30 text-xs font-bold">
                  <td className="py-3 px-4" colSpan={4}>
                    <span className="text-slate-400 uppercase tracking-wider text-[10px]">
                      TOTALES · {filtered.length} metas
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-white">{fmt(totals.pim)}</td>
                  <td className="py-3 px-4 text-right font-mono text-blue-400">{fmt(totals.certif)}</td>
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
        {/* Pagination */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="px-5 py-4 border-t border-slate-800/80 bg-slate-900/20 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-400 font-semibold">
              Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length} metas
            </span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0b1329]/40 hover:bg-slate-800/40 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all">
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </button>
              <span className="text-xs text-slate-400 font-semibold px-2">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0b1329]/40 hover:bg-slate-800/40 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-all">
                Siguiente <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
