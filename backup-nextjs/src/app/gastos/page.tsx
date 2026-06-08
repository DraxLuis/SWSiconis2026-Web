'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { 
  TrendingDown, 
  Search, 
  FileSpreadsheet, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  SlidersHorizontal,
  Layers,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface GastoRow {
  rubro: string;
  rubro_nombre: string;
  clasificador: string;
  clasificador_nombre: string;
  pia: number;
  pim: number;
  certificado: number;
  comprometido: number;
  devengado_total: number;
  girado_total: number;
  dev_01: number; dev_02: number; dev_03: number; dev_04: number;
  dev_05: number; dev_06: number; dev_07: number; dev_08: number;
  dev_09: number; dev_10: number; dev_11: number; dev_12: number;
  gir_01: number; gir_02: number; gir_03: number; gir_04: number;
  gir_05: number; gir_06: number; gir_07: number; gir_08: number;
  gir_09: number; gir_10: number; gir_11: number; gir_12: number;
}

interface RubroOption {
  codigo: string;
  nombre: string;
}

export default function GastosPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<GastoRow[]>([]);
  const [rubrosList, setRubrosList] = useState<RubroOption[]>([]);
  
  // Filters
  const [filterRubro, setFilterRubro] = useState('');
  const [filterClasificador, setFilterClasificador] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // Text search across names

  // Expanded rows state
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchGastos = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/gastos';
      const params = new URLSearchParams();
      if (filterRubro) params.append('rubro', filterRubro);
      if (filterClasificador) params.append('clasificador', filterClasificador);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRows(data.rows || []);
        if (data.rubros && rubrosList.length === 0) {
          setRubrosList(data.rubros);
        }
      }
    } catch (error) {
      console.error('Error fetching gastos data:', error);
    } finally {
      setLoading(false);
    }
  }, [filterRubro, filterClasificador, rubrosList.length]);

  useEffect(() => {
    fetchGastos();
    setCurrentPage(1); // Reset page on filter changes
  }, [fetchGastos]);

  // Format money to PEN currency style: S/ 1,234.56
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  // Filter rows by search query (clasificador or names)
  const filteredRows = rows.filter(row => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      row.clasificador.toLowerCase().includes(query) ||
      (row.clasificador_nombre && row.clasificador_nombre.toLowerCase().includes(query)) ||
      (row.rubro_nombre && row.rubro_nombre.toLowerCase().includes(query))
    );
  });

  // Calculate totals of filtered rows
  const totals = filteredRows.reduce((acc, row) => {
    acc.pia += row.pia || 0;
    acc.pim += row.pim || 0;
    acc.certificado += row.certificado || 0;
    acc.comprometido += row.comprometido || 0;
    acc.devengado_total += row.devengado_total || 0;
    acc.girado_total += row.girado_total || 0;
    return acc;
  }, { pia: 0, pim: 0, certificado: 0, comprometido: 0, devengado_total: 0, girado_total: 0 });

  // Pagination logic
  const totalRecords = filteredRows.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + pageSize);

  const toggleRow = (rowId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  const toggleAllRows = () => {
    const allExpanded = Object.keys(expandedRows).length === paginatedRows.length && 
                        paginatedRows.every(r => expandedRows[`${r.rubro}-${r.clasificador}`]);
    
    if (allExpanded) {
      setExpandedRows({});
    } else {
      const newExpanded: Record<string, boolean> = {};
      paginatedRows.forEach(r => {
        newExpanded[`${r.rubro}-${r.clasificador}`] = true;
      });
      setExpandedRows(newExpanded);
    }
  };

  // Export to Excel function using xlsx
  const exportToExcel = () => {
    const exportData = filteredRows.map((row) => ({
      'Rubro': row.rubro,
      'Nombre Rubro': row.rubro_nombre || '',
      'Clasificador': row.clasificador,
      'Nombre Clasificador': row.clasificador_nombre || '',
      'PIA (S/)': row.pia,
      'PIM (S/)': row.pim,
      'Certificado (S/)': row.certificado,
      'Comprometido (S/)': row.comprometido,
      'Devengado Total (S/)': row.devengado_total,
      'Girado Total (S/)': row.girado_total,
      'Avance Devengado (%)': row.pim > 0 ? ((row.devengado_total / row.pim) * 100).toFixed(2) : '0.00',
      'Avance Girado (%)': row.pim > 0 ? ((row.girado_total / row.pim) * 100).toFixed(2) : '0.00',
      // Monthly breakdown columns
      'Dev Ene': row.dev_01, 'Dev Feb': row.dev_02, 'Dev Mar': row.dev_03, 'Dev Abr': row.dev_04,
      'Dev May': row.dev_05, 'Dev Jun': row.dev_06, 'Dev Jul': row.dev_07, 'Dev Ago': row.dev_08,
      'Dev Set': row.dev_09, 'Dev Oct': row.dev_10, 'Dev Nov': row.dev_11, 'Dev Dic': row.dev_12,
      'Gir Ene': row.gir_01, 'Gir Feb': row.gir_02, 'Gir Mar': row.gir_03, 'Gir Abr': row.gir_04,
      'Gir May': row.gir_05, 'Gir Jun': row.gir_06, 'Gir Jul': row.gir_07, 'Gir Ago': row.gir_08,
      'Gir Set': row.gir_09, 'Gir Oct': row.gir_10, 'Gir Nov': row.gir_11, 'Gir Dic': row.gir_12,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ejecución Gastos');
    
    // Auto-fit column widths
    const maxLens = Object.keys(exportData[0] || {}).map(key => {
      let maxLen = key.length;
      exportData.forEach(row => {
        const val = row[key as keyof typeof row];
        if (val !== null && val !== undefined) {
          maxLen = Math.max(maxLen, String(val).length);
        }
      });
      return { wch: maxLen + 2 };
    });
    worksheet['!cols'] = maxLens;

    XLSX.writeFile(workbook, `SWSiconis_Ejecucion_Gastos_${new Date().getFullYear()}.xlsx`);
  };

  const monthsHeader = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
    'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#d40000] text-xs font-bold uppercase tracking-widest mb-1">
            <TrendingDown className="h-4 w-4" />
            Módulo de Presupuesto
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">
            Ejecución de Gastos
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Seguimiento detallado de PIA, PIM, Certificaciones y la evolución mensual de Devengados y Girados.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={exportToExcel}
            disabled={loading || filteredRows.length === 0}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg border border-emerald-800/60 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 hover:text-emerald-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-950/20"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel
          </button>
          
          <button 
            onClick={fetchGastos}
            className="flex items-center justify-center p-2.5 rounded-lg border border-slate-800 bg-[#0b1329]/40 hover:bg-slate-800/40 text-slate-300 hover:text-white transition-all duration-300 backdrop-blur-sm"
            title="Actualizar datos"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Interactive Filters Panel */}
      <div className="p-5 rounded-2xl border border-slate-800/70 bg-[#091122]/40 backdrop-blur-md shadow-lg shadow-black/20 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <SlidersHorizontal className="h-4 w-4 text-[#d40000]" />
          Filtros y Búsqueda
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Rubro Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Rubro (Fuente Financiamiento)
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
              <Calendar className="h-3.5 w-3.5" />
              Nivel Clasificador (Prefijo)
            </label>
            <input
              type="text"
              placeholder="Ej: 2.6 o 2.3..."
              value={filterClasificador}
              onChange={(e) => setFilterClasificador(e.target.value)}
              className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#d40000]/60 transition-all duration-300"
            />
          </div>

          {/* Text Search Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" />
              Búsqueda por Nombre / Clasificador
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar coincidencia..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#d40000]/60 transition-all duration-300"
              />
              <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Mini Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800/50 bg-[#091224]/20 backdrop-blur-md">
          <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-1">PIM Total Filtrado</p>
          <p className="text-base font-extrabold text-white">{formatMoney(totals.pim)}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-800/50 bg-[#091224]/20 backdrop-blur-md">
          <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-1">Certificado Total</p>
          <p className="text-base font-extrabold text-blue-400">{formatMoney(totals.certificado)}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-800/50 bg-[#091224]/20 backdrop-blur-md">
          <p className="text-[9px] uppercase font-bold text-red-400/80 tracking-widest mb-1">Devengado Total</p>
          <p className="text-base font-extrabold text-red-400">{formatMoney(totals.devengado_total)}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-800/50 bg-[#091224]/20 backdrop-blur-md">
          <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-1">% Avance (Dev/PIM)</p>
          <div className="flex items-center gap-2">
            <p className="text-base font-extrabold text-white">
              {totals.pim > 0 ? ((totals.devengado_total / totals.pim) * 100).toFixed(1) : 0}%
            </p>
            <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-red-600 h-full rounded-full" 
                style={{ width: `${Math.min(totals.pim > 0 ? (totals.devengado_total / totals.pim) * 100 : 0, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#081020]/60 backdrop-blur-md shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/35 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-4 px-5 w-12 text-center">
                  <button 
                    onClick={toggleAllRows}
                    className="p-1 rounded bg-slate-800/60 hover:bg-slate-700/60 transition-colors"
                    title="Expandir/Contraer todos"
                  >
                    <ChevronDown className="h-3.5 w-3.5 text-slate-300" />
                  </button>
                </th>
                <th className="py-4 px-4 w-16 text-center">Rubro</th>
                <th className="py-4 px-4 w-32">Clasificador</th>
                <th className="py-4 px-4">Descripción</th>
                <th className="py-4 px-4 text-right">PIA</th>
                <th className="py-4 px-4 text-right">PIM</th>
                <th className="py-4 px-4 text-right">Certificado</th>
                <th className="py-4 px-4 text-right">Devengado</th>
                <th className="py-4 px-4 text-right">Girado</th>
                <th className="py-4 px-4 text-center w-28">% Avance</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-800/40 text-xs font-medium text-slate-300">
              {loading ? (
                // Skeleton Rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-5 px-5"><div className="h-4 w-4 bg-slate-800 rounded mx-auto" /></td>
                    <td className="py-5 px-4"><div className="h-4 w-8 bg-slate-800 rounded mx-auto" /></td>
                    <td className="py-5 px-4"><div className="h-4 w-20 bg-slate-800 rounded" /></td>
                    <td className="py-5 px-4"><div className="h-4 w-44 bg-slate-800 rounded" /></td>
                    <td className="py-5 px-4"><div className="h-4 w-16 bg-slate-800 rounded ml-auto" /></td>
                    <td className="py-5 px-4"><div className="h-4 w-16 bg-slate-800 rounded ml-auto" /></td>
                    <td className="py-5 px-4"><div className="h-4 w-16 bg-slate-800 rounded ml-auto" /></td>
                    <td className="py-5 px-4"><div className="h-4 w-16 bg-slate-800 rounded ml-auto" /></td>
                    <td className="py-5 px-4"><div className="h-4 w-16 bg-slate-800 rounded ml-auto" /></td>
                    <td className="py-5 px-4"><div className="h-4 w-12 bg-slate-800 rounded mx-auto" /></td>
                  </tr>
                ))
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 font-semibold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-slate-600" />
                      <span>No se encontraron registros de ejecución de gastos.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const rowId = `${row.rubro}-${row.clasificador}`;
                  const isExpanded = !!expandedRows[rowId];
                  const avanceVal = row.pim > 0 ? (row.devengado_total / row.pim) * 100 : 0;
                  
                  return (
                    <Fragment key={rowId}>
                      {/* Base Row */}
                      <tr 
                        className={cn(
                          "hover:bg-[#0c162b]/40 transition-colors duration-200 cursor-pointer",
                          isExpanded && "bg-[#0b152d]/60 border-l-2 border-[#d40000]"
                        )}
                        onClick={() => toggleRow(rowId)}
                      >
                        <td className="py-4 px-5 text-center">
                          <button className="p-1 rounded hover:bg-slate-800/80 transition-colors">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-[#d40000]" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            )}
                          </button>
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-slate-400">{row.rubro}</td>
                        <td className="py-4 px-4 font-mono font-bold text-white tracking-wide">{row.clasificador}</td>
                        <td className="py-4 px-4 max-w-[240px] truncate" title={row.clasificador_nombre}>
                          <p className="font-semibold text-slate-200 truncate">{row.clasificador_nombre || 'Sin especificación'}</p>
                          <p className="text-[10px] text-slate-500 truncate">{row.rubro_nombre}</p>
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-semibold">{formatMoney(row.pia)}</td>
                        <td className="py-4 px-4 text-right font-mono font-semibold text-white">{formatMoney(row.pim)}</td>
                        <td className="py-4 px-4 text-right font-mono font-semibold text-blue-400">{formatMoney(row.certificado)}</td>
                        <td className="py-4 px-4 text-right font-mono font-semibold text-red-400">{formatMoney(row.devengado_total)}</td>
                        <td className="py-4 px-4 text-right font-mono font-semibold text-emerald-400">{formatMoney(row.girado_total)}</td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold font-mono text-white text-[11px]">{avanceVal.toFixed(1)}%</span>
                            <div className="w-20 bg-slate-800/80 rounded-full h-1 overflow-hidden border border-slate-700/10">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  avanceVal >= 75 ? "bg-emerald-500" : avanceVal >= 40 ? "bg-orange-500" : "bg-red-600"
                                )}
                                style={{ width: `${Math.min(avanceVal, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Details Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={10} className="p-0 bg-slate-950/45 border-b border-slate-800/40">
                            <div className="p-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-850 pb-2">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-[#d40000]" />
                                  Distribución Presupuestal Mensual
                                </h4>
                                <span className="text-[10px] text-slate-500 font-semibold">
                                  Rubro {row.rubro} — Clasificador {row.clasificador}
                                </span>
                              </div>

                              {/* Monthly Columns Grid */}
                              <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#091124]/40">
                                <table className="w-full min-w-[700px] border-collapse text-[11px]">
                                  <thead>
                                    <tr className="bg-slate-900/40 text-slate-500 font-bold border-b border-slate-800">
                                      <th className="py-2.5 px-3 text-left w-24">Concepto</th>
                                      {monthsHeader.map((m) => (
                                        <th key={m} className="py-2.5 px-2 text-right">{m}</th>
                                      ))}
                                      <th className="py-2.5 px-3 text-right font-extrabold text-slate-400">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/40 font-mono font-medium">
                                    {/* Devengados row */}
                                    <tr className="hover:bg-slate-900/10">
                                      <td className="py-2.5 px-3 text-left font-sans font-bold text-red-400">Devengado</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.dev_01)}</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.dev_02)}</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.dev_03)}</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.dev_04)}</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.dev_05)}</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.dev_06)}</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.dev_07)}</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.dev_08)}</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.dev_09)}</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.dev_10)}</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.dev_11)}</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.dev_12)}</td>
                                      <td className="py-2.5 px-3 text-right font-bold text-red-400 bg-red-950/10">{formatMoney(row.devengado_total)}</td>
                                    </tr>
                                    {/* Girados row */}
                                    <tr className="hover:bg-slate-900/10">
                                      <td className="py-2.5 px-3 text-left font-sans font-bold text-emerald-400">Girado</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.gir_01)}</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.gir_02)}</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.gir_03)}</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.gir_04)}</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.gir_05)}</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.gir_06)}</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.gir_07)}</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.gir_08)}</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.gir_09)}</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.gir_10)}</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.gir_11)}</td>
                                      <td className="py-2.5 px-2 text-right">{formatMoney(row.gir_12)}</td>
                                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400 bg-emerald-950/10">{formatMoney(row.girado_total)}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              {/* Progress compare bar inside panel */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                <div className="p-3.5 rounded-xl border border-slate-800/40 bg-slate-900/20 flex justify-between items-center text-xs">
                                  <div className="space-y-1">
                                    <span className="text-slate-500 font-semibold block uppercase text-[9px] tracking-wider">Saldo por Comprometer</span>
                                    <span className="font-bold font-mono text-slate-200">{formatMoney(row.pim - row.certificado)}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-semibold">PIM - Certificado</span>
                                </div>
                                <div className="p-3.5 rounded-xl border border-slate-800/40 bg-slate-900/20 flex justify-between items-center text-xs">
                                  <div className="space-y-1">
                                    <span className="text-slate-500 font-semibold block uppercase text-[9px] tracking-wider">Saldo por Devengar</span>
                                    <span className="font-bold font-mono text-[#d40000]">{formatMoney(row.pim - row.devengado_total)}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-semibold">PIM - Devengado</span>
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
          </table>
        </div>

        {/* Client Side Pagination Controls */}
        {!loading && filteredRows.length > 0 && (
          <div className="px-5 py-4 border-t border-slate-800/80 bg-slate-900/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-2">
                Filas por página:
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-[#0b1428] border border-slate-800 rounded px-2.5 py-1 text-slate-300 focus:outline-none focus:border-[#d40000]/60 transition-colors"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </span>
              <span>
                Mostrando {startIndex + 1} a {Math.min(startIndex + pageSize, totalRecords)} de {totalRecords} registros
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-800 bg-[#0b1329]/40 hover:bg-slate-800/40 text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="Primera página"
              >
                <ChevronLeft className="h-4 w-4 transform -translate-x-0.5" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0b1329]/40 hover:bg-slate-800/40 text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  // Pages logic around current page
                  let pageNum = i + 1;
                  if (currentPage > 3 && totalPages > 5) {
                    pageNum = currentPage - 3 + i;
                    if (pageNum + (4 - i) > totalPages) {
                      pageNum = totalPages - 4 + i;
                    }
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-xs font-bold border transition-all duration-200",
                        currentPage === pageNum 
                          ? "bg-[#d40000] border-[#d40000] text-white shadow-lg shadow-red-950/45" 
                          : "border-slate-800 bg-[#0b1329]/20 hover:bg-slate-800/50 text-slate-400 hover:text-white"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0b1329]/40 hover:bg-slate-800/40 text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold"
              >
                Siguiente
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-800 bg-[#0b1329]/40 hover:bg-slate-800/40 text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="Última página"
              >
                <ChevronRight className="h-4 w-4 transform translate-x-0.5" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
