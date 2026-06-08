'use client';

import { useState, useEffect, useCallback, Fragment, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  TrendingDown,
  Search,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { PageHeader } from '@/components/ui/page-header';

interface GastoRow {
  rubro: string; rubro_nombre: string;
  clasificador: string; clasificador_nombre: string;
  pia: number; pim: number; certificado: number; comprometido: number;
  devengado_total: number; girado_total: number;
  dev_01: number; dev_02: number; dev_03: number; dev_04: number;
  dev_05: number; dev_06: number; dev_07: number; dev_08: number;
  dev_09: number; dev_10: number; dev_11: number; dev_12: number;
  gir_01: number; gir_02: number; gir_03: number; gir_04: number;
  gir_05: number; gir_06: number; gir_07: number; gir_08: number;
  gir_09: number; gir_10: number; gir_11: number; gir_12: number;
}

interface RubroOption { codigo: string; nombre: string; }

const formatMoney = (val: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency', currency: 'PEN', minimumFractionDigits: 2,
  }).format(val || 0);

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'];

function GastosContent() {
  const searchParams = useSearchParams();
  const initialPrograma = searchParams.get('programa') || '';

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<GastoRow[]>([]);
  const [rubrosList, setRubrosList] = useState<RubroOption[]>([]);
  const [filterRubro, setFilterRubro] = useState('');
  const [filterClasificador, setFilterClasificador] = useState('');
  const [filterPrograma, setFilterPrograma] = useState(initialPrograma);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterOpen, setFilterOpen] = useState(true);

  // Sync filterPrograma when URL changes
  useEffect(() => {
    setFilterPrograma(searchParams.get('programa') || '');
  }, [searchParams]);

  const fetchGastos = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/gastos';
      const params = new URLSearchParams();
      if (filterRubro) params.append('rubro', filterRubro);
      if (filterClasificador) params.append('clasificador', filterClasificador);
      if (filterPrograma) params.append('programa', filterPrograma);
      if (params.toString()) url += `?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRows(data.rows || []);
        if (data.rubros && rubrosList.length === 0) setRubrosList(data.rubros);
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  }, [filterRubro, filterClasificador, filterPrograma, rubrosList.length]);

  useEffect(() => { fetchGastos(); setCurrentPage(1); }, [fetchGastos]);

  const filteredRows = rows.filter((row) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      row.clasificador.toLowerCase().includes(q) ||
      (row.clasificador_nombre && row.clasificador_nombre.toLowerCase().includes(q)) ||
      (row.rubro_nombre && row.rubro_nombre.toLowerCase().includes(q))
    );
  });

  const totals = filteredRows.reduce(
    (acc, row) => {
      acc.pia += row.pia || 0;
      acc.pim += row.pim || 0;
      acc.certificado += row.certificado || 0;
      acc.comprometido += row.comprometido || 0;
      acc.devengado_total += row.devengado_total || 0;
      acc.girado_total += row.girado_total || 0;
      return acc;
    },
    { pia: 0, pim: 0, certificado: 0, comprometido: 0, devengado_total: 0, girado_total: 0 }
  );

  const totalRecords = filteredRows.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + pageSize);

  const toggleRow = (id: string) =>
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  const exportToExcel = () => {
    const data = filteredRows.map((row) => ({
      'Rubro': row.rubro, 'Nombre Rubro': row.rubro_nombre || '',
      'Clasificador': row.clasificador, 'Nombre Clasificador': row.clasificador_nombre || '',
      'PIA (S/)': row.pia, 'PIM (S/)': row.pim,
      'Certificado (S/)': row.certificado, 'Comprometido (S/)': row.comprometido,
      'Devengado Total (S/)': row.devengado_total, 'Girado Total (S/)': row.girado_total,
      'Avance Dev. (%)': row.pim > 0 ? ((row.devengado_total / row.pim) * 100).toFixed(2) : '0.00',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ejecución Gastos');
    XLSX.writeFile(wb, `SWSiconis_Gastos_${new Date().getFullYear()}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <PageHeader
        sectionLabel="Módulo de Presupuesto"
        icon={TrendingDown}
        title="Ejecución de Gastos"
        description="Seguimiento detallado de PIA, PIM, Certificaciones y evolución mensual de Devengados y Girados."
        actions={
          <>
            <button
              onClick={exportToExcel}
              disabled={loading || filteredRows.length === 0}
              className="btn-excel"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Exportar Excel
            </button>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={cn('btn-secondary', filterOpen && 'border-[#D40000]/40 text-white')}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros
            </button>
            <button onClick={fetchGastos} className="btn-secondary p-2">
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin-smooth')} />
            </button>
          </>
        }
      />

      {/* Filter Panel */}
      {filterOpen && (
        <div className="filter-panel animate-fade-in space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.04] pb-2">
            <span className="text-[10px] font-800 uppercase tracking-widest text-[#4A6080]">Criterios de Selección</span>
            {filterPrograma && (
              <span className="flex items-center gap-1.5 text-[10px] bg-[#d40000]/15 text-[#d40000] border border-[#d40000]/30 font-bold px-2.5 py-1 rounded-lg">
                Programa: {filterPrograma}
                <button onClick={() => setFilterPrograma('')} className="hover:text-white transition-colors font-black ml-1 text-xs">×</button>
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-700 uppercase tracking-widest text-[#4A6080]">
                <Layers className="h-3 w-3" /> Rubro
              </label>
              <select
                value={filterRubro}
                onChange={(e) => setFilterRubro(e.target.value)}
                className="form-select"
              >
                <option value="">Todos los Rubros</option>
                {rubrosList.map((r) => (
                  <option key={r.codigo} value={r.codigo}>
                    {r.codigo} — {r.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-700 uppercase tracking-widest text-[#4A6080]">
                <Layers className="h-3 w-3" /> Clasificador (Prefijo)
              </label>
              <input
                type="text"
                placeholder="Ej: 2.6 o 2.3..."
                value={filterClasificador}
                onChange={(e) => setFilterClasificador(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-700 uppercase tracking-widest text-[#4A6080]">
                <Search className="h-3 w-3" /> Búsqueda por Nombre
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar clasificador o descripción..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input pl-8"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#4A6080]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
        {[
          { label: 'PIM Total', value: totals.pim,              color: '#1565C0' },
          { label: 'Certificado', value: totals.certificado,    color: '#7C3AED' },
          { label: 'Devengado', value: totals.devengado_total,  color: '#D40000' },
          { label: '% Avance Dev.',
            value: totals.pim > 0 ? (totals.devengado_total / totals.pim) * 100 : 0,
            color: '#10B981', isPercent: true,
            progress: totals.pim > 0 ? (totals.devengado_total / totals.pim) * 100 : 0 },
        ].map((item) => (
          <div key={item.label} className="kpi-card !p-4">
            <p className="text-[9px] font-800 uppercase tracking-widest text-[#4A6080] mb-1.5">{item.label}</p>
            {(item as { isPercent?: boolean }).isPercent ? (
              <>
                <p className="text-lg font-black tabular-nums" style={{ color: item.color }}>
                  {item.value.toFixed(1)}%
                </p>
                <div className="progress-bar-track mt-2">
                  <div className="progress-bar-fill green" style={{ width: `${Math.min(item.value, 100)}%` }} />
                </div>
              </>
            ) : (
              <p className="text-base font-black tabular-nums" style={{ color: item.color }}>
                {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(item.value)}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#061526]/70 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10 text-center">
                  <button
                    onClick={() => {
                      const allExp = paginatedRows.every(r => expandedRows[`${r.rubro}-${r.clasificador}`]);
                      if (allExp) {
                        setExpandedRows({});
                      } else {
                        const next: Record<string, boolean> = {};
                        paginatedRows.forEach(r => { next[`${r.rubro}-${r.clasificador}`] = true; });
                        setExpandedRows(next);
                      }
                    }}
                    className="p-1 rounded-md bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
                    title="Expandir/Contraer todos"
                  >
                    <ChevronDown className="h-3.5 w-3.5 text-[#4A6080]" />
                  </button>
                </th>
                <th className="w-14 text-center">Rubro</th>
                <th className="w-32">Clasificador</th>
                <th>Descripción</th>
                <th className="text-right">PIA</th>
                <th className="text-right">PIM</th>
                <th className="text-right">Certif.</th>
                <th className="text-right">Devengado</th>
                <th className="text-right">Girado</th>
                <th className="text-center w-28">% Avance</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((__, j) => (
                      <td key={j}><div className="skeleton h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-[#2A3A50]">
                      <AlertTriangle className="h-10 w-10" />
                      <p className="text-sm font-semibold">No se encontraron registros de ejecución de gastos.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const rowId = `${row.rubro}-${row.clasificador}`;
                  const isExpanded = !!expandedRows[rowId];
                  const avance = row.pim > 0 ? (row.devengado_total / row.pim) * 100 : 0;

                  return (
                    <Fragment key={rowId}>
                      <tr
                        className={cn(
                          'cursor-pointer transition-colors duration-150',
                          isExpanded && 'bg-white/[0.03] border-l-2 border-[#D40000]'
                        )}
                        onClick={() => toggleRow(rowId)}
                      >
                        <td className="text-center">
                          <span className="p-1 rounded hover:bg-white/10 transition-colors inline-flex">
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5 text-[#D40000]" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-[#4A6080]" />
                            )}
                          </span>
                        </td>
                        <td className="text-center font-bold text-[#4A6080]">{row.rubro}</td>
                        <td className="font-mono font-bold text-white tracking-wider text-[11px]">{row.clasificador}</td>
                        <td className="max-w-[220px]" title={row.clasificador_nombre}>
                          <p className="font-semibold text-[#D0D8E8] truncate text-[11px]">
                            {row.clasificador_nombre || 'Sin especificación'}
                          </p>
                          <p className="text-[9px] text-[#4A6080] truncate">{row.rubro_nombre}</p>
                        </td>
                        <td className="text-right font-mono text-[11px] text-[#4A6080]">{formatMoney(row.pia)}</td>
                        <td className="text-right font-mono font-semibold text-[11px] text-white">{formatMoney(row.pim)}</td>
                        <td className="text-right font-mono text-[11px] text-purple-400">{formatMoney(row.certificado)}</td>
                        <td className="text-right font-mono font-semibold text-[11px] text-red-400">{formatMoney(row.devengado_total)}</td>
                        <td className="text-right font-mono text-[11px] text-emerald-400">{formatMoney(row.girado_total)}</td>
                        <td className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold font-mono text-[11px] text-white">{avance.toFixed(1)}%</span>
                            <div className="w-16 progress-bar-track">
                              <div
                                className={cn(
                                  'progress-bar-fill',
                                  avance >= 75 ? 'green' : avance >= 40 ? 'orange' : 'red'
                                )}
                                style={{ width: `${Math.min(avance, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={10} className="p-0 bg-[#020B18]/60">
                            <div className="p-5 space-y-4 animate-fade-in">
                              <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
                                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#94A3B8] flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-[#D40000]" />
                                  Distribución Mensual — Rubro {row.rubro} / {row.clasificador}
                                </h4>
                                <span className="text-[9px] text-[#4A6080] font-semibold">
                                  {row.clasificador_nombre}
                                </span>
                              </div>

                              {/* Monthly table */}
                              <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-[#03101F]/60">
                                <table className="w-full min-w-[780px] border-collapse text-[10px]">
                                  <thead>
                                    <tr className="border-b border-white/[0.06]">
                                      <th className="py-2.5 px-3 text-left font-bold text-[#4A6080] uppercase tracking-wider w-24">Concepto</th>
                                      {MONTHS.map((m) => (
                                        <th key={m} className="py-2.5 px-2 text-right font-bold text-[#4A6080]">{m}</th>
                                      ))}
                                      <th className="py-2.5 px-3 text-right font-bold text-[#94A3B8]">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="font-mono">
                                    <tr className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                                      <td className="py-2.5 px-3 font-sans font-bold text-red-400">Devengado</td>
                                      {([1,2,3,4,5,6,7,8,9,10,11,12] as const).map((m) => (
                                        <td key={m} className="py-2.5 px-2 text-right text-[#4A6080]">
                                          {formatMoney(row[`dev_${String(m).padStart(2,'0')}` as keyof GastoRow] as number)}
                                        </td>
                                      ))}
                                      <td className="py-2.5 px-3 text-right font-bold text-red-400 bg-red-950/10">
                                        {formatMoney(row.devengado_total)}
                                      </td>
                                    </tr>
                                    <tr className="hover:bg-white/[0.02]">
                                      <td className="py-2.5 px-3 font-sans font-bold text-emerald-400">Girado</td>
                                      {([1,2,3,4,5,6,7,8,9,10,11,12] as const).map((m) => (
                                        <td key={m} className="py-2.5 px-2 text-right text-[#4A6080]">
                                          {formatMoney(row[`gir_${String(m).padStart(2,'0')}` as keyof GastoRow] as number)}
                                        </td>
                                      ))}
                                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400 bg-emerald-950/10">
                                        {formatMoney(row.girado_total)}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              {/* Detail cards */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] flex justify-between items-center">
                                  <div>
                                    <p className="text-[9px] uppercase tracking-widest font-bold text-[#4A6080]">Saldo por Devengar</p>
                                    <p className="font-mono font-bold text-[#D40000] mt-0.5">
                                      {formatMoney(row.pim - row.devengado_total)}
                                    </p>
                                  </div>
                                  <span className="text-[9px] text-[#4A6080] font-semibold">PIM − Devengado</span>
                                </div>
                                <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] flex justify-between items-center">
                                  <div>
                                    <p className="text-[9px] uppercase tracking-widest font-bold text-[#4A6080]">Saldo por Comprometer</p>
                                    <p className="font-mono font-bold text-white mt-0.5">
                                      {formatMoney(row.pim - row.certificado)}
                                    </p>
                                  </div>
                                  <span className="text-[9px] text-[#4A6080] font-semibold">PIM − Certif.</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>

            {/* Totals row */}
            {!loading && filteredRows.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={4} className="font-sans font-extrabold uppercase tracking-wide text-[#94A3B8] text-[10px]">
                    Total Consolidado ({totalRecords} registros)
                  </td>
                  <td className="text-right font-mono">{formatMoney(totals.pia)}</td>
                  <td className="text-right font-mono text-white">{formatMoney(totals.pim)}</td>
                  <td className="text-right font-mono text-purple-400">{formatMoney(totals.certificado)}</td>
                  <td className="text-right font-mono text-red-400">{formatMoney(totals.devengado_total)}</td>
                  <td className="text-right font-mono text-emerald-400">{formatMoney(totals.girado_total)}</td>
                  <td className="text-center font-mono font-bold text-white">
                    {totals.pim > 0 ? ((totals.devengado_total / totals.pim) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination */}
        {!loading && filteredRows.length > 0 && (
          <div className="px-5 py-4 border-t border-white/[0.05] bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-[11px] font-semibold text-[#4A6080]">
              <span className="flex items-center gap-2">
                Filas por página:
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="form-select w-auto !py-1 !px-2 !rounded-md"
                >
                  {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </span>
              <span>
                {startIndex + 1}–{Math.min(startIndex + pageSize, totalRecords)} de {totalRecords}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {[
                { label: <ChevronLeft className="h-4 w-4" />, action: () => setCurrentPage(1), disabled: currentPage === 1 },
                { label: <><ChevronLeft className="h-3.5 w-3.5" />Ant.</>, action: () => setCurrentPage(p => Math.max(p-1,1)), disabled: currentPage === 1 },
              ].map((btn, i) => (
                <button key={i} onClick={btn.action} disabled={btn.disabled}
                  className="btn-secondary !px-2 !py-1.5 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-0.5 text-[11px]">
                  {btn.label}
                </button>
              ))}

              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let p = i + 1;
                if (currentPage > 3 && totalPages > 5) {
                  p = currentPage - 3 + i;
                  if (p + (4 - i) > totalPages) p = totalPages - 4 + i;
                }
                return (
                  <button key={p} onClick={() => setCurrentPage(p)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-[11px] font-bold border transition-all',
                      currentPage === p
                        ? 'bg-[#D40000] border-[#D40000] text-white shadow-lg shadow-red-950/50'
                        : 'btn-secondary !p-0'
                    )}>
                    {p}
                  </button>
                );
              })}

              {[
                { label: <>Sig.<ChevronRight className="h-3.5 w-3.5" /></>, action: () => setCurrentPage(p => Math.min(p+1,totalPages)), disabled: currentPage === totalPages },
                { label: <ChevronRight className="h-4 w-4" />, action: () => setCurrentPage(totalPages), disabled: currentPage === totalPages },
              ].map((btn, i) => (
                <button key={i} onClick={btn.action} disabled={btn.disabled}
                  className="btn-secondary !px-2 !py-1.5 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-0.5 text-[11px]">
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GastosPage() {
  return (
    <Suspense fallback={null}>
      <GastosContent />
    </Suspense>
  );
}
