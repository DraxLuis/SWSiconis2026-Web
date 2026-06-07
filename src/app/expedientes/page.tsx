'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Search, FileSpreadsheet, RefreshCw, SlidersHorizontal, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface ExpRow {
  expediente: string; mes_eje: string; tipo_op: string;
  ciclo: string; fase: string; sec_reg: string;
  cod_doc: string; num_doc: string; fecha_doc: string;
  clasificad: string; clasif_nombre: string;
  sec_func: string; meta_nombre: string;
  proveedor_ruc: string; proveedor_nombre: string;
  glosa: string; moneda: string;
  monto_orig: number; monto: number;
  fec_proc: string; estado: string; certif: string;
}

const FASE_LABELS: Record<string, string> = {
  C: 'Comprometido', D: 'Devengado', G: 'Girado', P: 'Pagado',
  '': 'Todos'
};

export default function ExpedientesPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ExpRow[]>([]);
  const [total, setTotal] = useState(0);
  const [fases, setFases] = useState<string[]>([]);
  const [meses, setMeses] = useState<string[]>([]);
  const [filterFase, setFilterFase] = useState('');
  const [filterMes, setFilterMes] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterFase) params.append('fase', filterFase);
      if (filterMes) params.append('mes', filterMes);
      if (search) params.append('proveedor', search);
      params.append('page', String(page));
      params.append('pageSize', String(PAGE_SIZE));
      const res = await fetch(`/api/expedientes?${params}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.rows ?? []);
        setTotal(data.total ?? 0);
        if (data.fases?.length) setFases(data.fases);
        if (data.meses?.length) setMeses(data.meses);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filterFase, filterMes, search, page]);

  useEffect(() => { setPage(1); }, [filterFase, filterMes, search]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const fmt = (v: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(v || 0);
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const totalMonto = rows.reduce((s, r) => s + r.monto, 0);

  const exportExcel = () => {
    const data = rows.map(r => ({
      'Expediente': r.expediente, 'Mes': r.mes_eje,
      'Tipo Op.': r.tipo_op, 'Ciclo': r.ciclo, 'Fase': r.fase,
      'Documento': `${r.cod_doc} ${r.num_doc}`, 'Fecha Doc.': r.fecha_doc,
      'Clasificador': r.clasificad, 'Descripción Clasificador': r.clasif_nombre,
      'Meta': r.sec_func, 'Nombre Meta': r.meta_nombre,
      'RUC Proveedor': r.proveedor_ruc, 'Proveedor': r.proveedor_nombre,
      'Glosa': r.glosa,
      'Monto Original (S/)': r.monto_orig, 'Monto (S/)': r.monto,
      'Fecha Proceso': r.fec_proc, 'Estado': r.estado,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expedientes Gastos');
    XLSX.writeFile(wb, `SWSiconis_Expedientes_2026.xlsx`);
  };

  const faseBadge = (fase: string) => {
    const colors: Record<string, string> = {
      C: 'bg-blue-900/40 text-blue-300 border-blue-800/40',
      D: 'bg-red-900/40 text-red-300 border-red-800/40',
      G: 'bg-emerald-900/40 text-emerald-300 border-emerald-800/40',
      P: 'bg-purple-900/40 text-purple-300 border-purple-800/40',
    };
    return (
      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border', colors[fase] ?? 'bg-slate-900/40 text-slate-300 border-slate-700')}>
        {FASE_LABELS[fase] ?? fase}
      </span>
    );
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#d40000] text-xs font-bold uppercase tracking-widest mb-1">
            <FileText className="h-4 w-4" /> Módulo de Expedientes
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">
            Expedientes de Gastos 2026
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Seguimiento detallado de expedientes por fase: Compromiso, Devengado y Girado
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportExcel} disabled={loading || !rows.length}
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
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Fase del Expediente</label>
            <select value={filterFase} onChange={e => setFilterFase(e.target.value)}
              className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-300 focus:outline-none focus:border-[#d40000]/60 transition-all">
              <option value="">Todas las Fases</option>
              {fases.map(f => <option key={f} value={f}>{FASE_LABELS[f] ?? f} ({f})</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Mes de Ejecución</label>
            <select value={filterMes} onChange={e => setFilterMes(e.target.value)}
              className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-300 focus:outline-none focus:border-[#d40000]/60 transition-all">
              <option value="">Todos los Meses</option>
              {meses.map(m => <option key={m} value={m}>Mes {m}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Buscar Proveedor</label>
            <div className="relative">
              <input type="text" placeholder="Nombre de proveedor..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#d40000]/60 transition-all" />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs text-slate-400 font-semibold">
        <span className="px-3 py-1.5 rounded-lg bg-slate-900/40 border border-slate-800">
          {total.toLocaleString('es-PE')} expedientes
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-red-950/30 border border-red-900/30 text-red-400">
          Total: {fmt(totalMonto)}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#081020]/60 backdrop-blur-md shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/35 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-3.5 px-4">Expediente</th>
                <th className="py-3.5 px-3">Mes</th>
                <th className="py-3.5 px-3">Fase</th>
                <th className="py-3.5 px-4">Proveedor / RUC</th>
                <th className="py-3.5 px-4">Clasificador</th>
                <th className="py-3.5 px-4">Meta</th>
                <th className="py-3.5 px-4">Glosa</th>
                <th className="py-3.5 px-4 text-right">Monto (S/)</th>
                <th className="py-3.5 px-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-medium text-slate-300">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="py-4 px-4"><div className="h-3.5 bg-slate-800 rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-slate-600" />
                      <span className="font-semibold">No se encontraron expedientes.</span>
                    </div>
                  </td>
                </tr>
              ) : rows.map((row, i) => (
                <tr key={i} className="hover:bg-[#0c162b]/40 transition-colors duration-150">
                  <td className="py-3.5 px-4 font-mono font-bold text-white text-[11px]">{row.expediente}</td>
                  <td className="py-3.5 px-3 text-slate-400 font-semibold">{row.mes_eje}</td>
                  <td className="py-3.5 px-3">{faseBadge(row.fase)}</td>
                  <td className="py-3.5 px-4 max-w-[180px]">
                    <p className="font-semibold text-slate-200 truncate" title={row.proveedor_nombre}>{row.proveedor_nombre || '—'}</p>
                    {row.proveedor_ruc && <p className="text-[10px] text-slate-500 font-mono">{row.proveedor_ruc}</p>}
                  </td>
                  <td className="py-3.5 px-4 max-w-[160px]">
                    <p className="font-mono font-bold text-slate-400 text-[10px]">{row.clasificad}</p>
                    <p className="text-[10px] text-slate-600 truncate" title={row.clasif_nombre}>{row.clasif_nombre}</p>
                  </td>
                  <td className="py-3.5 px-4 max-w-[140px]">
                    <p className="font-mono text-[10px] text-slate-500">{row.sec_func}</p>
                    <p className="text-[10px] text-slate-600 truncate" title={row.meta_nombre}>{row.meta_nombre}</p>
                  </td>
                  <td className="py-3.5 px-4 max-w-[200px]">
                    <p className="text-slate-400 truncate text-[10px]" title={row.glosa}>{row.glosa || '—'}</p>
                    {row.num_doc && <p className="text-[9px] text-slate-600">{row.cod_doc} {row.num_doc}</p>}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-white">{fmt(row.monto)}</td>
                  <td className="py-3.5 px-3 text-center">
                    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold',
                      row.estado === 'A' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-800/60 text-slate-400'
                    )}>
                      {row.estado || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {!loading && total > PAGE_SIZE && (
          <div className="px-5 py-4 border-t border-slate-800/80 bg-slate-900/20 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-400 font-semibold">
              Página {page} de {totalPages} · {total} expedientes
            </span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0b1329]/40 hover:bg-slate-800/40 text-slate-400 hover:text-white disabled:opacity-30 text-xs font-bold transition-all">
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </button>
              <span className="text-xs text-slate-400 px-2">{page}/{totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0b1329]/40 hover:bg-slate-800/40 text-slate-400 hover:text-white disabled:opacity-30 text-xs font-bold transition-all">
                Siguiente <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
