'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ClipboardCheck, Search, FileSpreadsheet, RefreshCw, SlidersHorizontal, AlertTriangle, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface CertifRow {
  certif: string; secuencia: string; correlat: string; rubro: string;
  cod_doc: string; num_doc: string; fecha_doc: string;
  proveedor_ruc: string; proveedor_nombre: string;
  clasif: string; clasif_nombre: string;
  sec_func: string; meta_nombre: string;
  moneda: string; monto_orig: number; monto: number;
  fec_proc: string; etapa: string; tipo_reg: string;
  est_env: string; est_reg: string;
}

function CertificadosContent() {
  const searchParams = useSearchParams();
  const initialPrograma = searchParams.get('programa') || '';

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CertifRow[]>([]);
  const [, setTotalMonto] = useState(0);
  const [rubros, setRubros] = useState<{ codigo: string; nombre: string }[]>([]);
  const [filterRubro, setFilterRubro] = useState('');
  const [filterPrograma, setFilterPrograma] = useState(initialPrograma);
  const [search, setSearch] = useState('');

  // Handle URL change for programa
  useEffect(() => {
    setFilterPrograma(searchParams.get('programa') || '');
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRubro) params.append('rubro', filterRubro);
      if (filterPrograma) params.append('programa', filterPrograma);
      const res = await fetch(`/api/certificados?${params}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.rows ?? []);
        setTotalMonto(data.totalMonto ?? 0);
        if (data.rubros?.length) setRubros(data.rubros);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filterRubro, filterPrograma]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fmt = (v: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(v || 0);

  const filtered = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.proveedor_nombre.toLowerCase().includes(q) || r.proveedor_ruc.includes(q) ||
      r.certif.includes(q) || r.num_doc.includes(q);
  });

  const exportExcel = () => {
    const data = filtered.map(r => ({
      'N° Certificado': r.certif, 'Secuencia': r.secuencia,
      'Rubro': r.rubro, 'Código Doc.': r.cod_doc, 'N° Doc.': r.num_doc,
      'Fecha Doc.': r.fecha_doc, 'RUC': r.proveedor_ruc, 'Proveedor': r.proveedor_nombre,
      'Clasificador': r.clasif, 'Descripción': r.clasif_nombre,
      'Meta': r.sec_func, 'Nombre Meta': r.meta_nombre,
      'Monto (S/)': r.monto, 'Fecha Proceso': r.fec_proc,
      'Etapa': r.etapa, 'Estado Env.': r.est_env, 'Estado Reg.': r.est_reg,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Certificados');
    XLSX.writeFile(wb, `SWSiconis_Certificados_2026.xlsx`);
  };

  const etapaBadge = (etapa: string) => {
    const colors: Record<string, string> = {
      '3': 'bg-blue-900/40 text-blue-300 border-blue-800/30',
      '4': 'bg-emerald-900/40 text-emerald-300 border-emerald-800/30',
    };
    const labels: Record<string, string> = { '3': 'Certificado', '4': 'Comprometido' };
    return (
      <span className={cn('inline-flex px-2 py-0.5 rounded text-[10px] font-bold border', colors[etapa] ?? 'bg-slate-900/40 text-slate-400 border-slate-700')}>
        {labels[etapa] ?? etapa}
      </span>
    );
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#d40000] text-xs font-bold uppercase tracking-widest mb-1">
            <ClipboardCheck className="h-4 w-4" /> Módulo de Certificaciones
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">Certificados Presupuestales</h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Reservas presupuestales emitidas — Año 2026
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
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <SlidersHorizontal className="h-4 w-4 text-[#d40000]" /> Filtros
          </div>
          {filterPrograma && (
            <span className="flex items-center gap-1.5 text-[10px] bg-[#d40000]/15 text-[#d40000] border border-[#d40000]/30 font-bold px-2.5 py-1 rounded-lg animate-fade-in">
              Programa: {filterPrograma}
              <button onClick={() => setFilterPrograma('')} className="hover:text-white transition-colors font-black ml-1 text-xs">×</button>
            </span>
          )}
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
              <Search className="h-3 w-3" /> Buscar
            </label>
            <div className="relative">
              <input type="text" placeholder="Proveedor, RUC, N° certificado..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#d40000]/60 transition-all" />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs font-semibold">
        <span className="px-3 py-1.5 rounded-lg bg-slate-900/40 border border-slate-800 text-slate-400">
          {filtered.length} certificados
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-blue-950/30 border border-blue-900/30 text-blue-400">
          Total: {fmt(filtered.reduce((s, r) => s + r.monto, 0))}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#081020]/60 backdrop-blur-md shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/35 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-3.5 px-4">N° Certif.</th>
                <th className="py-3.5 px-4">Proveedor</th>
                <th className="py-3.5 px-4">Documento</th>
                <th className="py-3.5 px-4">Clasificador</th>
                <th className="py-3.5 px-3">Meta</th>
                <th className="py-3.5 px-4 text-right">Monto (S/)</th>
                <th className="py-3.5 px-3">Etapa</th>
                <th className="py-3.5 px-3">Estado</th>
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
                      <span className="font-semibold">No se encontraron certificados.</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((row, i) => (
                <tr key={i} className="hover:bg-[#0c162b]/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-white text-[11px]">{row.certif}</td>
                  <td className="py-3.5 px-4 max-w-[180px]">
                    <p className="font-semibold text-slate-200 truncate" title={row.proveedor_nombre}>{row.proveedor_nombre || '—'}</p>
                    {row.proveedor_ruc && <p className="text-[10px] text-slate-500 font-mono">{row.proveedor_ruc}</p>}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-mono text-[10px] text-slate-300">{row.cod_doc} {row.num_doc}</p>
                    <p className="text-[10px] text-slate-600">{row.fecha_doc}</p>
                  </td>
                  <td className="py-3.5 px-4 max-w-[160px]">
                    <p className="font-mono font-bold text-slate-400 text-[10px]">{row.clasif}</p>
                    <p className="text-[10px] text-slate-600 truncate" title={row.clasif_nombre}>{row.clasif_nombre}</p>
                  </td>
                  <td className="py-3.5 px-3">
                    <p className="font-mono text-[10px] text-slate-500">{row.sec_func}</p>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-400">{fmt(row.monto)}</td>
                  <td className="py-3.5 px-3">{etapaBadge(row.etapa)}</td>
                  <td className="py-3.5 px-3">
                    <span className={cn('inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold',
                      row.est_reg === 'A' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-800/60 text-slate-400'
                    )}>
                      {row.est_reg || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {!loading && filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-700/60 bg-slate-900/30 text-xs font-bold">
                  <td colSpan={5} className="py-3 px-4 text-slate-400 uppercase text-[10px] tracking-wider">
                    TOTAL · {filtered.length} registros
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-blue-400">
                    {fmt(filtered.reduce((s, r) => s + r.monto, 0))}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

export default function CertificadosPage() {
  return (
    <Suspense fallback={null}>
      <CertificadosContent />
    </Suspense>
  );
}
