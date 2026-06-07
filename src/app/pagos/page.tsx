'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, Search, FileSpreadsheet, RefreshCw, SlidersHorizontal,
  AlertTriangle, ChevronLeft, ChevronRight, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface PagoRow {
  expediente: string; secuencia: string; num_doc: string;
  ruc: string; benefici: string; proveedor_nombre: string;
  rubro: string; glosa: string;
  cod_doc: string; fecha_doc: string;
  nom_doc_b: string; fec_doc_b: string;
  const_pago: string; confor_doc: string; confor_des: string; confor_fec: string;
  monto: number; estado: string;
}

export default function PagosPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PagoRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalMonto, setTotalMonto] = useState(0);
  const [rubros, setRubros] = useState<{ codigo: string; nombre: string }[]>([]);
  const [filterRubro, setFilterRubro] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRubro) params.append('rubro', filterRubro);
      if (search) params.append('search', search);
      params.append('page', String(page));
      params.append('pageSize', String(PAGE_SIZE));
      const res = await fetch(`/api/pagos?${params}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.rows ?? []);
        setTotal(data.total ?? 0);
        setTotalMonto(data.totalMonto ?? 0);
        if (data.rubros?.length) setRubros(data.rubros);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filterRubro, search, page]);

  useEffect(() => { setPage(1); }, [filterRubro, search]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const fmt = (v: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(v || 0);
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  const exportExcel = () => {
    const data = rows.map(r => ({
      'Expediente': r.expediente, 'Secuencia': r.secuencia, 'N° Doc': r.num_doc,
      'RUC': r.ruc, 'Beneficiario': r.proveedor_nombre || r.benefici,
      'Rubro': r.rubro, 'Glosa': r.glosa,
      'Tipo Doc.': r.cod_doc, 'Fecha Doc.': r.fecha_doc,
      'Doc. Banco': r.nom_doc_b, 'Fecha Banco': r.fec_doc_b,
      'Constancia': r.const_pago, 'Conformidad Doc.': r.confor_doc,
      'Conformidad Desc.': r.confor_des, 'Conformidad Fecha': r.confor_fec,
      'Monto (S/)': r.monto, 'Estado': r.estado,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Notas de Pago');
    XLSX.writeFile(wb, `SWSiconis_Pagos_2026.xlsx`);
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#d40000] text-xs font-bold uppercase tracking-widest mb-1">
            <CreditCard className="h-4 w-4" /> Módulo de Pagos
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">Notas de Pago 2026</h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Comprobantes de pago registrados con beneficiario, glosa y constancia
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <Search className="h-3 w-3" /> Buscar Beneficiario / RUC
            </label>
            <div className="relative">
              <input type="text" placeholder="Nombre, RUC, N° documento..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#d40000]/60 transition-all" />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 flex-wrap text-xs font-semibold">
        <span className="px-3 py-1.5 rounded-lg bg-slate-900/40 border border-slate-800 text-slate-400">
          {total.toLocaleString('es-PE')} notas de pago
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-900/30 text-emerald-400">
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
                <th className="py-3.5 px-4">Beneficiario / RUC</th>
                <th className="py-3.5 px-4">Glosa</th>
                <th className="py-3.5 px-3">Fecha</th>
                <th className="py-3.5 px-4">Constancia / Conformidad</th>
                <th className="py-3.5 px-4 text-right">Monto (S/)</th>
                <th className="py-3.5 px-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-medium text-slate-300">
              {loading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="py-4 px-4"><div className="h-3.5 bg-slate-800 rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-slate-600" />
                      <span className="font-semibold">No se encontraron notas de pago.</span>
                    </div>
                  </td>
                </tr>
              ) : rows.map((row, i) => (
                <tr key={i} className="hover:bg-[#0c162b]/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-mono font-bold text-white text-[11px]">{row.expediente}</p>
                    <p className="text-[9px] text-slate-500">{row.num_doc}</p>
                  </td>
                  <td className="py-3.5 px-4 max-w-[180px]">
                    <p className="font-semibold text-slate-200 truncate" title={row.proveedor_nombre || row.benefici}>
                      {row.proveedor_nombre || row.benefici || '—'}
                    </p>
                    {row.ruc && <p className="text-[10px] text-slate-500 font-mono">{row.ruc}</p>}
                  </td>
                  <td className="py-3.5 px-4 max-w-[200px]">
                    <p className="text-slate-400 truncate text-[10px]" title={row.glosa}>{row.glosa || '—'}</p>
                    <p className="text-[9px] text-slate-600">{row.cod_doc}</p>
                  </td>
                  <td className="py-3.5 px-3 text-slate-400 text-[10px] whitespace-nowrap">{row.fecha_doc}</td>
                  <td className="py-3.5 px-4 max-w-[180px]">
                    {row.const_pago && (
                      <p className="text-[10px] text-slate-400 truncate">CP: {row.const_pago}</p>
                    )}
                    {row.confor_doc && (
                      <p className="text-[9px] text-slate-600 truncate">{row.confor_doc} · {row.confor_fec}</p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">{fmt(row.monto)}</td>
                  <td className="py-3.5 px-3 text-center">
                    <span className={cn('inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold',
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
              Página {page} de {totalPages} · {total} notas
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
