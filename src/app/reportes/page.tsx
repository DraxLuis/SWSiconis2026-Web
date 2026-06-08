'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, Loader2, HelpCircle, Calendar } from 'lucide-react';
import {
  exportEjecucionPPTO,
  exportEjecucionMetas,
  exportEjecucionPPTOMeta,
  exportEjecucionMetasClasificador,
  exportCertificados,
  exportEjecucionActProy,
  exportCertificadoResumen,
  exportRawDevengados,
  exportRawGirados,
  exportMetaCertificados,
  exportMetaDevengados,
  exportProgramaDevengados,
  exportProgramaAccionInversion,
  type EjecucionRow,
  type CertificadoRow,
} from '@/lib/excel-exports';

// ─── Button definition ──────────────────────────────────────────────────
interface ReportBtn {
  id: string;
  label: string;
  col: 'left' | 'right';
  description: string;
}

const BUTTONS: ReportBtn[] = [
  // LEFT COLUMN
  { id: 'ejecucion_metas',             label: 'Ejecucion-metas',             col: 'left',  description: 'Ejecución presupuestal agrupada por meta' },
  { id: 'certificado',                 label: 'Certificado',                 col: 'left',  description: 'Detalle de movimientos de certificaciones' },
  { id: 'data_certificados',           label: 'Data  certificados',          col: 'left',  description: 'Data completa de certificaciones y compromisos' },
  { id: 'data_devengados',             label: 'Data  Devengados',            col: 'left',  description: 'Detalle de registros devengados' },
  { id: 'data_girados',                label: 'Data  Girados',               col: 'left',  description: 'Detalle de registros girados (cheques)' },
  { id: 'ejecucion_activ_obra_accinv', label: 'Ejecucion_activ_obra_accinv', col: 'left',  description: 'Ejecución por actividad/obra/acción de inversión' },
  { id: 'ejecucion_actproy',           label: 'Ejecucion_actproy',           col: 'left',  description: 'Ejecución presupuestal por actividad/proyecto' },
  { id: 'ejecucion_ppto',              label: 'Ejecucion_PPTO',              col: 'left',  description: 'Ejecución presupuestal por programa presupuestal' },
  // RIGHT COLUMN
  { id: 'ejecucion_metas_clasificador',label: 'Ejecucion_metas_clasificador',col: 'right', description: 'Ejecución por meta y clasificador de gasto' },
  { id: 'ejecucion_ppto_meta',         label: 'Ejecucion_ppto_meta',         col: 'right', description: 'Ejecución por programa presupuestal y meta' },
  { id: 'meta_certificados',           label: 'Meta_certificados',           col: 'right', description: 'Certificaciones agrupadas por meta' },
  { id: 'meta_devengados',             label: 'Meta_devengados',             col: 'right', description: 'Devengados agrupados por meta' },
  { id: 'programa_accion_inversion',   label: 'Programa_accion_inversion',   col: 'right', description: 'Resumen de proyectos de inversión' },
  { id: 'programa_devengados',         label: 'Pograma_devengados',          col: 'right', description: 'Detalle de devengados por programa presupuestal' },
];

// ─── helpers ────────────────────────────────────────────────────────────
const PROG_CODE = '301548';
const PROG_NAME = 'MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA';

function mapEjecucion(r: Record<string, unknown>): EjecucionRow {
  const pim = Number(r.pim ?? 0);
  const devengado = Number(r.devengado ?? 0);
  return {
    codigo:    String(r.codigo    ?? r.act_proy    ?? ''),
    nombre:    String(r.nombre    ?? r.act_proy_nombre ?? ''),
    pia:       Number(r.pia       ?? 0),
    modif:     Number(r.modif     ?? 0),
    pim:       pim,
    certif:    Number(r.certif    ?? 0),
    cpanua:    Number(r.cpanua    ?? r.comprometido ?? 0),
    atcp:      Number(r.atcp      ?? 0),
    devengado: devengado,
    girado:    Number(r.girado    ?? 0),
    saldo:     pim - devengado,
    avance:    pim > 0 ? devengado / pim : 0,
  };
}

function mapCertificado(r: Record<string, unknown>): CertificadoRow {
  return {
    ano_eje:     String(r.ano_eje     ?? '2026'),
    sec_ejec:    String(r.sec_ejec    ?? '301548'),
    certif:      String(r.certif      ?? ''),
    secuencia:   String(r.secuencia   ?? ''),
    correlat:    String(r.correlat    ?? ''),
    rubro:       String(r.rubro       ?? ''),
    cod_doc:     String(r.cod_doc     ?? ''),
    num_doc:     String(r.num_doc     ?? ''),
    fecha_doc:   String(r.fecha_doc   ?? ''),
    clasif:      String(r.clasif      ?? ''),
    clasif_nombre: String(r.clasif_nombre ?? ''),
    sec_func:    String(r.sec_func    ?? ''),
    meta_nombre: String(r.meta_nombre ?? ''),
    monto:       Number(r.monto       ?? 0),
    fec_proc:    String(r.fec_proc    ?? ''),
    tipo_reg:    String(r.tipo_reg    ?? ''),
    est_env:     String(r.est_env     ?? ''),
    est_reg:     String(r.est_reg     ?? ''),
  };
}



