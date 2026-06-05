'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { 
  CreditCard, 
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
  User,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface PagoRow {
  id: number;
  ano_proc: string;
  ano_eje: string;
  sec_ejec: string;
  expediente: string;
  secuencia: string;
  num_doc: string;
  ruc: string;
  beneficiario: string;
  rubro: string;
  rubro_nombre: string;
  glosa: string;
  cod_doc: string;
  fecha_doc: string;
  cod_doc_b: string;
  nom_doc_b: string;
  fec_doc_b: string;
  const_pago: string;
  confor_doc: string;
  confor_des: string;
  confor_fec: string;
  monto: number;
  estado: string;
}

interface RubroOption {
  codigo: string;
  nombre: string;
}

export default function PagosPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PagoRow[]>([]);
  const [rubrosList, setRubrosList] = useState<RubroOption[]>([]);
  
  // Filters
  const [filterRubro, setFilterRubro] = useState('');
  const [filterExpediente, setFilterExpediente] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Expanded rows state
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchPagos = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/pagos';
      const params = new URLSearchParams();
      if (filterRubro) params.append('rubro', filterRubro);
      if (filterExpediente) params.append('expediente', filterExpediente);
      if (filterEstado) params.append('estado', filterEstado);
      if (searchQuery) params.append('q', searchQuery);
      
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
      console.error('Error fetching pagos data:', error);
    } finally {
      setLoading(false);
    }
  }, [filterRubro, filterExpediente, filterEstado, searchQuery, rubrosList.length]);

  useEffect(() => {
    fetchPagos();
    setCurrentPage(1); // Reset page on filter changes
  }, [fetchPagos]);

  // Format money to PEN currency style: S/ 1,234.56
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  // Calculate totals of filtered rows (since backend returns already filtered rows, we use rows directly)
  const totalMonto = rows.reduce((acc, row) => acc + (row.monto || 0), 0);

  // Pagination logic
  const totalRecords = rows.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = rows.slice(startIndex, startIndex + pageSize);

  const toggleRow = (rowId: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  const toggleAllRows = () => {
    const allExpanded = Object.keys(expandedRows).length === paginatedRows.length && 
                        paginatedRows.every(r => expandedRows[r.id]);
    
    if (allExpanded) {
      setExpandedRows({});
    } else {
      const newExpanded: Record<number, boolean> = {};
      paginatedRows.forEach(r => {
        newExpanded[r.id] = true;
      });
      setExpandedRows(newExpanded);
    }
  };

  // Export to Excel function using xlsx
  const exportToExcel = () => {
    const exportData = rows.map((row) => ({
      'Expediente': row.expediente,
      'Secuencia': row.secuencia,
      'Num Doc': row.num_doc,
      'RUC': row.ruc,
      'Beneficiario': row.beneficiario,
      'Rubro': row.rubro,
      'Nombre Rubro': row.rubro_nombre || '',
      'Monto (S/)': row.monto,
      'Estado': row.estado || '',
      'Fecha Doc': row.fecha_doc || '',
      'Glosa': row.glosa || '',
      'Constancia Pago': row.const_pago || '',
      'Doc Banco': row.nom_doc_b || '',
      'Fec Banco': row.fec_doc_b || '',
      'Conformidad Doc': row.confor_doc || '',
      'Conformidad Des': row.confor_des || '',
      'Conformidad Fec': row.confor_fec || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Notas de Pago');
    
    // Auto-fit column widths
    const maxLens = Object.keys(exportData[0] || {}).map(key => {
      let maxLen = key.length;
      exportData.forEach(row => {
        const val = row[key as keyof typeof row];
        if (val !== null && val !== undefined) {
          maxLen = Math.max(maxLen, String(val).length);
        }
      });
      return { wch: Math.min(maxLen + 2, 50) }; // Cap width at 50 for very long texts like Glosa
    });
    worksheet['!cols'] = maxLens;

    XLSX.writeFile(workbook, `SWSiconis_Notas_Pago_${new Date().getFullYear()}.xlsx`);
  };

  // Status Badge Builder
  const getStatusBadge = (estado: string) => {
    const est = (estado || '').toLowerCase().trim();
    if (est === 'aprobado' || est === 'pagado') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          {estado}
        </span>
      );
    }
    if (est === 'proceso' || est === 'pendiente') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-950/40 border border-amber-800/40 text-amber-400">
          <AlertCircle className="h-3 w-3 animate-pulse" />
          {estado}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-700 text-slate-400">
        <HelpCircle className="h-3 w-3" />
        {estado || 'Sin Estado'}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#d40000] text-xs font-bold uppercase tracking-widest mb-1">
            <CreditCard className="h-4 w-4" />
            Módulo de Tesorería
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">
            Notas de Pago
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Registro y seguimiento de expedientes, montos girados, beneficiarios y conformidades de pago.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={exportToExcel}
            disabled={loading || rows.length === 0}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg border border-emerald-800/60 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 hover:text-emerald-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-950/20"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel
          </button>
          
          <button 
            onClick={fetchPagos}
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

          {/* Expediente Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Nro. Expediente SIAF
            </label>
            <input
              type="text"
              placeholder="Ej: 0000001..."
              value={filterExpediente}
              onChange={(e) => setFilterExpediente(e.target.value)}
              className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#d40000]/60 transition-all duration-300"
            />
          </div>

          {/* Estado Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Estado de Pago
            </label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-300 focus:outline-none focus:border-[#d40000]/60 transition-all duration-300"
            >
              <option value="">Todos los Estados</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Proceso">Proceso</option>
              <option value="Pendiente">Pendiente</option>
            </select>
          </div>

          {/* General Search Query */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" />
              Buscar Beneficiario / RUC / Doc
            </label>
            <input
              type="text"
              placeholder="Ej: Consorcio o RUC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-[#0b1428] border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#d40000]/60 transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl border border-slate-800/50 bg-[#091224]/30 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="h-14 w-14 text-white" />
          </div>
          <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-1.5">Monto Total Girado</p>
          <h3 className="text-xl font-extrabold text-white">{formatMoney(totalMonto)}</h3>
          <div className="mt-2 text-[10px] text-slate-500 font-semibold">
            Suma total de notas de pago filtradas
          </div>
          <div className="absolute left-0 bottom-0 top-0 w-1 bg-[#d40000]" />
        </div>

        <div className="p-5 rounded-2xl border border-slate-800/50 bg-[#091224]/30 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <FileText className="h-14 w-14 text-white" />
          </div>
          <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-1.5">Expedientes Totales</p>
          <h3 className="text-xl font-extrabold text-white">{totalRecords}</h3>
          <div className="mt-2 text-[10px] text-slate-500 font-semibold">
            Cantidad de registros encontrados
          </div>
          <div className="absolute left-0 bottom-0 top-0 w-1 bg-slate-700" />
        </div>

        <div className="p-5 rounded-2xl border border-slate-800/50 bg-[#091224]/30 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <CheckCircle2 className="h-14 w-14 text-white" />
          </div>
          <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-1.5">Eficiencia de Pago</p>
          <h3 className="text-xl font-extrabold text-emerald-400">
            {totalRecords > 0 
              ? ((rows.filter(r => (r.estado || '').toLowerCase() === 'aprobado').length / totalRecords) * 100).toFixed(1)
              : 0}%
          </h3>
          <div className="mt-2 text-[10px] text-slate-550 font-semibold text-emerald-500/80">
            Porcentaje de expedientes en estado Aprobado
          </div>
          <div className="absolute left-0 bottom-0 top-0 w-1 bg-emerald-600" />
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
                <th className="py-4 px-4 w-28">Expediente</th>
                <th className="py-4 px-4 w-20 text-center">Sec.</th>
                <th className="py-4 px-4 w-28 text-center">Rubro</th>
                <th className="py-4 px-4">Beneficiario / RUC</th>
                <th className="py-4 px-4">Documento</th>
                <th className="py-4 px-4 text-right">Monto</th>
                <th className="py-4 px-4 text-center w-36">Estado</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-800/40 text-xs font-medium text-slate-300">
              {loading ? (
                // Skeleton Rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-5 px-5"><div className="h-4 w-4 bg-slate-800 rounded mx-auto" /></td>
                    <td className="py-5 px-4"><div className="h-4 w-16 bg-slate-800 rounded" /></td>
                    <td className="py-5 px-4"><div className="h-4 w-8 bg-slate-800 rounded mx-auto" /></td>
                    <td className="py-5 px-4"><div className="h-4 w-10 bg-slate-800 rounded mx-auto" /></td>
                    <td className="py-5 px-4"><div className="h-4 w-48 bg-slate-800 rounded" /></td>
                    <td className="py-5 px-4"><div className="h-4 w-28 bg-slate-800 rounded" /></td>
                    <td className="py-5 px-4"><div className="h-4 w-16 bg-slate-800 rounded ml-auto" /></td>
                    <td className="py-5 px-4"><div className="h-6 w-20 bg-slate-800 rounded-full mx-auto" /></td>
                  </tr>
                ))
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-semibold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-slate-600" />
                      <span>No se encontraron registros de notas de pago.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const isExpanded = !!expandedRows[row.id];
                  
                  return (
                    <Fragment key={row.id}>
                      {/* Base Row */}
                      <tr 
                        className={cn(
                          "hover:bg-[#0c162b]/40 transition-colors duration-200 cursor-pointer",
                          isExpanded && "bg-[#0b152d]/60 border-l-2 border-[#d40000]"
                        )}
                        onClick={() => toggleRow(row.id)}
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
                        <td className="py-4 px-4 font-mono font-bold text-white tracking-wide">{row.expediente}</td>
                        <td className="py-4 px-4 text-center font-semibold text-slate-400">{row.secuencia}</td>
                        <td className="py-4 px-4 text-center font-bold text-slate-400" title={row.rubro_nombre}>{row.rubro}</td>
                        <td className="py-4 px-4 max-w-[250px] truncate">
                          <p className="font-semibold text-slate-200 truncate flex items-center gap-1.5">
                            <User className="h-3 w-3 text-slate-500 shrink-0" />
                            {row.beneficiario || 'Sin beneficiario'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-semibold pl-4">RUC: {row.ruc || 'N/A'}</p>
                        </td>
                        <td className="py-4 px-4 max-w-[200px] truncate" title={row.num_doc}>
                          <p className="font-semibold text-slate-300 truncate">{row.num_doc || 'Sin documento'}</p>
                          <p className="text-[10px] text-slate-550">{row.fecha_doc || 'Sin fecha'}</p>
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-bold text-white">{formatMoney(row.monto)}</td>
                        <td className="py-4 px-4 text-center">{getStatusBadge(row.estado)}</td>
                      </tr>

                      {/* Expandable Details Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="p-0 bg-slate-950/45 border-b border-slate-800/40">
                            <div className="p-6 space-y-5 animate-in slide-in-from-top-2 duration-300">
                              {/* Glosa block */}
                              <div className="space-y-1.5">
                                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Glosa del Expediente / Detalle del Pago</span>
                                <div className="p-4 rounded-xl border border-slate-800 bg-[#091122]/70 text-slate-300 leading-relaxed font-sans text-xs shadow-inner">
                                  {row.glosa || 'No se ha registrado glosa para esta nota de pago.'}
                                </div>
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
                                {/* Doc details */}
                                <div className="space-y-2">
                                  <h4 className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-850 pb-1 flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                                    Información del Documento
                                  </h4>
                                  <div className="space-y-1.5 text-xs">
                                    <p className="text-slate-500 font-semibold">Código Doc: <span className="text-slate-300 font-mono font-bold">{row.cod_doc || 'N/A'}</span></p>
                                    <p className="text-slate-500 font-semibold">Fecha Emisión: <span className="text-slate-300">{row.fecha_doc || 'N/A'}</span></p>
                                    <p className="text-slate-500 font-semibold">Constancia Pago: <span className="text-slate-300 font-mono">{row.const_pago || 'N/A'}</span></p>
                                  </div>
                                </div>

                                {/* Bank details */}
                                <div className="space-y-2">
                                  <h4 className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-850 pb-1 flex items-center gap-1.5">
                                    <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                                    Detalle de Banco / Cheque
                                  </h4>
                                  <div className="space-y-1.5 text-xs">
                                    <p className="text-slate-500 font-semibold">Código Banco: <span className="text-slate-300 font-mono">{row.cod_doc_b || 'N/A'}</span></p>
                                    <p className="text-slate-500 font-semibold">Documento Banco: <span className="text-slate-300" title={row.nom_doc_b}>{row.nom_doc_b || 'N/A'}</span></p>
                                    <p className="text-slate-500 font-semibold">Fecha Banco: <span className="text-slate-300">{row.fec_doc_b || 'N/A'}</span></p>
                                  </div>
                                </div>

                                {/* Conformity details */}
                                <div className="space-y-2">
                                  <h4 className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-850 pb-1 flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
                                    Conformidad de Pago
                                  </h4>
                                  <div className="space-y-1.5 text-xs">
                                    <p className="text-slate-500 font-semibold">Doc Conformidad: <span className="text-slate-300" title={row.confor_doc}>{row.confor_doc || 'N/A'}</span></p>
                                    <p className="text-slate-500 font-semibold">Destinatario: <span className="text-slate-300" title={row.confor_des}>{row.confor_des || 'N/A'}</span></p>
                                    <p className="text-slate-500 font-semibold">Fecha Conformidad: <span className="text-slate-300">{row.confor_fec || 'N/A'}</span></p>
                                  </div>
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
        {!loading && rows.length > 0 && (
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
                className="p-2 rounded-lg border border-slate-800 bg-[#0b1329]/40 hover:bg-[#0b1329]/40 text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
