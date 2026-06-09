'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Printer,
  Eye,
  AlertTriangle,
  Search,
  CheckSquare,
  Square,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportCertificados } from '@/lib/excel-exports';

interface CertifRow {
  certif: string;
  secuencia: string;
  correlat: string;
  rubro: string;
  cod_doc: string;
  num_doc: string;
  fecha_doc: string;
  proveedor_ruc: string;
  proveedor_nombre: string;
  clasif: string;
  clasif_nombre: string;
  sec_func: string;
  meta_nombre: string;
  moneda: string;
  monto_orig: number;
  monto: number;
  fec_proc: string;
  etapa: string;
  tipo_reg: string;
  est_env: string;
  est_reg: string;
  meta_ppto?: string;
  meta_act_proy?: string;
  meta_componente?: string;
  meta_funcion?: string;
  meta_programa?: string;
  meta_subprograma?: string;
  meta_meta?: string;
  meta_finalidad?: string;
}

interface GroupedCertificate {
  certif: string;
  fecha_doc: string;
  cod_doc: string;
  num_doc: string;
  est_reg: string;
  proveedor_ruc: string;
  proveedor_nombre: string;
  montoTotal: number;
  metas: {
    sec_func: string;
    meta_nombre: string;
    ppto_cadena: string;
    rubros: {
      rubro: string;
      rubro_nombre: string;
      genericas: {
        codigo: string;
        nombre: string;
        detalles: {
          clasif: string;
          clasif_nombre: string;
          monto: number;
        }[];
      }[];
    }[];
  }[];
}

const formatMoney = (val: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);

function getMonthNameFromDate(dateStr: string): string {
  if (!dateStr) return '';
  let monthIndex = -1;
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length >= 2) {
      monthIndex = parseInt(parts[1], 10) - 1;
    }
  } else if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      monthIndex = parseInt(parts[1], 10) - 1;
    }
  }
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[monthIndex] || '';
}

const getGenericClassifierName = (clasif: string) => {
  const code = clasif.substring(0, 3);
  const mapping: Record<string, string> = {
    '2.0': 'RESERVA DE CONTINGENCIA',
    '2.1': 'PERSONAL Y OBLIGACIONES SOCIALES',
    '2.2': 'PENSIONES Y OTRAS PRESTACIONES SOCIALES',
    '2.3': 'BIENES Y SERVICIOS',
    '2.4': 'DONACIONES Y TRANSFERENCIAS',
    '2.5': 'OTROS GASTOS',
    '2.6': 'ADQUISICION DE ACTIVOS NO FINANCIEROS',
    '2.7': 'ADQUISICION DE ACTIVOS FINANCIEROS',
    '2.8': 'SERVICIO DE LA DEUDA PUBLICA',
  };
  return mapping[code] || 'OTROS GASTOS';
};

function formatFunctionalChain(c: CertifRow) {
  const ppto = c.meta_ppto ? String(c.meta_ppto).trim() : '';
  const actProy = c.meta_act_proy ? String(c.meta_act_proy).trim() : '';
  const prog = c.meta_programa ? String(c.meta_programa).trim() : '';
  const subprog = c.meta_subprograma ? String(c.meta_subprograma).trim() : '';
  const comp = c.meta_componente ? String(c.meta_componente).trim() : '';
  
  return `${ppto} . ${actProy} . ${prog} . ${subprog} .   . ${comp}`;
}

