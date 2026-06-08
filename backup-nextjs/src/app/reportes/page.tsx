'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Search, 
  FileSpreadsheet, 
  Printer,
  RefreshCw, 
  SlidersHorizontal,
  Layers,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Building,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface RubroOption {
  codigo: string;
  nombre: string;
}

interface ReportRow {
  meta?: string;
  rubro?: string;
  rubro_nombre?: string;
  clasificador?: string;
  clasificador_nombre?: string;
  pia: number;
  pim: number;
  certificado: number;
  comprometido: number;
  devengado: number;
  girado: number;
  recaudado: number;
  id?: number;
  ano_eje?: string;
  sec_ejec?: string;
  nro_certificado?: string;
  secuencia?: string;
  num_doc?: string;
  fecha_doc?: string;
  ruc_proveedor?: string;
  etapa?: string;
  estado?: string;
  monto: number;
  anio?: string;
}

interface ReportDefinition {
  id: string;
  title: string;
  category: 'gastos' | 'ingresos' | 'otros';
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export default function ReportesPage() {
  const [selectedReport, setSelectedReport] = useState<string>('gasto_1');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [rubrosList, setRubrosList] = useState<RubroOption[]>([]);
  const [metasList, setMetasList] = useState<string[]>([]);
  
  // Filters
  const [filterRubro, setFilterRubro] = useState('');
  const [filterMeta, setFilterMeta] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const reportsList: ReportDefinition[] = [
    {
      id: 'gasto_1',
      title: 'Gastos Nivel 1 (Genérica)',
      category: 'gastos',
      description: 'Resumen de gastos agrupado por meta, rubro y nivel de genérica (2.1, 2.3, 2.6...).',
      icon: TrendingDown,
    },
    {
      id: 'gasto_2',
      title: 'Gastos Nivel 2 (Subgenérica)',
      category: 'gastos',
      description: 'Gastos acumulados a nivel de subgenérica de clasificador (2.3.1, 2.3.2...).',
      icon: TrendingDown,
    },
    {
      id: 'gasto_3',
      title: 'Gastos Nivel 3 (Detallado)',
      category: 'gastos',
      description: 'Listado detallado de ejecución de gastos a nivel de clasificador completo (15 caracteres).',
      icon: TrendingDown,
    },
    {
      id: 'ingreso_1',
      title: 'Ingresos Nivel 1 (Genérica)',
      category: 'ingresos',
      description: 'Resumen de ingresos por rubro y nivel de genérica (1.1, 1.3, 1.5...).',
      icon: TrendingUp,
    },
    {
      id: 'ingreso_2',
      title: 'Ingresos Nivel 2 (Subgenérica)',
      category: 'ingresos',
      description: 'Ingresos acumulados a nivel de subgenérica de clasificador.',
      icon: TrendingUp,
    },
    {
      id: 'ingreso_3',
      title: 'Ingresos Nivel 3 (Detallado)',
      category: 'ingresos',
      description: 'Listado detallado de ejecución de ingresos a nivel de clasificador completo.',
      icon: TrendingUp,
    },
    {
      id: 'certificados',
      title: 'Reporte de Certificaciones',
      category: 'otros',
      description: 'Listado detallado de certificaciones presupuestales registradas (SIAF).',
      icon: CheckCircle2,
    },
    {
      id: 'multianual',
      title: 'Comparativo Multianual',
      category: 'otros',
      description: 'Comparativo global del comportamiento del gasto a lo largo de los años registrados.',
      icon: FileText,
    },
  ];

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/reportes?type=${selectedReport}`;
      if (filterRubro) url += `&rubro=${filterRubro}`;
      if (filterMeta) url += `&meta=${filterMeta}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRows(data.rows || []);
        if (data.rubros && rubrosList.length === 0) {
          setRubrosList(data.rubros);
        }
        if (data.metas && metasList.length === 0) {
          setMetasList(data.metas);
        }
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedReport, filterRubro, filterMeta, rubrosList.length, metasList.length]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Format money to PEN currency style: S/ 1,234.56
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  // Filter rows by query
  const filteredRows = rows.filter(row => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    
    // Check fields depending on the report layout
    const textFields = [
      row.clasificador,
      row.clasificador_nombre,
      row.rubro,
      row.rubro_nombre,
      row.meta,
      row.nro_certificado,
      row.num_doc,
      row.ruc_proveedor,
      row.etapa,
      row.estado
    ];
    
    return textFields.some(field => 
      field !== undefined && field !== null && String(field).toLowerCase().includes(q)
    );
  });

  // Calculate Column Totals depending on Selected Report
  const getTotals = () => {
    const defaultTotals = { pia: 0, pim: 0, certificado: 0, comprometido: 0, devengado: 0, girado: 0, recaudado: 0, monto: 0 };
    return filteredRows.reduce((acc, row) => {
      acc.pia += row.pia || 0;
      acc.pim += row.pim || 0;
      acc.certificado += row.certificado || 0;
      acc.comprometido += row.comprometido || 0;
      acc.devengado += row.devengado || 0;
      acc.girado += row.girado || 0;
      acc.recaudado += row.recaudado || 0;
      acc.monto += row.monto || 0;
      return acc;
    }, defaultTotals);
  };

  const totals = getTotals();

  // Export to Excel function using xlsx
  const exportToExcel = () => {
    const activeReport = reportsList.find(r => r.id === selectedReport);
    const reportTitle = activeReport ? activeReport.title : 'Reporte';

    let exportData: Record<string, string | number | null | undefined>[] = [];
    
    if (selectedReport.startsWith('gasto_')) {
      exportData = filteredRows.map(row => ({
        'Meta/Sec Func': row.meta,
        'Rubro': row.rubro,
        'Nombre Rubro': row.rubro_nombre || '',
        'Clasificador': row.clasificador,
        'Nombre Clasificador': row.clasificador_nombre || '',
        'PIA (S/)': row.pia,
        'PIM (S/)': row.pim,
        'Certificado (S/)': row.certificado,
        'Comprometido (S/)': row.comprometido,
        'Devengado (S/)': row.devengado,
        'Girado (S/)': row.girado,
        'Avance (%)': row.pim > 0 ? ((row.devengado / row.pim) * 100).toFixed(2) : '0.00',
      }));
    } else if (selectedReport.startsWith('ingreso_')) {
      exportData = filteredRows.map(row => ({
        'Rubro': row.rubro,
        'Nombre Rubro': row.rubro_nombre || '',
        'Clasificador': row.clasificador,
        'Nombre Clasificador': row.clasificador_nombre || '',
        'PIA (S/)': row.pia,
        'PIM (S/)': row.pim,
        'Recaudado (S/)': row.recaudado,
        'Diferencia (S/)': row.pim - row.recaudado,
        'Avance (%)': row.pim > 0 ? ((row.recaudado / row.pim) * 100).toFixed(2) : '0.00',
      }));
    } else if (selectedReport === 'certificados') {
      exportData = filteredRows.map(row => ({
        'Nro Certificado': row.nro_certificado,
        'Secuencia': row.secuencia,
        'Rubro': row.rubro,
        'Num Doc': row.num_doc || '',
        'Fecha Doc': row.fecha_doc || '',
        'Clasificador': row.clasificador,
        'Meta': row.meta,
        'Etapa': row.etapa || '',
        'Estado': row.estado || '',
        'Monto (S/)': row.monto,
      }));
    } else if (selectedReport === 'multianual') {
      exportData = filteredRows.map(row => ({
        'Año': row.anio,
        'Rubro': row.rubro,
        'Nombre Rubro': row.rubro_nombre || '',
        'PIA (S/)': row.pia,
        'PIM (S/)': row.pim,
        'Certificado (S/)': row.certificado,
        'Comprometido (S/)': row.comprometido,
        'Devengado (S/)': row.devengado,
        'Girado (S/)': row.girado,
        'Avance (%)': row.pim > 0 ? ((row.devengado / row.pim) * 100).toFixed(2) : '0.00',
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte Presupuestal');
    
    // Auto-fit column widths
    const maxLens = Object.keys(exportData[0] || {}).map(key => {
      let maxLen = key.length;
      exportData.forEach(row => {
        const val = row[key as keyof typeof row];
        if (val !== null && val !== undefined) {
          maxLen = Math.max(maxLen, String(val).length);
        }
      });
      return { wch: Math.min(maxLen + 2, 45) };
    });
    worksheet['!cols'] = maxLens;

    XLSX.writeFile(workbook, `SWSiconis_${reportTitle.replace(/ /g, '_')}_${new Date().getFullYear()}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 print:space-y-4 print:text-black">
      
      {/* CSS Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide sidebar and navigation */
          .fixed, navbar, aside, .print\\:hidden, button, select, input, label {
            display: none !important;
          }
          /* Reset main layout margins */
          .pl-64 {
            padding-left: 0 !important;
          }
          body {
            background: white !important;
            color: black !important;
            font-size: 10px !important;
          }
          /* Print friendly container */
          .print\\:bg-white {
            background-color: white !important;
            background: white !important;
          }
          .print\\:border-black {
            border-color: #000000 !important;
          }
          .print\\:text-black {
            color: #000000 !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #ddd !important;
            padding: 4px 6px !important;
            color: black !important;
          }
          th {
            background-color: #f1f1f1 !important;
          }
          h1, h2, h3, p {
            color: black !important;
          }
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
        }
      `}</style>

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6 print:pb-3 print:border-black">
        <div>
          <div className="flex items-center gap-2 text-[#d40000] text-xs font-bold uppercase tracking-widest mb-1 print:text-black">
            <Building className="h-4 w-4" />
            Módulo de Reportes Presupuestales
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none print:text-black">
            Reportes e Impresión
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium print:text-slate-650">
            Consolidado y agregación a nivel de genérica, subgenérica y detalles. Optimizado para PDF y Excel.
          </p>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <button 
            onClick={handlePrint}
            disabled={loading || filteredRows.length === 0}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-800 bg-[#0b1329]/40 hover:bg-slate-800/40 text-slate-300 hover:text-white transition-all duration-300 disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            Imprimir / PDF
          </button>

          <button 
            onClick={exportToExcel}
            disabled={loading || filteredRows.length === 0}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg border border-emerald-800/60 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 hover:text-emerald-300 transition-all duration-300 disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Reports Navigation Cards (Print hidden) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
        {reportsList.map((rep) => {
          const Icon = rep.icon;
          const isSelected = selectedReport === rep.id;
          
          return (
            <button
              key={rep.id}
              onClick={() => {
                setSelectedReport(rep.id);
                setRows([]);
              }}
              className={cn(
                "p-4 rounded-xl border text-left flex flex-col justify-between h-32 transition-all duration-300 relative overflow-hidden group",
                isSelected 
                  ? "border-[#d40000]/60 bg-gradient-to-br from-[#0c162d]/90 to-[#d40000]/10 shadow-lg shadow-[#d40000]/5 text-white" 
                  : "border-slate-800/65 bg-[#081020]/40 hover:bg-[#0c152a]/40 text-slate-400 hover:text-white"
              )}
            >
              <div className="flex justify-between items-center w-full">
                <span className={cn(
                  "p-1.5 rounded-lg",
                  isSelected ? "bg-[#d40000]/20 text-[#d40000]" : "bg-slate-800/50 text-slate-500 group-hover:text-slate-300"
                )}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[8px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-slate-900/50 text-slate-500">
                  {rep.category}
                </span>
              </div>
              <div>
                <h4 className="text-[11px] font-bold tracking-wide leading-tight truncate">{rep.title}</h4>
                <p className="text-[9px] text-slate-550 leading-tight mt-1 line-clamp-2">{rep.description}</p>
              </div>
              {isSelected && <div className="absolute left-0 bottom-0 top-0 w-1 bg-[#d40000]" />}
            </button>
          );
        })}
      </div>

      {/* Interactive Filters Panel (Print hidden) */}
      <div className="p-5 rounded-2xl border border-slate-800/70 bg-[#091122]/40 backdrop-blur-md shadow-lg shadow-black/20 flex flex-col gap-4 print:hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <SlidersHorizontal className="h-4 w-4 text-[#d40000]" />
          Filtros del Reporte Seleccionado
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Rubro Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Rubro (Fuente Financ.)
            </label>
            <select
              value={filterRubro}
              onChange={(e) => setFilterRubro(e.target.value)}
              className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-300 focus:outline-none focus:border-[#d40000]/60 transition-colors"
            >
              <option value="">Todos los Rubros</option>
              {rubrosList.map((r) => (
                <option key={r.codigo} value={r.codigo}>
                  {r.codigo} - {r.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Meta Selector (Visible only for gasto reports and certificates) */}
          <div className={cn("space-y-1.5", !selectedReport.startsWith('gasto_') && selectedReport !== 'certificados' && "opacity-45 pointer-events-none")}>
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Secuencia Funcional (Meta)
            </label>
            <select
              value={filterMeta}
              onChange={(e) => setFilterMeta(e.target.value)}
              className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-300 focus:outline-none focus:border-[#d40000]/60 transition-colors"
            >
              <option value="">Todas las Metas</option>
              {metasList.map((m) => (
                <option key={m} value={m}>
                  Meta {m}
                </option>
              ))}
            </select>
          </div>

          {/* Search Query Filter */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" />
              Filtro Rápido en Resultados
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Escribe texto para filtrar en tiempo real..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-300 placeholder-slate-650 focus:outline-none focus:border-[#d40000]/60 transition-colors"
              />
              <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button 
            onClick={fetchReportData}
            className="flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-lg border border-[#d40000]/50 bg-[#d40000]/10 hover:bg-[#d40000]/25 text-[#d40000] hover:text-red-350 transition-all duration-300 shadow-md"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Procesar Reporte
          </button>
        </div>
      </div>

      {/* Institutional Banner for Print (Visible only in Print) */}
      <div className="hidden print:block border-b border-black pb-4 mb-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-sm font-bold uppercase">Municipalidad Provincial de Huancabamba</h2>
            <p className="text-[9px] uppercase text-slate-600 font-semibold mt-0.5">SWSiconis 2026 — Seguimiento Presupuestal de Inversiones</p>
          </div>
          <div className="text-right text-[8px] font-semibold text-slate-500">
            <p>Fecha de Reporte: {new Date().toLocaleDateString('es-PE')}</p>
            <p>Hora: {new Date().toLocaleTimeString('es-PE')}</p>
          </div>
        </div>
        <h3 className="text-center text-xs font-black uppercase tracking-wider mt-4">
          {reportsList.find(r => r.id === selectedReport)?.title}
        </h3>
        {filterRubro && <p className="text-[9px] font-semibold mt-1">Filtro Rubro: {filterRubro}</p>}
        {filterMeta && <p className="text-[9px] font-semibold">Filtro Meta: {filterMeta}</p>}
      </div>

      {/* Main Report Table Container */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#081020]/60 backdrop-blur-md shadow-2xl overflow-hidden print:border-black print:bg-white print:rounded-none">
        <div className="overflow-x-auto">
          {selectedReport.startsWith('gasto_') && (
            // GASTOS TABLE (gasto_1, gasto_2, gasto_3)
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/35 text-slate-400 text-[9px] uppercase font-bold tracking-wider print:border-black print:bg-slate-100 print:text-black">
                  <th className="py-3 px-4 w-16 text-center">Meta</th>
                  <th className="py-3 px-4 w-16 text-center">Rubro</th>
                  <th className="py-3 px-4 w-28">Clasificador</th>
                  <th className="py-3 px-4">Descripción Clasificador</th>
                  <th className="py-3 px-4 text-right w-28">PIA</th>
                  <th className="py-3 px-4 text-right w-28">PIM</th>
                  <th className="py-3 px-4 text-right w-28">Certificado</th>
                  <th className="py-3 px-4 text-right w-28">Comprometido</th>
                  <th className="py-3 px-4 text-right w-28">Devengado</th>
                  <th className="py-3 px-4 text-right w-28">Girado</th>
                  <th className="py-3 px-4 text-center w-20">% Avance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs font-medium text-slate-350 print:divide-slate-300 print:text-black">
                {loading ? (
                  // Skeleton
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td colSpan={11} className="py-5 px-4"><div className="h-4 bg-slate-800 rounded w-full" /></td>
                    </tr>
                  ))
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-500 font-semibold">
                      No hay registros para este reporte presupuestal.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => {
                    const progress = row.pim > 0 ? (row.devengado / row.pim) * 100 : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-900/15">
                        <td className="py-3 px-4 text-center font-bold text-slate-450 print:text-black">{row.meta}</td>
                        <td className="py-3 px-4 text-center font-bold print:text-black">{row.rubro}</td>
                        <td className="py-3 px-4 font-mono font-bold text-white print:text-black">{row.clasificador}</td>
                        <td className="py-3 px-4 text-slate-200 print:text-black max-w-[200px] truncate" title={row.clasificador_nombre}>
                          {row.clasificador_nombre || 'Genérica de Gasto'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">{formatMoney(row.pia)}</td>
                        <td className="py-3 px-4 text-right font-mono text-white print:text-black">{formatMoney(row.pim)}</td>
                        <td className="py-3 px-4 text-right font-mono text-blue-400 print:text-black">{formatMoney(row.certificado)}</td>
                        <td className="py-3 px-4 text-right font-mono text-orange-400 print:text-black">{formatMoney(row.comprometido)}</td>
                        <td className="py-3 px-4 text-right font-mono text-[#d40000] print:text-black">{formatMoney(row.devengado)}</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400 print:text-black">{formatMoney(row.girado)}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold print:text-black">{progress.toFixed(1)}%</td>
                      </tr>
                    );
                  })
                )}
                {/* Total Row */}
                {!loading && filteredRows.length > 0 && (
                  <tr className="bg-slate-900/50 font-bold text-white border-t border-slate-800 print:bg-slate-100 print:text-black print:border-black">
                    <td colSpan={4} className="py-3.5 px-4 text-left font-sans uppercase">Total Consolidado</td>
                    <td className="py-3.5 px-4 text-right font-mono">{formatMoney(totals.pia)}</td>
                    <td className="py-3.5 px-4 text-right font-mono">{formatMoney(totals.pim)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-blue-400 print:text-black">{formatMoney(totals.certificado)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-orange-400 print:text-black">{formatMoney(totals.comprometido)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-red-400 print:text-black">{formatMoney(totals.devengado)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-400 print:text-black">{formatMoney(totals.girado)}</td>
                    <td className="py-3.5 px-4 text-center font-mono">{totals.pim > 0 ? ((totals.devengado / totals.pim) * 100).toFixed(1) : 0}%</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {selectedReport.startsWith('ingreso_') && (
            // INGRESOS TABLE (ingreso_1, ingreso_2, ingreso_3)
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/35 text-slate-400 text-[9px] uppercase font-bold tracking-wider print:border-black print:bg-slate-100 print:text-black">
                  <th className="py-3 px-4 w-20 text-center">Rubro</th>
                  <th className="py-3 px-4 w-32">Clasificador</th>
                  <th className="py-3 px-4">Descripción Clasificador</th>
                  <th className="py-3 px-4 text-right w-36">PIA Estimado</th>
                  <th className="py-3 px-4 text-right w-36">PIM Modificado</th>
                  <th className="py-3 px-4 text-right w-36">Recaudado</th>
                  <th className="py-3 px-4 text-right w-36">Diferencia</th>
                  <th className="py-3 px-4 text-center w-28">% Recaudación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs font-medium text-slate-350 print:divide-slate-300 print:text-black">
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td colSpan={8} className="py-5 px-4"><div className="h-4 bg-slate-800 rounded w-full" /></td>
                    </tr>
                  ))
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 font-semibold">
                      No hay registros para este reporte presupuestal.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => {
                    const progress = row.pim > 0 ? (row.recaudado / row.pim) * 100 : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-900/15">
                        <td className="py-3 px-4 text-center font-bold print:text-black">{row.rubro}</td>
                        <td className="py-3 px-4 font-mono font-bold text-white print:text-black">{row.clasificador}</td>
                        <td className="py-3 px-4 text-slate-200 print:text-black max-w-[260px] truncate" title={row.clasificador_nombre}>
                          {row.clasificador_nombre || 'Genérica de Ingreso'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">{formatMoney(row.pia)}</td>
                        <td className="py-3 px-4 text-right font-mono text-white print:text-black">{formatMoney(row.pim)}</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400 print:text-black">{formatMoney(row.recaudado)}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-450 print:text-black">{formatMoney(row.pim - row.recaudado)}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold print:text-black">{progress.toFixed(1)}%</td>
                      </tr>
                    );
                  })
                )}
                {/* Total Row */}
                {!loading && filteredRows.length > 0 && (
                  <tr className="bg-slate-900/50 font-bold text-white border-t border-slate-800 print:bg-slate-100 print:text-black print:border-black">
                    <td colSpan={3} className="py-3.5 px-4 text-left font-sans uppercase">Total Consolidado</td>
                    <td className="py-3.5 px-4 text-right font-mono">{formatMoney(totals.pia)}</td>
                    <td className="py-3.5 px-4 text-right font-mono">{formatMoney(totals.pim)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-400 print:text-black">{formatMoney(totals.recaudado)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300 print:text-black">{formatMoney(totals.pim - totals.recaudado)}</td>
                    <td className="py-3.5 px-4 text-center font-mono">{totals.pim > 0 ? ((totals.recaudado / totals.pim) * 100).toFixed(1) : 0}%</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {selectedReport === 'certificados' && (
            // CERTIFICADOS TABLE
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/35 text-slate-400 text-[9px] uppercase font-bold tracking-wider print:border-black print:bg-slate-100 print:text-black">
                  <th className="py-3 px-4 w-28 text-center">Nro Certif.</th>
                  <th className="py-3 px-4 w-16 text-center">Sec.</th>
                  <th className="py-3 px-4 w-16 text-center">Rubro</th>
                  <th className="py-3 px-4 w-32">Documento</th>
                  <th className="py-3 px-4 w-24">Fecha</th>
                  <th className="py-3 px-4 w-28">Clasificador</th>
                  <th className="py-3 px-4 w-16 text-center">Meta</th>
                  <th className="py-3 px-4">Etapa</th>
                  <th className="py-3 px-4 w-24">Estado</th>
                  <th className="py-3 px-4 text-right w-28">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs font-medium text-slate-350 print:divide-slate-300 print:text-black">
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td colSpan={10} className="py-5 px-4"><div className="h-4 bg-slate-800 rounded w-full" /></td>
                    </tr>
                  ))
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500 font-semibold">
                      No hay registros para este reporte presupuestal.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/15">
                      <td className="py-3 px-4 text-center font-mono font-bold text-white print:text-black">{row.nro_certificado}</td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-450 print:text-black">{row.secuencia}</td>
                      <td className="py-3 px-4 text-center font-bold print:text-black">{row.rubro}</td>
                      <td className="py-3 px-4 truncate max-w-[140px] print:text-black" title={row.num_doc}>{row.num_doc || 'Sin doc'}</td>
                      <td className="py-3 px-4 font-mono print:text-black">{row.fecha_doc || 'N/A'}</td>
                      <td className="py-3 px-4 font-mono font-bold print:text-black">{row.clasificador}</td>
                      <td className="py-3 px-4 text-center font-bold print:text-black">{row.meta}</td>
                      <td className="py-3 px-4 text-slate-400 print:text-black text-[10px]">{row.etapa}</td>
                      <td className="py-3 px-4 text-[10px] uppercase font-bold">
                        <span className={cn(
                          row.estado === 'APROBADO' ? "text-emerald-400" : "text-slate-400"
                        )}>
                          {row.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white print:text-black">{formatMoney(row.monto)}</td>
                    </tr>
                  ))
                )}
                {/* Total Row */}
                {!loading && filteredRows.length > 0 && (
                  <tr className="bg-slate-900/50 font-bold text-white border-t border-slate-800 print:bg-slate-100 print:text-black print:border-black">
                    <td colSpan={9} className="py-3.5 px-4 text-left font-sans uppercase">Total Certificaciones</td>
                    <td className="py-3.5 px-4 text-right font-mono text-red-400 print:text-black">{formatMoney(totals.monto)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {selectedReport === 'multianual' && (
            // MULTIANUAL TABLE
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/35 text-slate-400 text-[9px] uppercase font-bold tracking-wider print:border-black print:bg-slate-100 print:text-black">
                  <th className="py-3 px-4 text-center w-24">Año Fiscal</th>
                  <th className="py-3 px-4 w-20 text-center">Rubro</th>
                  <th className="py-3 px-4">Descripción Rubro</th>
                  <th className="py-3 px-4 text-right w-28">PIA</th>
                  <th className="py-3 px-4 text-right w-28">PIM</th>
                  <th className="py-3 px-4 text-right w-28">Certificado</th>
                  <th className="py-3 px-4 text-right w-28">Comprometido</th>
                  <th className="py-3 px-4 text-right w-28">Devengado (Ejecutado)</th>
                  <th className="py-3 px-4 text-right w-28">Girado (Pagado)</th>
                  <th className="py-3 px-4 text-center w-20">% Avance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs font-medium text-slate-350 print:divide-slate-300 print:text-black">
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td colSpan={10} className="py-5 px-4"><div className="h-4 bg-slate-800 rounded w-full" /></td>
                    </tr>
                  ))
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500 font-semibold">
                      No hay registros para este reporte presupuestal.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => {
                    const progress = row.pim > 0 ? (row.devengado / row.pim) * 100 : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-900/15">
                        <td className="py-3 px-4 text-center font-bold text-white print:text-black font-mono text-sm">{row.anio}</td>
                        <td className="py-3 px-4 text-center font-bold print:text-black">{row.rubro}</td>
                        <td className="py-3 px-4 text-slate-200 print:text-black max-w-[220px] truncate" title={row.rubro_nombre}>
                          {row.rubro_nombre || 'Fuente Financiamiento'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">{formatMoney(row.pia)}</td>
                        <td className="py-3 px-4 text-right font-mono text-white print:text-black">{formatMoney(row.pim)}</td>
                        <td className="py-3 px-4 text-right font-mono text-blue-400 print:text-black">{formatMoney(row.certificado)}</td>
                        <td className="py-3 px-4 text-right font-mono text-orange-400 print:text-black">{formatMoney(row.comprometido)}</td>
                        <td className="py-3 px-4 text-right font-mono text-red-400 print:text-black">{formatMoney(row.devengado)}</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400 print:text-black">{formatMoney(row.girado)}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold print:text-black">{progress.toFixed(1)}%</td>
                      </tr>
                    );
                  })
                )}
                {/* Total Row */}
                {!loading && filteredRows.length > 0 && (
                  <tr className="bg-slate-900/50 font-bold text-white border-t border-slate-800 print:bg-slate-100 print:text-black print:border-black">
                    <td colSpan={3} className="py-3.5 px-4 text-left font-sans uppercase">Total Consolidado Multianual</td>
                    <td className="py-3.5 px-4 text-right font-mono">{formatMoney(totals.pia)}</td>
                    <td className="py-3.5 px-4 text-right font-mono">{formatMoney(totals.pim)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-blue-400 print:text-black">{formatMoney(totals.certificado)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-orange-400 print:text-black">{formatMoney(totals.comprometido)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-red-400 print:text-black">{formatMoney(totals.devengado)}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-400 print:text-black">{formatMoney(totals.girado)}</td>
                    <td className="py-3.5 px-4 text-center font-mono">{totals.pim > 0 ? ((totals.devengado / totals.pim) * 100).toFixed(1) : 0}%</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