// ─── Page ───────────────────────────────────────────────────────────────
export default function ReportesPage() {
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [lastExported, setLastExported] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState<boolean>(false);

  // Fetch counts on mount and when year changes
  useEffect(() => {
    async function fetchCounts() {
      setLoadingCounts(true);
      try {
        const res = await fetch(`/api/excel-reportes/counts?year=${selectedYear}`);
        const data = await res.json();
        if (data.success) {
          setCounts(data.counts || {});
        }
      } catch (err) {
        console.error('Error fetching counts:', err);
      } finally {
        setLoadingCounts(false);
      }
    }
    fetchCounts();
  }, [selectedYear]);

  async function handleExport(btn: ReportBtn) {
    setLoadingId(btn.id);
    try {
      const res = await fetch(`/api/excel-reportes?type=${btn.id}&year=${selectedYear}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.error || 'Error al obtener datos');
      const rows: Record<string, unknown>[] = data.rows || [];

      // Dispatch to the correct export function
      switch (btn.id) {
        case 'ejecucion_metas':
          exportEjecucionMetas(rows.map(mapEjecucion), 'ejecucion-metas.xlsx', selectedYear);
          break;
        case 'ejecucion_metas_clasificador':
          exportEjecucionMetasClasificador(rows, 'ejecucion_metas_clasificador.xlsx', selectedYear);
          break;
        case 'ejecucion_ppto':
          exportEjecucionPPTO(rows.map(mapEjecucion), 'ejecucion_ppto.xlsx');
          break;
        case 'ejecucion_ppto_meta':
          exportEjecucionPPTOMeta(rows, 'ejecucion_ppto_meta.xlsx');
          break;

        case 'certificado':
          exportCertificadoResumen(rows, 'certificado.xlsx');
          break;
        case 'data_certificados':
          exportCertificados(PROG_CODE, PROG_NAME, rows.map(mapCertificado), 'data-certificados.xlsx');
          break;
        case 'meta_certificados':
          exportMetaCertificados(rows, 'meta_certificados.xlsx');
          break;

        case 'data_devengados':
          exportRawDevengados(rows, 'data-devengados.xlsx');
          break;
        case 'meta_devengados':
          exportMetaDevengados(rows, 'meta_devengados.xlsx');
          break;
        case 'programa_devengados':
          exportProgramaDevengados(rows, 'programa_devengados.xlsx');
          break;

        case 'data_girados':
          exportRawGirados(rows, 'data-girados.xlsx');
          break;

        case 'ejecucion_activ_obra_accinv':
          exportEjecucionActProy(rows.map(r => ({
            act_proy:       String(r.act_proy       ?? r.codigo    ?? ''),
            act_proy_nombre:String(r.act_proy_nombre ?? r.nombre   ?? ''),
            pia:            Number(r.pia       ?? 0),
            pim:            Number(r.pim       ?? 0),
            certif:         Number(r.certif    ?? 0),
            comprometido:   Number(r.comprometido ?? r.cpanua ?? 0),
            atcp:           Number(r.atcp      ?? 0),
            devengado:      Number(r.devengado ?? 0),
            girado:         Number(r.girado    ?? 0),
          })), 'ejecucion_activ_obra_accinv.xlsx', 'Ejecución Presupuestal  activ_obra_accinv');
          break;

        case 'ejecucion_actproy':
          exportEjecucionActProy(rows.map(r => ({
            act_proy:       String(r.act_proy       ?? r.codigo    ?? ''),
            act_proy_nombre:String(r.act_proy_nombre ?? r.nombre   ?? ''),
            pia:            Number(r.pia       ?? 0),
            pim:            Number(r.pim       ?? 0),
            certif:         Number(r.certif    ?? 0),
            comprometido:   Number(r.comprometido ?? r.cpanua ?? 0),
            atcp:           Number(r.atcp      ?? 0),
            devengado:      Number(r.devengado ?? 0),
            girado:         Number(r.girado    ?? 0),
          })), 'ejecucion_actproy.xlsx');
          break;

        case 'programa_accion_inversion':
          exportProgramaAccionInversion(rows, 'programa_accion_inversion.xlsx');
          break;

        default:
          exportEjecucionPPTO(rows.map(mapEjecucion));
      }

      setLastExported(`${btn.label} (${selectedYear})`);
    } catch (err) {
      console.error('Export error:', err);
      alert(`Error al exportar "${btn.label}": ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingId(null);
    }
  }

  const leftBtns  = BUTTONS.filter(b => b.col === 'left');
  const rightBtns = BUTTONS.filter(b => b.col === 'right');

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Outer VFP Window */}
      <div className="w-full rounded-xl border border-slate-700 bg-[#070e1b] shadow-2xl overflow-hidden flex flex-col">

        {/* Window Title Bar */}
        <div className="bg-[#0c1938] border-b border-slate-700 px-4 py-2 flex items-center justify-between select-none">
          <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
            SISTEMA INTEGRADO SICONIS — EXCEL / REPORTES
          </span>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-900/60 border border-slate-800/80 rounded px-2 py-0.5">
            SIAF® MUNICIPALIDAD DE HUANCABAMBA
          </span>
        </div>

        {/* Period Selector Panel */}
        <div className="bg-[#0c1938]/40 border-b border-slate-800/70 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Período de Ejecución</h3>
              <p className="text-xs text-slate-400">Seleccione el año de los registros a exportar</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#050b14] border border-slate-700 rounded-lg px-3 py-1.5 focus-within:border-emerald-500/50 transition-all">
            <span className="text-xs font-semibold text-slate-400 uppercase">Período:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent border-0 text-slate-200 focus:ring-0 text-sm font-bold cursor-pointer pr-8 py-0 focus:outline-none"
            >
              <option value="2026" className="bg-[#070e1b] text-slate-200">2026 (Año Actual)</option>
              <option value="2025" className="bg-[#070e1b] text-slate-200">2025 (Año Anterior)</option>
            </select>
          </div>
        </div>

        {/* Green Banner */}
        <div className="bg-[#a7f3d0] text-[#064e3b] px-6 py-3 flex items-center gap-2 shadow-sm select-none">
          <FileSpreadsheet className="h-5 w-5 stroke-[2.5]" />
          <h2 className="font-extrabold text-sm tracking-wider uppercase">
            Generador de Reportes Excel
          </h2>
          {lastExported && (
            <span className="ml-auto text-[11px] font-bold text-emerald-800 bg-emerald-200/80 px-3 py-0.5 rounded-full border border-emerald-300">
              ✓ Exportado: {lastExported}
            </span>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-4">

          {/* Info Banner */}
          <div className="flex items-start gap-2 p-3.5 rounded-lg bg-blue-950/30 border border-blue-900/30 text-xs text-blue-300">
            <HelpCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5 text-blue-400" />
            <p>
              Haga clic en cualquiera de los botones del panel para generar y descargar el reporte Excel estructurado con datos reales filtrados por el período fiscal seleccionado (<span className="text-emerald-400 font-bold">{selectedYear}</span>).
            </p>
          </div>

          {/* Button Grid — 2 columns like VFP original */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left column */}
            <div className="flex flex-col gap-2.5">
              {leftBtns.map(btn => {
                const countVal = counts[btn.id];
                return (
                  <button
                    key={btn.id}
                    onClick={() => handleExport(btn)}
                    disabled={loadingId !== null}
                    title={btn.description}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-800 bg-[#0c1938]/60 hover:bg-[#112240] hover:border-emerald-600/50 text-slate-200 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-[13px] font-medium text-left group shadow-sm hover:shadow-emerald-950/20"
                  >
                    {loadingId === btn.id ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin text-emerald-400 flex-shrink-0" />
                    ) : (
                      <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-500 group-hover:text-emerald-400 flex-shrink-0 transition-transform group-hover:scale-110" />
                    )}
                    <span className="flex-1 truncate font-semibold">{btn.label}</span>
                    
                    {loadingId === btn.id ? (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800">
                        Generando...
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-900/60 px-2.5 py-0.5 rounded-full border border-slate-800 font-bold group-hover:border-emerald-900/50 group-hover:text-emerald-400 transition-colors">
                        {loadingCounts ? (
                          <Loader2 className="h-3 w-3 animate-spin inline text-slate-500" />
                        ) : countVal !== undefined ? (
                          `${countVal.toLocaleString()} reg`
                        ) : (
                          '0 reg'
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-2.5">
              {rightBtns.map(btn => {
                const countVal = counts[btn.id];
                return (
                  <button
                    key={btn.id}
                    onClick={() => handleExport(btn)}
                    disabled={loadingId !== null}
                    title={btn.description}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-800 bg-[#0c1938]/60 hover:bg-[#112240] hover:border-emerald-600/50 text-slate-200 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-[13px] font-medium text-left group shadow-sm hover:shadow-emerald-950/20"
                  >
                    {loadingId === btn.id ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin text-emerald-400 flex-shrink-0" />
                    ) : (
                      <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-500 group-hover:text-emerald-400 flex-shrink-0 transition-transform group-hover:scale-110" />
                    )}
                    <span className="flex-1 truncate font-semibold">{btn.label}</span>
                    
                    {loadingId === btn.id ? (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800">
                        Generando...
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-900/60 px-2.5 py-0.5 rounded-full border border-slate-800 font-bold group-hover:border-emerald-900/50 group-hover:text-emerald-400 transition-colors">
                        {loadingCounts ? (
                          <Loader2 className="h-3 w-3 animate-spin inline text-slate-500" />
                        ) : countVal !== undefined ? (
                          `${countVal.toLocaleString()} reg`
                        ) : (
                          '0 reg'
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer note */}
          <p className="text-[10px] text-slate-500 text-center pt-2 select-none">
            Reportes generados con datos en tiempo real de SQL Server con fallback local JSON. Licencia SIAF® autorizada para la Municipalidad Provincial de Huancabamba.
          </p>
        </div>
      </div>
    </div>
  );
}