const groupCertificateRows = (certRows: CertifRow[], rubrosList: { codigo: string; nombre: string }[]): GroupedCertificate => {
  const first = certRows[0];
  const montoTotal = certRows.reduce((sum, r) => sum + r.monto, 0);

  const metaGroups: Record<string, {
    sec_func: string;
    meta_nombre: string;
    ppto_cadena: string;
    rows: CertifRow[];
  }> = {};

  certRows.forEach(r => {
    if (!metaGroups[r.sec_func]) {
      metaGroups[r.sec_func] = {
        sec_func: r.sec_func,
        meta_nombre: r.meta_nombre || '',
        ppto_cadena: formatFunctionalChain(r),
        rows: []
      };
    }
    metaGroups[r.sec_func].rows.push(r);
  });

  const metas = Object.values(metaGroups).map(mg => {
    const rubroGroups: Record<string, {
      rubro: string;
      rubro_nombre: string;
      rows: CertifRow[];
    }> = {};

    mg.rows.forEach(r => {
      if (!rubroGroups[r.rubro]) {
        const rubroObj = rubrosList.find(rub => rub.codigo === r.rubro);
        const rubroName = rubroObj ? rubroObj.nombre : 'RUBRO';
        rubroGroups[r.rubro] = {
          rubro: r.rubro,
          rubro_nombre: rubroName,
          rows: []
        };
      }
      rubroGroups[r.rubro].rows.push(r);
    });

    const rubroList = Object.values(rubroGroups).map(rg => {
      const genericGroups: Record<string, {
        codigo: string;
        nombre: string;
        detalles: {
          clasif: string;
          clasif_nombre: string;
          monto: number;
        }[];
      }> = {};

      rg.rows.forEach(r => {
        const genCode = r.clasif.substring(0, 3);
        if (!genericGroups[genCode]) {
          genericGroups[genCode] = {
            codigo: genCode,
            nombre: getGenericClassifierName(r.clasif),
            detalles: []
          };
        }
        genericGroups[genCode].detalles.push({
          clasif: r.clasif,
          clasif_nombre: r.clasif_nombre || '',
          monto: r.monto
        });
      });

      return {
        rubro: rg.rubro,
        rubro_nombre: rg.rubro_nombre,
        genericas: Object.values(genericGroups)
      };
    });

    return {
      sec_func: mg.sec_func,
      meta_nombre: mg.meta_nombre,
      ppto_cadena: mg.ppto_cadena,
      rubros: rubroList
    };
  });

  return {
    certif: first.certif,
    fecha_doc: first.fecha_doc,
    cod_doc: first.cod_doc,
    num_doc: first.num_doc,
    est_reg: first.est_reg,
    proveedor_ruc: first.proveedor_ruc,
    proveedor_nombre: first.proveedor_nombre,
    montoTotal,
    metas
  };
};

