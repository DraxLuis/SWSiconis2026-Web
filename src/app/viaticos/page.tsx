'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportViaticos } from '@/lib/excel-exports';

interface ViaticoSummaryRow {
  expediente: string;
  giro: number;
  devolucion: number;
  rendicion: number;
  saldo: number;
}

interface ViaticoDetailRow {
  sec_reg: string;
  corr: string;
  cod_doc: string;
  num_doc: string;
  fecha_doc: string;
  girado: number;
  devolucion: number;
  rendicion: number;
  estado: string;
}

const formatMoney = (val: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);

export default function ViaticosPage() {
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [summaryRows, setSummaryRows] = useState<ViaticoSummaryRow[]>([]);
  const [selectedRow, setSelectedRow] = useState<ViaticoSummaryRow | null>(null);
  const [detailRows, setDetailRows] = useState<ViaticoDetailRow[]>([]);
  
  // Overall Master Totals
  const [totals, setTotals] = useState({
    giro: 0,
    devolucion: 0,
    rendicion: 0,
    saldo: 0
  });

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch('/api/viaticos');
      const data = await res.json();
      if (data.success) {
        const rows = data.rows || [];
        setSummaryRows(rows);
        setTotals(data.totals || { giro: 0, devolucion: 0, rendicion: 0, saldo: 0 });

        // Auto-select first row if exists
        if (rows.length > 0) {
          // If we had a previously selected expediente, try to find it again
          const previousExp = selectedRow?.expediente;
          const match = rows.find((r: ViaticoSummaryRow) => r.expediente === previousExp);
          if (match) {
            setSelectedRow(match);
          } else {
            setSelectedRow(rows[0]);
          }
        } else {
          setSelectedRow(null);
          setDetailRows([]);
        }
      }
    } catch (e) {
      console.error('Error fetching viaticos summary:', e);
    } finally {
      setLoadingSummary(false);
    }
  }, [selectedRow?.expediente]);

  const fetchDetails = useCallback(async (exp: string) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/viaticos?expediente=${exp}`);
      const data = await res.json();
      if (data.success) {
        setDetailRows(data.rows || []);
      } else {
        setDetailRows([]);
      }
    } catch (e) {
      console.error('Error fetching viaticos details:', e);
      setDetailRows([]);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  // Fetch summary on mount
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Fetch details when selection changes
  useEffect(() => {
    if (selectedRow) {
      fetchDetails(selectedRow.expediente);
    } else {
      setDetailRows([]);
    }
  }, [selectedRow, fetchDetails]);

  const handleExportExcel = () => {
    if (summaryRows.length > 0) {
      exportViaticos(summaryRows);
    }
  };

  // Selected Expediente Totals
  const selectedDetailsTotals = detailRows.reduce((sums, r) => {
    return {
      girado: sums.girado + r.girado,
      devolucion: sums.devolucion + r.devolucion,
      rendicion: sums.rendicion + r.rendicion
    };
  }, { girado: 0, devolucion: 0, rendicion: 0 });

  return (
    <div className="w-full space-y-6">
      {/* Outer VFP Window Wrapper */}
      <div className="w-full rounded-xl border border-slate-700 bg-[#070e1b] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Window Top Title / Metadata Banner */}
        <div className="bg-[#0c1938] border-b border-slate-700 px-4 py-2 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
              Viáticos y Encargos
            </span>
          </div>
          <div className="text-xs font-bold text-[#3b82f6] bg-blue-950/40 border border-blue-900/60 rounded px-2.5 py-0.5">
            301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA
          </div>
        </div>

        {/* Mint Green Banner */}
        <div className="bg-[#a7f3d0] text-[#064e3b] px-4 py-2.5 flex items-center justify-between shadow-sm select-none">
          <h2 className="font-extrabold text-sm tracking-wide uppercase flex items-center gap-2">
            Ejecución Presupuestal - Viáticos y Encargos - 2026
          </h2>
          <button 
            onClick={fetchSummary}
            className="flex items-center gap-1 text-[11px] font-bold bg-[#064e3b] hover:bg-[#064e3b]/90 text-white rounded px-2 py-0.5 transition-all"
          >
            <RefreshCw className={cn("h-3 w-3", loadingSummary && "animate-spin")} />
            Recargar
          </button>
        </div>

        {/* Master-Detail Layout Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-[#0a1426] flex-1 min-h-[500px]">
          
          {/* Left Master Grid (Resumen) - 5 cols */}
          <div className="lg:col-span-5 flex flex-col border border-slate-800 rounded-lg bg-[#080f1d] overflow-hidden">
            <div className="bg-[#0c182e] border-b border-slate-800 px-3 py-2 select-none">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                Listado Resumen por Expediente
              </span>
            </div>
            
            <div className="w-full max-w-full overflow-auto flex-1 max-h-[550px] relative">
              <table className="min-w-[505px] w-full text-left border-collapse table-fixed">
                <thead className="sticky top-0 bg-[#0d1c36] border-b border-slate-700 text-slate-400 text-[9px] uppercase font-black tracking-wider z-20 select-none">
                  <tr>
                    <th className="py-2 px-1 w-[25px]"></th>
                    <th className="py-2 px-2 w-[80px] text-center">Expediente</th>
                    <th className="py-2 px-2 w-[100px] text-right">Mto. Giro</th>
                    <th className="py-2 px-2 w-[100px] text-right">Mto. Devoluc.</th>
                    <th className="py-2 px-2 w-[100px] text-right">Mto. Rendic.</th>
                    <th className="py-2 px-2 w-[100px] text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs font-semibold text-slate-300">
                  {loadingSummary ? (
                    Array.from({ length: 8 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td colSpan={6} className="py-2.5 px-3"><div className="h-4 bg-slate-800 rounded w-full" /></td>
                      </tr>
                    ))
                  ) : summaryRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-500 font-bold">
                        No se encontraron registros de viáticos.
                      </td>
                    </tr>
                  ) : (
                    summaryRows.map((r) => {
                      const isSelected = selectedRow?.expediente === r.expediente;
                      return (
                        <tr 
                          key={r.expediente}
                          onClick={() => setSelectedRow(r)}
                          className={cn(
                            "cursor-pointer transition-all select-none",
                            isSelected 
                              ? "bg-[#f59e0b] text-[#070e1b] font-bold" 
                              : "even:bg-[#070e1a]/50 text-slate-300 hover:bg-[#112240]"
                          )}
                        >
                          <td className="py-1.5 px-1 text-center font-black">
                            {isSelected && <span className="text-red-600">▶</span>}
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono text-[11px] font-bold">{r.expediente}</td>
                          <td className={cn("py-1.5 px-2 text-right font-mono text-[11px]", isSelected ? "text-[#070e1b]" : "text-emerald-400")}>
                            {formatMoney(r.giro)}
                          </td>
                          <td className={cn("py-1.5 px-2 text-right font-mono text-[11px]", isSelected ? "text-[#070e1b]" : "text-amber-400")}>
                            {formatMoney(r.devolucion)}
                          </td>
                          <td className={cn("py-1.5 px-2 text-right font-mono text-[11px]", isSelected ? "text-[#070e1b]" : "text-sky-400")}>
                            {formatMoney(r.rendicion)}
                          </td>
                          <td className={cn("py-1.5 px-2 text-right font-mono text-[11px]", isSelected ? "text-[#070e1b]" : "text-slate-200")}>
                            {formatMoney(r.saldo)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Left Grid Footer (Master Totals) */}
            <div className="bg-[#0c182e] border-t border-slate-800 p-2 grid grid-cols-12 text-[10px] font-black text-slate-300 select-none">
              <div className="col-span-4 flex items-center justify-center text-slate-400 uppercase tracking-widest text-[9px]">
                TOTALES GLOBAL:
              </div>
              <div className="col-span-2 text-right font-mono text-emerald-400 font-extrabold text-[11px] truncate px-1">
                {formatMoney(totals.giro)}
              </div>
              <div className="col-span-2 text-right font-mono text-amber-400 font-extrabold text-[11px] truncate px-1">
                {formatMoney(totals.devolucion)}
              </div>
              <div className="col-span-2 text-right font-mono text-sky-400 font-extrabold text-[11px] truncate px-1">
                {formatMoney(totals.rendicion)}
              </div>
              <div className="col-span-2 text-right font-mono text-[#f59e0b] font-extrabold text-[11px] truncate px-1">
                {formatMoney(totals.saldo)}
              </div>
            </div>
          </div>

          {/* Right Detail Grid - 7 cols */}
          <div className="lg:col-span-7 flex flex-col border border-slate-800 rounded-lg bg-[#080f1d] overflow-hidden">
            <div className="bg-[#0c182e] border-b border-slate-800 px-3 py-2 flex items-center justify-between select-none">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                Detalle del Expediente: <span className="font-mono text-white font-extrabold">{selectedRow?.expediente || 'Ninguno'}</span>
              </span>
              {selectedRow && (
                <span className="text-[10px] font-bold text-slate-500">
                  Saldo Expediente: <span className="font-mono text-slate-300 font-extrabold">{formatMoney(selectedRow.saldo)}</span>
                </span>
              )}
            </div>

            <div className="w-full max-w-full overflow-auto flex-1 max-h-[550px] relative">
              <table className="min-w-[765px] w-full text-left border-collapse table-fixed">
                <thead className="sticky top-0 bg-[#0d1c36] border-b border-slate-700 text-slate-400 text-[9px] uppercase font-black tracking-wider z-20 select-none">
                  <tr>
                    <th className="py-2 px-2 w-[50px] text-center">Sec.</th>
                    <th className="py-2 px-2 w-[50px] text-center">Corr.</th>
                    <th className="py-2 px-2 w-[55px] text-center">Doc.</th>
                    <th className="py-2 px-3 w-[150px] text-center">Num.Doc.</th>
                    <th className="py-2 px-2 w-[90px] text-center">Fecha Doc.</th>
                    <th className="py-2 px-2 w-[110px] text-right">Girado</th>
                    <th className="py-2 px-2 w-[110px] text-right">Devolución</th>
                    <th className="py-2 px-2 w-[110px] text-right">Rendición</th>
                    <th className="py-2 px-2 w-[40px] text-center">Est.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs font-semibold text-slate-300">
                  {loadingDetails ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td colSpan={9} className="py-2.5 px-3"><div className="h-4 bg-slate-800 rounded w-full" /></td>
                      </tr>
                    ))
                  ) : !selectedRow ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-slate-500 font-bold">
                        Seleccione un expediente de la lista resumen para ver su ejecución detallada.
                      </td>
                    </tr>
                  ) : detailRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-slate-500 font-bold">
                        No hay movimientos de giro ni rendición para este expediente.
                      </td>
                    </tr>
                  ) : (
                    detailRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-[#112240] even:bg-[#070e1a]/30 transition-all">
                        <td className="py-1.5 px-2 text-center font-mono text-[11px]">{r.sec_reg}</td>
                        <td className="py-1.5 px-2 text-center font-mono text-[11px]">{r.corr}</td>
                        <td className="py-1.5 px-2 text-center font-mono text-[11px]">{r.cod_doc}</td>
                        <td className="py-1.5 px-3 text-center font-mono text-[11px] font-bold truncate" title={r.num_doc}>{r.num_doc}</td>
                        <td className="py-1.5 px-2 text-center font-mono text-[11px]">{r.fecha_doc}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-[11px] text-emerald-400 font-bold">
                          {r.girado > 0 ? formatMoney(r.girado) : '—'}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-[11px] text-amber-400 font-bold">
                          {r.devolucion > 0 ? formatMoney(r.devolucion) : '—'}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-[11px] text-sky-400 font-bold">
                          {r.rendicion > 0 ? formatMoney(r.rendicion) : '—'}
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono text-[11px]">{r.estado}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Right Grid Footer (Selected Exp Totals) */}
            <div className="bg-[#0c182e] border-t border-slate-800 p-2 grid grid-cols-12 text-[10px] font-black text-slate-300 select-none">
              <div className="col-span-5 flex items-center justify-center text-slate-400 uppercase tracking-widest text-[9px]">
                TOTAL EXPEDIENTE:
              </div>
              <div className="col-span-1"></div>
              <div className="col-span-2 text-right font-mono text-emerald-400 font-extrabold text-[11px] truncate px-1">
                {selectedRow ? formatMoney(selectedDetailsTotals.girado) : '0.00'}
              </div>
              <div className="col-span-2 text-right font-mono text-amber-400 font-extrabold text-[11px] truncate px-1">
                {selectedRow ? formatMoney(selectedDetailsTotals.devolucion) : '0.00'}
              </div>
              <div className="col-span-2 text-right font-mono text-sky-400 font-extrabold text-[11px] truncate px-1">
                {selectedRow ? formatMoney(selectedDetailsTotals.rendicion) : '0.00'}
              </div>
            </div>
          </div>

        </div>

        {/* Footer Sum & Action Panel */}
        <div className="bg-[#0c1938] border-t border-slate-700 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Excel Export Button */}
            <button
              onClick={handleExportExcel}
              disabled={loadingSummary || summaryRows.length === 0}
              className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg border border-emerald-800 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 hover:text-emerald-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar RESUMEN a EXCEL
            </button>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              SICONIS 2026 · TESORERÍA
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm font-black text-slate-300 select-none bg-slate-950/60 border border-slate-800 px-4 py-1.5 rounded-lg">
            <span>RESUMEN SALDO GENERAL:</span>
            <span className="font-mono text-[#f59e0b] text-base">{formatMoney(totals.saldo)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
