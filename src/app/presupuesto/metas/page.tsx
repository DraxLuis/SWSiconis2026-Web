'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  AlertTriangle,
  Database,
  Search,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  exportEjecucionMetas,
  exportEjecucionMetasClasificador,
  exportCertificados,
  exportDevengados,
  exportGiros,
  exportGirosConGlosa
} from '@/lib/excel-exports';

interface MetaRow {
  sec_func: string;
  act_proy: string;
  componente: string;
  funcion: string;
  programa: string;
  meta_nombre: string;
  finalidad_nombre: string;
  act_proy_nombre: string;
  unidmed: string;
  cantidad: number;
  pia: number;
  pim: number;
  certif: number;
  comprometido: number;
  devengado: number;
  girado: number;
}

interface ClasificadorReportRow {
  codigo?: string;
  meta_codigo?: string;
  nombre?: string;
  meta_nombre?: string;
  pia?: number;
  modif?: number;
  pim?: number;
  certif?: number;
  cpanua?: number;
  atcp?: number;
  devengado?: number;
  girado?: number;
  saldo?: number;
  avance?: number;
}

interface CertificadoReportRow {
  ano_eje?: string;
  sec_ejec?: string;
  certif: string;
  secuencia: string;
  correlat: string;
  rubro: string;
  cod_doc: string;
  num_doc: string;
  fecha_doc: string;
  clasif: string;
  clasif_nombre: string;
  sec_func: string;
  meta_nombre: string;
  monto: number;
  fec_proc: string;
  tipo_reg: string;
  est_env?: string;
  est_reg?: string;
}

interface DevengadoReportRow {
  ano_eje?: string;
  mes_eje: string;
  expediente: string;
  tipo_op: string;
  sec_reg: string;
  corr: string;
  rb: string;
  tr: string;
  cod_doc: string;
  num_doc: string;
  fecha_doc: string;
  proveedor_ruc: string;
  proveedor_nombre: string;
  clasificad: string;
  clasif_nombre: string;
  sec_func: string;
  meta_nombre: string;
  monto: number;
  fec_aprob: string;
  estado: string;
  certif: string;
  certif_sec: string;
  glosa?: string;
}

interface GiroReportRow {
  ano?: string;
  mes: string;
  expediente: string;
  tipo: string;
  c: string;
  f: string;
  secuen: string;
  corr: string;
  rb: string;
  tr: string;
  cod: string;
  num_doc: string;
  fecha_doc: string;
  tp?: string;
  tc?: string;
  ano_banco?: string;
  banco?: string;
  cta_cte?: string;
  beneficiario: string;
  clasificad: string;
  sec_func: string;
  tipo_gir?: string;
  cod_b?: string;
  num_doc_b?: string;
  fec_doc_b?: string;
  monto: number;
  fec_aprob: string;
  sec_est?: string;
  est_reg: string;
  certif: string;
  certif_sec: string;
  glosa?: string;
}

const formatMoney = (val: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);

const formatPercent = (val: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val * 100) + '%';

