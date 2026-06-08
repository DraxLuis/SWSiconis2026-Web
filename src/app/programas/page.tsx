'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  X,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  exportEjecucionPPTO,
  exportCertificados,
  exportDevengados,
  exportGiros,
  exportGirosConGlosa
} from '@/lib/excel-exports';

interface ProgramRow {
  codigo: string;
  nombre: string;
  pia: number;
  modif: number;
  pim: number;
  certif: number;
  cpanua: number;
  atcp: number;
  devengado: number;
  girado: number;
  saldo: number;
  avance: number;
}

interface ProgramTotals {
  pia: number;
  modif: number;
  pim: number;
  certif: number;
  cpanua: number;
  atcp: number;
  devengado: number;
  girado: number;
  saldo: number;
  avance: number;
}

const formatMoney = (val: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);

export default function ProgramasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [rows, setRows] = useState<ProgramRow[]>([]);
  const [totals, setTotals] = useState<ProgramTotals>({
    pia: 0,
    modif: 0,
    pim: 0,
    certif: 0,
    cpanua: 0,
    atcp: 0,
    devengado: 0,
    girado: 0,
    saldo: 0,
    avance: 0
  });
  const [selectedRow, setSelectedRow] = useState<ProgramRow | null>(null);

  const fetchProgramas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/programas');
      const data = await res.json();
      if (data.success) {
        setRows(data.rows || []);
        setTotals(data.totals || {
          pia: 0,
          modif: 0,
          pim: 0,
          certif: 0,
          cpanua: 0,
          atcp: 0,
          devengado: 0,
          girado: 0,
          saldo: 0,
          avance: 0
        });
        if (data.rows.length > 0) {
          setSelectedRow(data.rows[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching programs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgramas();
  }, []);

  // Excel exports handlers
  const handleExportPPTO = () => {
    exportEjecucionPPTO(rows);
  };

  const handleExportCertificados = async () => {
    if (!selectedRow) return;
    setExporting('certificados');
    try {
      const res = await fetch(`/api/certificados?programa=${selectedRow.codigo}`);
      const data = await res.json();
      if (data.success) {
        exportCertificados(selectedRow.codigo, selectedRow.nombre, data.rows || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(null);
    }
  };

  const handleExportDevengados = async () => {
    if (!selectedRow) return;
    setExporting('devengados');
    try {
      const res = await fetch(`/api/expedientes?fase=D&programa=${selectedRow.codigo}`);
      const data = await res.json();
      if (data.success) {
        exportDevengados(selectedRow.codigo, selectedRow.nombre, data.rows || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(null);
    }
  };

  const handleExportGiros = async () => {
    if (!selectedRow) return;
    setExporting('giros');
    try {
      const res = await fetch(`/api/expedientes?fase=G&programa=${selectedRow.codigo}`);
      const data = await res.json();
      if (data.success) {
        exportGiros(selectedRow.codigo, selectedRow.nombre, data.rows || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(null);
    }
  };

  const handleExportGirosConGlosa = async () => {
    if (!selectedRow) return;
    setExporting('giros-con-glosa');
    try {
      const res = await fetch(`/api/expedientes?fase=G&programa=${selectedRow.codigo}`);
      const data = await res.json();
      if (data.success) {
        exportGirosConGlosa(selectedRow.codigo, selectedRow.nombre, data.rows || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 space-y-6">
      {/* Outer VFP Window Wrapper - SOLID BACKGROUND, NO TRANSPARENCY OVERLAPS */}
      <div className="rounded-xl border border-slate-700 bg-[#070e1b] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Window Top Title / Metadata Banner */}
        <div className="bg-[#0c1938] border-b border-slate-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
              Ejecución Presupuestal: Programa Presupuestal
            </span>
          </div>
          <div className="text-xs font-bold text-[#d40000] bg-red-950/40 border border-red-900/60 rounded px-2.5 py-0.5">
            301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA
          </div>
        </div>

        {/* Inner Header Banner - Light teal solid background, no transparency */}
        <div className="bg-[#4fbfa8] text-[#070e1b] px-4 py-2.5 flex items-center justify-between shadow-md">
          <h2 className="font-extrabold text-sm tracking-wide uppercase">
            Ejecución Presupuestal - Programa Presupuestal - 2026
          </h2>
          <button 
            onClick={() => router.push('/')}
            className="p-1 rounded hover:bg-black/10 transition-colors"
            title="Volver"
          >
            <X className="h-4 w-4 stroke-[3]" />
          </button>
        </div>

        {/* Content Body - Solid dark container */}
        <div className="p-4 bg-[#0a1426] flex flex-col space-y-4">
          
          {/* Table Header Controls (Excel button, Refresh button) */}
          <div className="flex justify-between items-center bg-[#070e1b] p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Play className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400" />
              Selecciona un programa para ver sus detalles o exportar reportes.
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportPPTO}
                disabled={loading || rows.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-100 text-xs font-bold rounded border border-emerald-500/30 transition-all shadow"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Ejecucion_PPTO
              </button>
              <button 
                onClick={fetchProgramas} 
                disabled={loading}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-all"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
              </button>
            </div>
          </div>

          {/* Budget Execution Table - SOLID BACKGROUND */}
          <div className="rounded-lg border border-slate-800 bg-[#070e1b] overflow-hidden">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#0f1d3a] text-slate-300 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-800">
                  <tr>
                    <th className="w-10 text-center py-2.5 px-2"></th>
                    <th className="py-2.5 px-4 text-left font-bold">Programa Presupuestal</th>
                    <th className="py-2.5 px-4 text-right w-44 font-bold">PIM</th>
                    <th className="py-2.5 px-4 text-right w-44 font-bold">Devengado</th>
                    <th className="py-2.5 px-4 text-right w-44 font-bold">Girado</th>
                    <th className="py-2.5 px-4 text-right w-44 font-bold">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="bg-[#070e1b]">
                        <td className="py-3 px-2 text-center"><div className="w-4 h-4 bg-slate-800 rounded animate-pulse" /></td>
                        <td className="py-3 px-4"><div className="h-4 bg-slate-800 rounded w-3/4 animate-pulse" /></td>
                        <td className="py-3 px-4"><div className="h-4 bg-slate-800 rounded w-20 ml-auto animate-pulse" /></td>
                        <td className="py-3 px-4"><div className="h-4 bg-slate-800 rounded w-20 ml-auto animate-pulse" /></td>
                        <td className="py-3 px-4"><div className="h-4 bg-slate-800 rounded w-20 ml-auto animate-pulse" /></td>
                        <td className="py-3 px-4"><div className="h-4 bg-slate-800 rounded w-20 ml-auto animate-pulse" /></td>
                      </tr>
                    ))
                  ) : rows.length === 0 ? (
                    <tr className="bg-[#070e1b]">
                      <td colSpan={6} className="py-16 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-3">
                          <AlertTriangle className="h-8 w-8 text-amber-500" />
                          <span className="font-semibold text-sm">No se encontraron programas presupuestales.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const isSelected = selectedRow?.codigo === row.codigo;
                      return (
                        <tr
                          key={row.codigo}
                          className={cn(
                            'cursor-pointer transition-colors duration-150',
                            isSelected 
                              ? 'bg-[#f59e0b] text-[#070e1b] font-bold shadow-lg' // VFP gold highlight
                              : 'bg-[#070e1b] text-slate-200 hover:bg-slate-800/40'
                          )}
                          onClick={() => setSelectedRow(row)}
                        >
                          {/* VFP active row selector ▶ */}
                          <td className="text-center py-2.5 px-2 font-black select-none">
                            {isSelected && <span className="text-red-600">▶</span>}
                          </td>
                          <td className="py-2.5 px-4 font-mono">
                            {row.codigo} {row.nombre}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-medium">
                            {formatMoney(row.pim)}
                          </td>
                          <td className={cn(
                            "py-2.5 px-4 text-right font-mono font-bold",
                            isSelected ? "text-[#070e1b]" : "text-red-400"
                          )}>
                            {formatMoney(row.devengado)}
                          </td>
                          <td className={cn(
                            "py-2.5 px-4 text-right font-mono font-medium",
                            isSelected ? "text-[#070e1b]" : "text-emerald-400"
                          )}>
                            {formatMoney(row.girado)}
                          </td>
                          <td className={cn(
                            "py-2.5 px-4 text-right font-mono font-bold",
                            isSelected ? "text-[#070e1b]" : "text-blue-400"
                          )}>
                            {formatMoney(row.saldo)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals Row - Positioned exactly aligned with columns */}
            {!loading && rows.length > 0 && (
              <div className="bg-[#0f1d3a] border-t border-slate-700 py-3 px-4 grid grid-cols-12 font-bold text-slate-200 text-xs shadow-inner select-none">
                <div className="col-span-4 uppercase tracking-wider text-slate-400 flex items-center font-extrabold">
                  TOTAL GENERAL:
                </div>
                <div className="col-span-2 text-right font-mono pr-2">
                  {formatMoney(totals.pim)}
                </div>
                <div className="col-span-2 text-right font-mono pr-2 text-red-400">
                  {formatMoney(totals.devengado)}
                </div>
                <div className="col-span-2 text-right font-mono pr-2 text-emerald-400">
                  {formatMoney(totals.girado)}
                </div>
                <div className="col-span-2 text-right font-mono pr-2 text-blue-400">
                  {formatMoney(totals.saldo)}
                </div>
              </div>
            )}
          </div>

          {/* VFP Bottom Details Panel & Buttons Frame - SOLID BACKGROUND */}
          {selectedRow && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch select-none">
              
              {/* Left Side: Active Program text box */}
              <div className="md:col-span-5 p-4 rounded-lg border border-slate-800 bg-[#070e1b] flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Programa Seleccionado</span>
                <div className="mt-2 text-xs font-bold bg-[#030812] border border-slate-800 rounded p-2.5 text-slate-200 font-mono break-all leading-relaxed shadow-inner">
                  {selectedRow.codigo} {selectedRow.nombre}
                </div>
              </div>

              {/* Right Side: VFP Button Frame "Programa: [CODE]" */}
              <div className="md:col-span-7 p-4 rounded-lg border border-slate-800 bg-[#070e1b] flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Consulta de Ejecución Presupuestal</span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                  <div className="flex items-center">
                    <span className="text-xs bg-[#d40000]/15 text-[#d40000] border border-[#d40000]/30 font-mono font-bold px-3 py-1 rounded">
                      Programa: {selectedRow.codigo}
                    </span>
                  </div>
                  
                  {/* Export Buttons - Replicating classic FoxPro XLS buttons */}
                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                    <button
                      onClick={handleExportCertificados}
                      disabled={!!exporting}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 text-slate-200 border border-slate-700 hover:border-slate-600 rounded text-xs font-bold transition-all shadow-md"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-purple-400" />
                      {exporting === 'certificados' ? 'Procesando...' : 'Certificados'}
                    </button>
                    <button
                      onClick={handleExportDevengados}
                      disabled={!!exporting}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 text-slate-200 border border-slate-700 hover:border-slate-600 rounded text-xs font-bold transition-all shadow-md"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-red-400" />
                      {exporting === 'devengados' ? 'Procesando...' : 'Devengados.'}
                    </button>
                    <button
                      onClick={handleExportGiros}
                      disabled={!!exporting}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 text-slate-200 border border-slate-700 hover:border-slate-600 rounded text-xs font-bold transition-all shadow-md"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                      {exporting === 'giros' ? 'Procesando...' : 'Giros.'}
                    </button>
                    <button
                      onClick={handleExportGirosConGlosa}
                      disabled={!!exporting}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 text-slate-200 border border-slate-700 hover:border-slate-600 rounded text-xs font-bold transition-all shadow-md"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-blue-400" />
                      {exporting === 'giros-con-glosa' ? 'Procesando...' : 'Giros con glosa.'}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