export default function CertificadosPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CertifRow[]>([]);
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Filters list
  const [rubros, setRubros] = useState<{ codigo: string; nombre: string }[]>([]);
  const [filterRubro, setFilterRubro] = useState('');
  const [search, setSearch] = useState('');

  // Destination option: 'previo' | 'impresora'
  const [destination, setDestination] = useState<'previo' | 'impresora'>('previo');
  
  // Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewGroups, setPreviewGroups] = useState<GroupedCertificate[]>([]);

  // Fetch certificates from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRubro) params.append('rubro', filterRubro);

      const res = await fetch(`/api/certificados?${params}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.rows || []);
        if (data.rubros) setRubros(data.rubros);
        
        // Do not auto-select all on load
        setSelectedIds(new Set());
      }
    } catch (e) {
      console.error('Error fetching certificates:', e);
    } finally {
      setLoading(false);
    }
  }, [filterRubro]);

  useEffect(() => {
    fetchData();
  }, [filterRubro, fetchData]);

  // Client-side search filter
  const displayRows = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.certif.toLowerCase().includes(q) ||
      r.proveedor_nombre.toLowerCase().includes(q) ||
      r.proveedor_ruc.includes(q) ||
      r.num_doc.toLowerCase().includes(q) ||
      r.clasif.toLowerCase().includes(q)
    );
  });

  // Toggle single row selection
  const handleToggleSelect = (certif: string, secuencia: string, correlat: string) => {
    const key = `${certif}-${secuencia}-${correlat}`;
    const next = new Set(selectedIds);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedIds(next);
  };

  // Toggle select all display rows
  const isAllSelected = displayRows.length > 0 && displayRows.every(r => selectedIds.has(`${r.certif}-${r.secuencia}-${r.correlat}`));
  const handleToggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (isAllSelected) {
      // Uncheck all in current view
      displayRows.forEach(r => next.delete(`${r.certif}-${r.secuencia}-${r.correlat}`));
    } else {
      // Check all in current view
      displayRows.forEach(r => next.add(`${r.certif}-${r.secuencia}-${r.correlat}`));
    }
    setSelectedIds(next);
  };

  // Printing logic
  const getSelectedRowsList = () => {
    return rows.filter(r => selectedIds.has(`${r.certif}-${r.secuencia}-${r.correlat}`));
  };

  const handlePrint = () => {
    const selected = getSelectedRowsList();
    if (selected.length === 0) {
      alert('Por favor seleccione al menos un certificado para imprimir.');
      return;
    }

    if (destination === 'previo') {
      const uniqueCertifs = Array.from(new Set(selected.map(r => r.certif)));
      const groups = uniqueCertifs.map(certNum => {
        const certRows = rows.filter(r => r.certif === certNum && r.etapa === 'CERTIFICACIÓN');
        const rowsToUse = certRows.length > 0 ? certRows : rows.filter(r => r.certif === certNum);
        return groupCertificateRows(rowsToUse, rubros);
      });
      setPreviewGroups(groups);
      setShowPreviewModal(true);
    } else {
      triggerExcelExport(selected);
    }
  };

  const handlePrintSingle = (certNum: string) => {
    const certRows = rows.filter(r => r.certif === certNum && r.etapa === 'CERTIFICACIÓN');
    const rowsToUse = certRows.length > 0 ? certRows : rows.filter(r => r.certif === certNum);
    if (rowsToUse.length === 0) {
      alert(`No se encontraron detalles para el certificado ${certNum}`);
      return;
    }
    const grouped = groupCertificateRows(rowsToUse, rubros);
    setPreviewGroups([grouped]);
    setShowPreviewModal(true);
  };

  const triggerExcelExport = (items: CertifRow[]) => {
    const mapped = items.map(r => ({
      ano_eje: '2026',
      sec_ejec: '301548',
      certif: r.certif,
      secuencia: r.secuencia,
      correlat: r.correlat,
      rubro: r.rubro,
      cod_doc: r.cod_doc,
      num_doc: r.num_doc,
      fecha_doc: r.fecha_doc,
      clasif: r.clasif,
      clasif_nombre: r.clasif_nombre,
      sec_func: r.sec_func,
      meta_nombre: r.meta_nombre,
      monto: r.monto,
      fec_proc: r.fec_proc,
      tipo_reg: r.tipo_reg,
      est_env: r.est_env,
      est_reg: r.est_reg
    }));

    // Call exportCertificados
    exportCertificados(
      'TODOS',
      'SELECCIÓN DE CERTIFICADOS PRESUPUESTALES',
      mapped,
      'reporte_certificados.xlsx'
    );
  };

  // Selected totals
  const selectedList = getSelectedRowsList();
  const selectedTotalMonto = selectedList.reduce((sum, r) => sum + r.monto, 0);

  return (
    <div className="w-full space-y-6">
      <div className="no-print w-full">
        {/* Outer VFP Window Wrapper with Double Border effect */}
        <div className="w-full rounded-xl border border-slate-700 p-0.5 bg-slate-900 shadow-2xl">
          <div className="w-full rounded-lg border border-slate-800 bg-[#070e1b] overflow-hidden flex flex-col">
          
          {/* Window Top Title / Metadata Banner */}
          <div className="bg-[#0c1938] border-b border-slate-700 px-4 py-2 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
                Certificaciones Presupuestales
              </span>
            </div>
            <div className="text-xs font-bold text-[#3b82f6] bg-blue-950/40 border border-blue-900/60 rounded px-2.5 py-0.5">
              301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA
            </div>
          </div>

          {/* Golden Yellow Banner */}
          <div className="bg-[#fef3c7] text-[#92400e] px-4 py-2.5 flex items-center justify-between shadow-sm select-none">
            <h2 className="font-extrabold text-sm tracking-wide uppercase flex items-center gap-2">
              SICONIS — Módulo de Certificaciones de Gasto
            </h2>
            <button 
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1 text-[11px] font-bold bg-[#92400e]/20 hover:bg-[#92400e]/30 text-[#92400e] rounded px-2.5 py-1 transition-all"
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
              Recargar
            </button>
          </div>

          {/* Main Layout: Grid Table (Left 9 cols) & Destinations Panel (Right 3 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-[#0a1426] flex-1 min-h-[500px]">
            
            {/* Left side: Search & Filter Toolbar + Table */}
            <div className="lg:col-span-9 flex flex-col space-y-4">
              
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#080f1d] border border-slate-800 p-3 rounded-lg">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                    <span>Rubro:</span>
                    <select 
                      value={filterRubro} 
                      onChange={e => setFilterRubro(e.target.value)}
                      className="bg-[#070e1b] border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-[11px] max-w-[180px]"
                    >
                      <option value="">Todos</option>
                      {rubros.map(r => (
                        <option key={r.codigo} value={r.codigo}>{r.codigo} - {r.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Buscar Certificado, RUC, Proveedor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded pl-8 pr-4 py-1 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-slate-500" />
                </div>
              </div>

              {/* Table Grid */}
              <div className="border border-slate-800 rounded-lg bg-[#080f1d] overflow-x-auto flex-1 max-h-[500px] relative">
                <table className="min-w-[850px] w-full text-left border-collapse table-fixed">
                  <thead className="sticky top-0 bg-[#0c182e] border-b border-slate-700 text-slate-400 text-[10px] uppercase font-black tracking-wider z-20 select-none">
                    <tr>
                      <th className="py-2.5 px-3 w-[45px] text-center">
                        <button 
                          onClick={handleToggleSelectAll}
                          className="text-slate-400 hover:text-white transition-colors"
                          title="Seleccionar Todos"
                        >
                          {isAllSelected ? (
                            <CheckSquare className="h-4 w-4 text-amber-400" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </th>
                      <th className="py-2.5 px-2 w-[60px] text-center">Periodo</th>
                      <th className="py-2.5 px-2 w-[60px] text-center">Entidad</th>
                      <th className="py-2.5 px-2 w-[85px] text-center">Certificado</th>
                      <th className="py-2.5 px-2 w-[85px] text-center">Fecha Doc.</th>
                      <th className="py-2.5 px-2 w-[50px] text-center">Doc</th>
                      <th className="py-2.5 px-2 w-[130px] text-center">Núm. Doc.</th>
                      <th className="py-2.5 px-3 text-right w-[120px]">Total Certif.</th>
                      <th className="py-2.5 px-2 w-[70px] text-center">Estado</th>
                      <th className="py-2.5 px-2 w-[85px] text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs font-semibold text-slate-300">
                    {loading ? (
                      Array.from({ length: 10 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td colSpan={10} className="py-3 px-4">
                            <div className="h-4 bg-slate-800 rounded w-full" />
                          </td>
                        </tr>
                      ))
                    ) : displayRows.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-20 text-center text-slate-500 font-bold">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <AlertTriangle className="h-8 w-8 text-slate-600" />
                            <span>No se encontraron certificados correspondientes.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      displayRows.map((r) => {
                        const isChecked = selectedIds.has(`${r.certif}-${r.secuencia}-${r.correlat}`);
                        return (
                          <tr 
                            key={`${r.certif}-${r.secuencia}-${r.correlat}`}
                            onClick={() => handleToggleSelect(r.certif, r.secuencia, r.correlat)}
                            className={cn(
                              "cursor-pointer transition-all select-none",
                              isChecked 
                                ? "bg-amber-400/10 text-slate-100 font-bold" 
                                : "even:bg-[#070e1a]/50 text-slate-300 hover:bg-[#112240]"
                            )}
                          >
                            <td className="py-2 px-3 text-center" onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSelect(r.certif, r.secuencia, r.correlat);
                            }}>
                              {isChecked ? (
                                <CheckSquare className="h-4 w-4 text-amber-400 mx-auto" />
                              ) : (
                                <Square className="h-4 w-4 text-slate-500 mx-auto" />
                              )}
                            </td>
                            <td className="py-2 px-2 text-center font-mono text-[11px]">2026</td>
                            <td className="py-2 px-2 text-center font-mono text-[11px]">301548</td>
                            <td className="py-2 px-2 text-center font-mono text-[11px] font-bold text-white">{r.certif}</td>
                            <td className="py-2 px-2 text-center font-mono text-[11px]">{r.fecha_doc}</td>
                            <td className="py-2 px-2 text-center font-mono text-[11px]">{r.cod_doc}</td>
                            <td className="py-2 px-2 text-center font-mono text-[11px] truncate" title={r.num_doc}>{r.num_doc}</td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-400">{formatMoney(r.monto)}</td>
                            <td className="py-2 px-2 text-center font-mono text-[11px]">
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-extrabold",
                                r.est_reg === 'A' ? "bg-emerald-950 text-emerald-400 border border-emerald-900" : "bg-slate-900 text-slate-400 border border-slate-800"
                              )}>
                                {r.est_reg === 'A' ? 'APROB.' : r.est_reg || 'N/A'}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center font-mono text-[11px]" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handlePrintSingle(r.certif)}
                                className="p-1 rounded bg-slate-850 hover:bg-slate-700 text-slate-300 hover:text-white transition-all animate-none"
                                title="Ver/Imprimir Nota de Certificación"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Right side: Options / Print configuration panel */}
            <div className="lg:col-span-3 flex flex-col justify-between border border-slate-800 rounded-lg p-4 bg-[#080f1d] select-none">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4">
                    Destino del Reporte
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-slate-200">
                      <input
                        type="radio"
                        name="print-dest"
                        value="previo"
                        checked={destination === 'previo'}
                        onChange={() => setDestination('previo')}
                        className="text-[#f59e0b] focus:ring-[#f59e0b] bg-slate-900 border-slate-700"
                      />
                      <span className="flex items-center gap-1.5">
                        <Eye className="h-4 w-4 text-blue-400" />
                        Previo (Pantalla)
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-slate-200">
                      <input
                        type="radio"
                        name="print-dest"
                        value="impresora"
                        checked={destination === 'impresora'}
                        onChange={() => setDestination('impresora')}
                        className="text-[#f59e0b] focus:ring-[#f59e0b] bg-slate-900 border-slate-700"
                      />
                      <span className="flex items-center gap-1.5">
                        <Printer className="h-4 w-4 text-emerald-400" />
                        Impresora (Excel)
                      </span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-2 text-[11px] text-slate-400 font-mono">
                  <div>Periodo: <span className="text-white font-extrabold">2026</span></div>
                  <div>Entidad: <span className="text-white font-extrabold">301548</span></div>
                  <div>Rubro: <span className="text-white font-extrabold">{filterRubro || 'TODOS'}</span></div>
                  <div>Seleccionados: <span className="text-[#f59e0b] font-extrabold">{selectedList.length}</span></div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-800">
                <div className="bg-slate-950/60 border border-slate-850 p-2.5 rounded text-center">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Monto Seleccionado
                  </div>
                  <div className="font-mono text-emerald-400 text-sm font-black">
                    {formatMoney(selectedTotalMonto)}
                  </div>
                </div>

                <button
                  onClick={handlePrint}
                  disabled={loading || selectedList.length === 0}
                  className="w-full flex items-center justify-center gap-2 text-xs font-black py-2.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Printer className="h-4 w-4" />
                  IMPRIMIR
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
      </div>

      {/* Previo / Print Preview Dialog Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print-backdrop-override animate-in fade-in duration-300">
          <div className="w-full max-w-4xl rounded-xl border border-slate-700 p-0.5 bg-slate-900 shadow-2xl print-window-override">
            <div className="rounded-lg border border-slate-800 bg-[#070e1b] overflow-hidden flex flex-col max-h-[90vh] print-content-override">
              
              {/* Header */}
              <div className="bg-[#0c1938] border-b border-slate-700 px-4 py-3.5 flex items-center justify-between select-none no-print">
                <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
                  Vista Previa de Reporte: Nota de Certificación Presupuestal
                </span>
                <button 
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Printable Body Content (Simulated retro print output) */}
              <div className="p-6 overflow-y-auto bg-slate-950 flex-1 flex flex-col items-center gap-6 select-text max-h-[70vh] print:p-0 print:bg-white print:max-h-none print:overflow-visible">
                
                {/* Print media override stylesheet */}
                <style dangerouslySetInnerHTML={{ __html: `
                  @media print {
                    /* Hide Next.js global wrappers */
                    header, nav, aside, footer, button, select, input,
                    .no-print, [aria-hidden="true"], 
                    .accent-glow, [style*="radial-gradient"], [style*="linear-gradient"] {
                      display: none !important;
                    }
                    
                    html, body, #__next, #root, [class*="min-h-screen"], main, div {
                      background: transparent !important;
                      box-shadow: none !important;
                      margin: 0 !important;
                      padding: 0 !important;
                      border: none !important;
                      width: auto !important;
                      height: auto !important;
                      min-height: 0 !important;
                    }

                    .print-backdrop-override {
                      position: absolute !important;
                      inset: 0 !important;
                      background: transparent !important;
                      backdrop-filter: none !important;
                      padding: 0 !important;
                      overflow: visible !important;
                      display: block !important;
                    }

                    .print-window-override {
                      border: none !important;
                      background: transparent !important;
                      box-shadow: none !important;
                      padding: 0 !important;
                      max-width: 100% !important;
                    }

                    .print-content-override {
                      border: none !important;
                      background: transparent !important;
                      max-height: none !important;
                      overflow: visible !important;
                    }

                    #printable-area {
                      display: block !important;
                      position: absolute !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100% !important;
                      z-index: 99999 !important;
                    }

                    .print-page-sheet {
                      background: white !important;
                      color: black !important;
                      box-shadow: none !important;
                      border: none !important;
                      padding: 1.5cm !important;
                      margin: 0 !important;
                      page-break-after: always !important;
                      width: 100% !important;
                      max-width: 100% !important;
                    }

                    .print-page-sheet:last-child {
                      page-break-after: avoid !important;
                    }
                  }
                `}} />

                {/* Printable container wrapper */}
                <div id="printable-area" className="w-full flex flex-col items-center gap-6 print:gap-0">
                  {previewGroups.map((cert, pageIdx) => (
                    <div 
                      key={cert.certif} 
                      className="print-page-sheet w-full max-w-[21cm] bg-white text-black p-8 shadow-xl rounded-sm border border-slate-300 font-mono text-[11px] leading-relaxed relative flex flex-col"
                      style={{ minHeight: '29.7cm' }}
                    >
                      {/* Top Header info */}
                      <div className="flex justify-between items-start text-[10px] font-bold text-slate-800">
                        <div>
                          <div>SIAF</div>
                          <div>Versión 1.0.0</div>
                        </div>
                        <div className="text-right">
                          <div>Fecha: {new Date().toLocaleDateString('es-PE')}</div>
                          <div>Hora: {new Date().toLocaleTimeString('es-PE')}</div>
                          <div>Página: {pageIdx + 1} de {previewGroups.length}</div>
                        </div>
                      </div>

                      {/* Main Title */}
                      <div className="text-center my-6">
                        <div className="font-extrabold text-sm tracking-wider">CERTIFICACIÓN DE CREDITO PRESUPUESTARIO</div>
                        <div className="font-extrabold text-sm tracking-widest my-0.5">NOTA Nº {cert.certif}</div>
                        <div className="text-[10px]">(EN SOLES)</div>
                      </div>

                      {/* Top dotted border */}
                      <div className="border-t border-dashed border-black my-2"></div>

                      {/* Metadata Table */}
                      <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 my-3 text-[11px]">
                        <div className="flex"><span className="font-bold w-44">PLEGO :</span><span>01 - HUANCABAMBA</span></div>
                        <div className="flex"><span className="font-bold w-44">ESTADO CERTIFICACION :</span><span>{cert.est_reg === 'A' || cert.est_reg === 'APROBADO' ? 'APROBADO' : cert.est_reg}</span></div>
                        <div className="flex"><span className="font-bold w-44">EJECUTORA :</span><span>MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA [301548]</span></div>
                        <div className="flex"><span className="font-bold w-44">Nº DE DOC. :</span><span className="truncate max-w-[250px]">{cert.num_doc}</span></div>
                        <div className="flex"><span className="font-bold w-44">MES :</span><span>{getMonthNameFromDate(cert.fecha_doc)}</span></div>
                        <div className="flex"><span className="font-bold w-44">TIPO DOCUMENTO :</span><span>{cert.cod_doc}</span></div>
                        <div className="flex"><span className="font-bold w-44">FECHA DE DOCUMENTO :</span><span>{cert.fecha_doc}</span></div>
                      </div>

                      {/* Middle dotted border */}
                      <div className="border-t border-dashed border-black my-2"></div>

                      {/* Column Headers */}
                      <div className="flex justify-between font-bold text-[10px] uppercase py-1 border-b border-dashed border-black">
                        <div>Meta  Rubro   Clasificador</div>
                        <div className="w-32 text-right">Monto</div>
                      </div>

                      {/* Tree Content Details */}
                      <div className="flex-1 py-3 space-y-3">
                        {cert.metas.map((m) => (
                          <div key={m.sec_func} className="space-y-1.5">
                            {/* Meta Group Header */}
                            <div className="flex justify-between text-[11px]">
                              <div className="font-extrabold flex gap-2 items-center flex-wrap">
                                <span className="text-black bg-slate-200 px-1 rounded text-[10px] font-bold">{m.sec_func}</span>
                                <span>{m.ppto_cadena}</span>
                                <span className="font-bold text-slate-800">— {m.meta_nombre}</span>
                              </div>
                            </div>

                            {m.rubros.map((r) => (
                              <div key={r.rubro} className="space-y-1.5 pl-6 border-l border-slate-300">
                                {/* Rubro Group Header */}
                                <div className="flex font-extrabold text-[10.5px] text-slate-800 gap-2 items-center">
                                  <span className="bg-slate-100 border border-slate-300 px-1 rounded text-[9.5px] font-black">{r.rubro}</span>
                                  <span>{r.rubro_nombre}</span>
                                </div>

                                {r.genericas.map((g) => (
                                  <div key={g.codigo} className="space-y-1 pl-6">
                                    {/* Generica Group Header */}
                                    <div className="flex font-bold text-[10px] text-slate-700 gap-2">
                                      <span className="bg-slate-100 border border-slate-200 px-0.5 rounded">{g.codigo}</span>
                                      <span>{g.nombre}</span>
                                    </div>

                                    {/* Specific Detail Lines */}
                                    <div className="space-y-0.5 pl-6">
                                      {g.detalles.map((d, idx) => (
                                        <div key={idx} className="flex justify-between text-[10.5px] text-slate-900 font-mono py-0.5 hover:bg-slate-100">
                                          <div className="flex-1 pr-6 flex gap-2">
                                            <span className="font-bold">{d.clasif}</span>
                                            <span className="text-slate-800">{d.clasif_nombre}</span>
                                          </div>
                                          <div className="w-32 text-right font-bold tabular-nums">
                                            {formatMoney(d.monto)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>

                      {/* Bottom dotted border */}
                      <div className="border-t border-dashed border-black my-2"></div>

                      {/* Total */}
                      <div className="flex justify-between items-center py-1.5 font-bold">
                        <div className="text-[11px] font-black uppercase">TOTAL CERTIFICACION :</div>
                        <div className="w-36 text-right border-b-[3px] border-double border-black font-extrabold text-sm tabular-nums">
                          {formatMoney(cert.montoTotal)}
                        </div>
                      </div>

                      <div className="border-t border-dashed border-black my-2"></div>

                      {/* Sello y firma */}
                      <div className="mt-16 flex justify-end">
                        <div className="text-center w-64 border-t border-black pt-1.5">
                          <div className="font-bold text-[10px] text-slate-850">Presupuesto y Planificación</div>
                          <div className="text-[10px] text-slate-600">Sello y firma</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Action bar */}
              <div className="bg-[#0a1426] border-t border-slate-700 px-6 py-4 flex items-center justify-between select-none no-print">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 rounded border border-slate-700 bg-slate-950/40 hover:bg-slate-900/40 text-slate-300 hover:text-white transition-all text-xs font-bold"
                >
                  CERRAR
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      triggerExcelExport(selectedList);
                      setShowPreviewModal(false);
                    }}
                    className="flex items-center gap-2 text-xs font-bold py-2 px-4 rounded border border-emerald-800 hover:bg-emerald-950/20 text-emerald-400 transition-all"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    DESCARGAR EXCEL
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 text-xs font-black py-2 px-6 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all shadow-md"
                  >
                    <Printer className="h-4 w-4" />
                    IMPRIMIR DOCUMENTO
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