export default function MetasPage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [rows, setRows] = useState<MetaRow[]>([]);
  const [selectedRow, setSelectedRow] = useState<MetaRow | null>(null);
  
  // Filters list from API
  const [rubros, setRubros] = useState<{ codigo: string; nombre: string }[]>([]);
  const [funciones, setFunciones] = useState<string[]>([]);
  
  // Selected filters
  const [filterRubro, setFilterRubro] = useState('');
  const [filterFuncion, setFilterFuncion] = useState('');

  // Search & Pagination states
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  // Reset page when filters or search change
  useEffect(() => {
    setPage(1);
  }, [search, filterRubro, filterFuncion]);

  // Fetch metas from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRubro) params.append('rubro', filterRubro);
      if (filterFuncion) params.append('funcion', filterFuncion);

      const res = await fetch(`/api/metas?${params}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.rows || []);
        if (data.rubros) setRubros(data.rubros);
        if (data.funciones) setFunciones(data.funciones);

        // Auto-select first row or preserve selection
        if (data.rows.length > 0) {
          const match = data.rows.find((r: MetaRow) => r.sec_func === selectedRow?.sec_func);
          if (match) {
            setSelectedRow(match);
          } else {
            setSelectedRow(data.rows[0]);
          }
        } else {
          setSelectedRow(null);
        }
      }
    } catch (e) {
      console.error('Error fetching metas:', e);
    } finally {
      setLoading(false);
    }
  }, [filterRubro, filterFuncion, selectedRow?.sec_func]);

  // Client-side search filter
  const filteredRows = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.sec_func.toLowerCase().includes(q) ||
      r.meta_nombre.toLowerCase().includes(q) ||
      (r.act_proy && r.act_proy.toLowerCase().includes(q)) ||
      (r.act_proy_nombre && r.act_proy_nombre.toLowerCase().includes(q)) ||
      (r.finalidad_nombre && r.finalidad_nombre.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE) || 1;
  const displayRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Auto-select first row of displayRows if current selection is not visible
  useEffect(() => {
    if (displayRows.length > 0) {
      const match = displayRows.find(r => r.sec_func === selectedRow?.sec_func);
      if (!match) {
        setSelectedRow(displayRows[0]);
      }
    } else {
      setSelectedRow(null);
    }
  }, [page, search, rows, displayRows, selectedRow?.sec_func]);

  useEffect(() => {
    fetchData();
  }, [filterRubro, filterFuncion, fetchData]);

  // General exports
  const handleExportMetas = async () => {
    setExporting(true);
    try {
      // We map our current rows to EjecucionRow format
      const mapped = filteredRows.map(r => ({
        codigo: r.sec_func,
        nombre: r.meta_nombre,
        pia: r.pia,
        modif: r.pim - r.pia,
        pim: r.pim,
        certif: r.certif,
        cpanua: r.comprometido,
        atcp: 0,
        devengado: r.devengado,
        girado: r.girado,
        saldo: r.pim - r.devengado,
        avance: r.pim > 0 ? (r.devengado / r.pim) : 0
      }));
      exportEjecucionMetas(mapped, 'ejecucion-metas.xlsx');
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const handleExportMetasClasif = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/excel-reportes?type=ejecucion_metas_clasificador`);
      const data = await res.json();
      if (data.success && data.rows) {
        // Map keys to match the casing expected by the exporter
        const mapped = data.rows.map((r: ClasificadorReportRow) => ({
          codigo: r.codigo,
          meta_codigo: r.meta_codigo,
          nombre: r.nombre,
          meta_nombre: r.meta_nombre,
          pia: r.pia,
          modif: r.modif,
          pim: r.pim,
          certif: r.certif,
          cpanua: r.cpanua,
          atcp: r.atcp,
          devengado: r.devengado,
          girado: r.girado,
          saldo: r.saldo,
          avance: r.avance
        }));
        exportEjecucionMetasClasificador(mapped, 'ejecucion_metas_clasificador.xlsx');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  // Selected Meta Exports
  const handleExportSelected = async (actionType: 'certificados' | 'devengados' | 'giros' | 'giros_glosa') => {
    if (!selectedRow) return;
    setExporting(true);
    try {
      if (actionType === 'certificados') {
        const res = await fetch('/api/excel-reportes?type=meta_certificados');
        const data = await res.json();
        if (data.success && data.rows) {
          const filtered = data.rows
            .filter((c: CertificadoReportRow) => c.sec_func === selectedRow.sec_func)
            .map((c: CertificadoReportRow) => ({
              ano_eje: c.ano_eje,
              sec_ejec: c.sec_ejec,
              certif: c.certif,
              secuencia: c.secuencia,
              correlat: c.correlat,
              rubro: c.rubro,
              cod_doc: c.cod_doc,
              num_doc: c.num_doc,
              fecha_doc: c.fecha_doc,
              clasif: c.clasif,
              clasif_nombre: c.clasif_nombre,
              sec_func: c.sec_func,
              meta_nombre: c.meta_nombre,
              monto: c.monto,
              fec_proc: c.fec_proc,
              tipo_reg: c.tipo_reg,
              est_env: c.est_env,
              est_reg: c.est_reg
            }));
          exportCertificados(selectedRow.sec_func, selectedRow.meta_nombre, filtered, `certificados_meta_${selectedRow.sec_func}.xlsx`);
        }
      } else if (actionType === 'devengados') {
        const res = await fetch('/api/excel-reportes?type=meta_devengados');
        const data = await res.json();
        if (data.success && data.rows) {
          const filtered = data.rows
            .filter((d: DevengadoReportRow) => d.sec_func === selectedRow.sec_func)
            .map((d: DevengadoReportRow) => ({
              ano_eje: d.ano_eje,
              mes_eje: d.mes_eje,
              expediente: d.expediente,
              tipo_op: d.tipo_op,
              sec_reg: d.sec_reg,
              corr: d.corr,
              rb: d.rb,
              tr: d.tr,
              cod_doc: d.cod_doc,
              num_doc: d.num_doc,
              fecha_doc: d.fecha_doc,
              proveedor_ruc: d.proveedor_ruc,
              proveedor_nombre: d.proveedor_nombre,
              clasificad: d.clasificad,
              clasif_nombre: d.clasif_nombre,
              sec_func: d.sec_func,
              meta_nombre: d.meta_nombre,
              monto: d.monto,
              fec_aprob: d.fec_aprob,
              estado: d.estado,
              certif: d.certif,
              certif_sec: d.certif_sec,
              glosa: d.glosa
            }));
          exportDevengados(selectedRow.sec_func, selectedRow.meta_nombre, filtered, `devengados_meta_${selectedRow.sec_func}.xlsx`);
        }
      } else if (actionType === 'giros' || actionType === 'giros_glosa') {
        const res = await fetch('/api/excel-reportes?type=data_girados');
        const data = await res.json();
        if (data.success && data.rows) {
          const filtered = data.rows
            .filter((g: GiroReportRow) => g.sec_func && g.sec_func.substring(0, 4) === selectedRow.sec_func)
            .map((g: GiroReportRow) => ({
              ano_eje: g.ano || '2026',
              mes_eje: g.mes,
              expediente: g.expediente,
              tipo_op: g.tipo,
              sec_reg: g.secuen,
              corr: g.corr,
              rb: g.rb,
              tr: g.tr,
              cod_doc: g.cod,
              num_doc: g.num_doc,
              fecha_doc: g.fecha_doc,
              proveedor_ruc: '',
              proveedor_nombre: g.beneficiario,
              clasificad: g.clasificad,
              clasif_nombre: '',
              sec_func: g.sec_func,
              meta_nombre: '',
              monto: g.monto,
              fec_aprob: g.fec_aprob,
              estado: g.est_reg,
              certif: g.certif,
              certif_sec: g.certif_sec,
              glosa: g.glosa || ''
            }));
          if (actionType === 'giros') {
            exportGiros(selectedRow.sec_func, selectedRow.meta_nombre, filtered, `giros_meta_${selectedRow.sec_func}.xlsx`);
          } else {
            exportGirosConGlosa(selectedRow.sec_func, selectedRow.meta_nombre, filtered, `giros_glosa_meta_${selectedRow.sec_func}.xlsx`);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  // Totals calculations
  const totals = filteredRows.reduce((sums, r) => {
    return {
      pia: sums.pia + r.pia,
      pim: sums.pim + r.pim,
      devengado: sums.devengado + r.devengado,
      saldo: sums.saldo + (r.pim - r.devengado)
    };
  }, { pia: 0, pim: 0, devengado: 0, saldo: 0 });

  const totalAvance = totals.pim > 0 ? (totals.devengado / totals.pim) : 0;

  return (
    <div className="w-full space-y-6">
      {/* Outer VFP Window Wrapper with Double Border effect */}
      <div className="w-full rounded-xl border border-slate-700 p-0.5 bg-slate-900 shadow-2xl">
        <div className="w-full rounded-lg border border-slate-800 bg-[#070e1b] overflow-hidden flex flex-col">
          
          {/* Window Top Title / Metadata Banner */}
          <div className="bg-[#0c1938] border-b border-slate-700 px-4 py-2 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
                Consulta de Metas
              </span>
            </div>
            <div className="text-xs font-bold text-[#3b82f6] bg-blue-950/40 border border-blue-900/60 rounded px-2.5 py-0.5">
              301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA
            </div>
          </div>

          {/* Golden Yellow Banner */}
          <div className="bg-[#fef3c7] text-[#92400e] px-4 py-2.5 flex items-center justify-between shadow-sm select-none">
            <h2 className="font-extrabold text-sm tracking-wide uppercase flex items-center gap-2">
              Ejecución Presupuestal - Consulta por Metas - Año 2026
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExportMetas}
                disabled={loading || rows.length === 0 || exporting}
                className="flex items-center gap-1.5 text-[11px] font-black bg-[#92400e] hover:bg-[#b45309] text-white rounded px-3 py-1 transition-all disabled:opacity-40"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Ejecucion Metas
              </button>
              <button 
                onClick={handleExportMetasClasif}
                disabled={loading || rows.length === 0 || exporting}
                className="flex items-center gap-1.5 text-[11px] font-black bg-[#92400e] hover:bg-[#b45309] text-white rounded px-3 py-1 transition-all disabled:opacity-40"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Ejec. Metas-Clasif.
              </button>
              <button 
                onClick={fetchData}
                disabled={loading || exporting}
                className="flex items-center gap-1 text-[11px] font-bold bg-[#92400e]/20 hover:bg-[#92400e]/30 text-[#92400e] rounded px-2.5 py-1 transition-all"
              >
                <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
                Recargar
              </button>
            </div>
          </div>

          {/* Toolbar & Filters */}
          <div className="p-4 bg-[#0a1426] border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Rubro Dropdown */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <span>Rubro:</span>
                <select 
                  value={filterRubro} 
                  onChange={e => setFilterRubro(e.target.value)}
                  className="bg-[#070e1b] border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-[11px] max-w-[200px]"
                >
                  <option value="">Todos los Rubros</option>
                  {rubros.map(r => (
                    <option key={r.codigo} value={r.codigo}>{r.codigo} - {r.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Función Dropdown */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <span>Función:</span>
                <select 
                  value={filterFuncion} 
                  onChange={e => setFilterFuncion(e.target.value)}
                  className="bg-[#070e1b] border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                >
                  <option value="">Todas las Funciones</option>
                  {funciones.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative w-full md:w-72 select-text">
              <input
                type="text"
                placeholder="Buscar por código, nombre..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded pl-8 pr-8 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500 select-none pointer-events-none" />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2 text-slate-500 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Metas Table Grid */}
          <div className="w-full max-w-full overflow-x-auto bg-[#080f1d] min-h-[350px]">
            <table className="min-w-[1000px] w-full text-left border-collapse table-fixed">
              <thead className="sticky top-0 bg-[#0c182e] border-b border-slate-700 text-slate-400 text-[10px] uppercase font-black tracking-wider z-20 select-none">
                <tr>
                  <th className="py-2.5 px-3 w-[35px]"></th>
                  <th className="py-2.5 px-2 w-[80px] text-center">Meta</th>
                  <th className="py-2.5 px-3 w-[300px]">Nombre / Descripción de la Meta</th>
                  <th className="py-2.5 px-3 text-right w-[110px]">PIA</th>
                  <th className="py-2.5 px-3 text-right w-[110px]">PIM</th>
                  <th className="py-2.5 px-3 text-right w-[110px]">Devengado</th>
                  <th className="py-2.5 px-3 text-right w-[110px]">Saldo</th>
                  <th className="py-2.5 px-3 text-center w-[80px]">Avance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs font-semibold text-slate-300">
                {loading ? (
                  Array.from({ length: 8 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td colSpan={8} className="py-3 px-4">
                        <div className="h-4 bg-slate-800 rounded w-full" />
                      </td>
                    </tr>
                  ))
                ) : displayRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-slate-500 font-bold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertTriangle className="h-8 w-8 text-slate-600" />
                        <span>No se encontraron metas registradas con los filtros seleccionados.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayRows.map((r) => {
                    const isSelected = selectedRow?.sec_func === r.sec_func;
                    const saldo = r.pim - r.devengado;
                    const avance = r.pim > 0 ? (r.devengado / r.pim) : 0;
                    return (
                      <tr 
                        key={r.sec_func}
                        onClick={() => setSelectedRow(r)}
                        className={cn(
                          "cursor-pointer transition-all select-none",
                          isSelected 
                            ? "bg-amber-400 text-slate-950 font-bold" 
                            : "even:bg-[#070e1a]/50 text-slate-300 hover:bg-[#112240]"
                        )}
                      >
                        <td className="py-2 px-1 text-center font-black">
                          {isSelected && <span className="text-red-600">▶</span>}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-[11px] font-bold">{r.sec_func}</td>
                        <td className="py-2 px-3 truncate" title={r.meta_nombre}>{r.meta_nombre}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatMoney(r.pia)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">{formatMoney(r.pim)}</td>
                        <td className={cn("py-2 px-3 text-right font-mono font-bold", isSelected ? "text-slate-950" : "text-emerald-400")}>
                          {formatMoney(r.devengado)}
                        </td>
                        <td className={cn("py-2 px-3 text-right font-mono", isSelected ? "text-slate-950" : "text-slate-400")}>
                          {formatMoney(saldo)}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold">
                          {formatPercent(avance)}
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Consolidated TOTALS row */}
                {!loading && filteredRows.length > 0 && (
                  <tr className="bg-[#0b1c36] text-slate-100 font-extrabold border-t border-slate-700">
                    <td className="py-2 px-1 text-center"></td>
                    <td className="py-2 px-2 text-center"></td>
                    <td className="py-2 px-3 text-center uppercase tracking-widest text-[10px] text-slate-400">T o t a l e s</td>
                    <td className="py-2 px-3 text-right font-mono">{formatMoney(totals.pia)}</td>
                    <td className="py-2 px-3 text-right font-mono text-amber-400">{formatMoney(totals.pim)}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-400">{formatMoney(totals.devengado)}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-300">{formatMoney(totals.saldo)}</td>
                    <td className="py-2 px-3 text-center font-mono text-amber-400">{formatPercent(totalAvance)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {!loading && filteredRows.length > PAGE_SIZE && (
            <div className="bg-[#0a1426] border-t border-slate-800 px-6 py-2.5 flex items-center justify-between select-none">
              <div className="text-xs text-slate-400 font-mono">
                Mostrando <span className="font-extrabold text-white">{Math.min(filteredRows.length, (page - 1) * PAGE_SIZE + 1)}-{Math.min(filteredRows.length, page * PAGE_SIZE)}</span> de <span className="font-extrabold text-white">{filteredRows.length}</span> metas
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-[#070e1b] border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white disabled:opacity-35 disabled:cursor-not-allowed text-xs font-bold rounded flex items-center gap-1 transition-all"
                >
                  &lt; Anterior
                </button>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-[#070e1b] border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white disabled:opacity-35 disabled:cursor-not-allowed text-xs font-bold rounded flex items-center gap-1 transition-all"
                >
                  Siguiente &gt;
                </button>
              </div>
            </div>
          )}

          {/* Lower Panel: Selected Row Detail (Bottom Left) & Bottom Actions */}
          <div className="bg-[#0a1426] border-t border-slate-800 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch select-none">
            
            {/* Selected Meta Detailed Box (8 cols) */}
            <div className="lg:col-span-8 flex flex-col border border-slate-800 rounded-lg p-3.5 bg-[#080f1d] text-xs space-y-2">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800/60 pb-1.5">
                <Database className="h-3.5 w-3.5 text-blue-500" />
                Especificaciones de la Meta Seleccionada
              </div>
              {selectedRow ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 text-slate-300 font-mono text-[11px] leading-relaxed">
                  <div className="md:col-span-2 text-slate-500 font-bold">CÓDIGO:</div>
                  <div className="md:col-span-10 text-white font-extrabold">{selectedRow.sec_func}</div>
                  
                  <div className="md:col-span-2 text-slate-500 font-bold">DESCRIPCIÓN:</div>
                  <div className="md:col-span-10 text-slate-200">{selectedRow.meta_nombre}</div>

                  <div className="md:col-span-2 text-slate-500 font-bold">PROYECTO/ACT:</div>
                  <div className="md:col-span-10 text-slate-200">
                    <span className="font-extrabold text-[#f59e0b]">{selectedRow.act_proy}</span> — {selectedRow.act_proy_nombre}
                  </div>

                  <div className="md:col-span-2 text-slate-500 font-bold">FINALIDAD:</div>
                  <div className="md:col-span-10 text-slate-200">{selectedRow.finalidad_nombre || '—'}</div>

                  <div className="md:col-span-2 text-slate-500 font-bold">UNID. MEDIDA:</div>
                  <div className="md:col-span-4 text-slate-200">{selectedRow.unidmed}</div>

                  <div className="md:col-span-2 text-slate-500 font-bold md:text-right">CANTIDAD:</div>
                  <div className="md:col-span-4 text-[#f59e0b] font-extrabold">
                    {selectedRow.cantidad.toLocaleString('es-PE')}
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-center py-6 font-bold">
                  Seleccione una meta en la tabla superior para ver su información detallada.
                </div>
              )}
            </div>

            {/* Bottom Actions Panel (4 cols) */}
            <div className="lg:col-span-4 flex flex-col justify-between border border-slate-800 rounded-lg p-3.5 bg-[#080f1d] space-y-3">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/60 pb-1.5">
                Reportes por Meta Seleccionada
              </div>
              <div className="grid grid-cols-2 gap-2 flex-1 items-center">
                <button
                  onClick={() => handleExportSelected('certificados')}
                  disabled={!selectedRow || exporting}
                  className="w-full flex items-center justify-center gap-1.5 text-[11px] font-bold py-2 px-2.5 rounded border border-blue-900 bg-blue-950/40 hover:bg-blue-900/40 text-blue-400 hover:text-blue-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Certificados
                </button>
                <button
                  onClick={() => handleExportSelected('devengados')}
                  disabled={!selectedRow || exporting}
                  className="w-full flex items-center justify-center gap-1.5 text-[11px] font-bold py-2 px-2.5 rounded border border-emerald-900 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 hover:text-emerald-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Devengados
                </button>
                <button
                  onClick={() => handleExportSelected('giros')}
                  disabled={!selectedRow || exporting}
                  className="w-full flex items-center justify-center gap-1.5 text-[11px] font-bold py-2 px-2.5 rounded border border-amber-900 bg-amber-950/40 hover:bg-amber-900/40 text-amber-400 hover:text-amber-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Giros
                </button>
                <button
                  onClick={() => handleExportSelected('giros_glosa')}
                  disabled={!selectedRow || exporting}
                  className="w-full flex items-center justify-center gap-1.5 text-[11px] font-bold py-2 px-2.5 rounded border border-purple-900 bg-purple-950/40 hover:bg-purple-900/40 text-purple-400 hover:text-purple-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Con Glosa
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
