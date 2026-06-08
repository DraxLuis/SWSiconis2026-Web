'use client';

import { useState } from 'react';
import { FileSpreadsheet, Loader2, HelpCircle } from 'lucide-react';
import {
  exportEjecucionPPTO,
  exportCertificados,
  exportDevengados,
  exportGiros,
  exportEjecucionActProy,
  exportResumenInversion,
  type EjecucionRow,
  type CertificadoRow,
  type ExpedienteRow,
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
  return {
    codigo:    String(r.codigo    ?? r.act_proy    ?? ''),
    nombre:    String(r.nombre    ?? r.act_proy_nombre ?? ''),
    pia:       Number(r.pia       ?? 0),
    modif:     Number(r.modif     ?? 0),
    pim:       Number(r.pim       ?? 0),
    certif:    Number(r.certif    ?? 0),
    cpanua:    Number(r.cpanua    ?? r.comprometido ?? 0),
    atcp:      Number(r.atcp      ?? 0),
    devengado: Number(r.devengado ?? 0),
    girado:    Number(r.girado    ?? 0),
    saldo:     Number(r.saldo     ?? 0),
    avance:    Number(r.avance    ?? 0),
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

function mapExpediente(r: Record<string, unknown>): ExpedienteRow {
  return {
    ano_eje:        String(r.ano_eje         ?? '2026'),
    mes_eje:        String(r.mes_eje         ?? ''),
    expediente:     String(r.expediente      ?? ''),
    tipo_op:        String(r.tipo_op         ?? ''),
    sec_reg:        String(r.sec_reg         ?? ''),
    corr:           String(r.corr            ?? ''),
    rb:             String(r.rb              ?? ''),
    tr:             String(r.tr              ?? ''),
    cod_doc:        String(r.cod_doc         ?? ''),
    num_doc:        String(r.num_doc         ?? ''),
    fecha_doc:      String(r.fecha_doc       ?? ''),
    proveedor_ruc:  String(r.proveedor_ruc   ?? ''),
    proveedor_nombre: String(r.proveedor_nombre ?? ''),
    clasificad:     String(r.clasificad      ?? ''),
    clasif_nombre:  String(r.clasif_nombre   ?? ''),
    sec_func:       String(r.sec_func        ?? ''),
    meta_nombre:    String(r.meta_nombre     ?? ''),
    glosa:          String(r.glosa           ?? ''),
    monto:          Number(r.monto           ?? 0),
    fec_aprob:      String(r.fec_aprob       ?? ''),
    estado:         String(r.estado          ?? ''),
    certif:         String(r.certif          ?? ''),
    certif_sec:     String(r.certif_sec      ?? ''),
  };
}

// ─── Page ───────────────────────────────────────────────────────────────
export default function ReportesPage() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [lastExported, setLastExported] = useState<string | null>(null);

  async function handleExport(btn: ReportBtn) {
    setLoadingId(btn.id);
    try {
      const res = await fetch(`/api/excel-reportes?type=${btn.id}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.error || 'Error al obtener datos');
      const rows: Record<string, unknown>[] = data.rows || [];

      // Dispatch to the correct export function
      switch (btn.id) {
        case 'ejecucion_metas':
        case 'ejecucion_metas_clasificador':
        case 'ejecucion_ppto':
        case 'ejecucion_ppto_meta':
          exportEjecucionPPTO(rows.map(mapEjecucion));
          break;

        case 'certificado':
        case 'data_certificados':
        case 'meta_certificados':
          exportCertificados(PROG_CODE, PROG_NAME, rows.map(mapCertificado));
          break;

        case 'data_devengados':
        case 'programa_devengados':
        case 'meta_devengados':
          exportDevengados(PROG_CODE, PROG_NAME, rows.map(mapExpediente));
          break;

        case 'data_girados':
          exportGiros(PROG_CODE, PROG_NAME, rows.map(mapExpediente));
          break;

        case 'ejecucion_activ_obra_accinv':
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
          })));
          break;

        case 'programa_accion_inversion':
          exportResumenInversion(rows.map(r => ({
            act_proy:       String(r.act_proy       ?? ''),
            act_proy_nombre:String(r.act_proy_nombre ?? ''),
            pia:            Number(r.pia       ?? 0),
            pim:            Number(r.pim       ?? 0),
            certif:         Number(r.certif    ?? 0),
            comprometido:   Number(r.comprometido ?? 0),
            atcp:           Number(r.atcp      ?? 0),
            devengado:      Number(r.devengado ?? 0),
            girado:         Number(r.girado    ?? 0),
          })));
          break;

        default:
          exportEjecucionPPTO(rows.map(mapEjecucion));
      }

      setLastExported(btn.label);
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

        {/* Green Banner */}
        <div className="bg-[#a7f3d0] text-[#064e3b] px-4 py-2.5 flex items-center gap-2 shadow-sm select-none">
          <FileSpreadsheet className="h-4 w-4 stroke-[2.5]" />
          <h2 className="font-extrabold text-sm tracking-wide uppercase">
            Generador de Reportes Excel
          </h2>
          {lastExported && (
            <span className="ml-auto text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
              ✓ Exportado: {lastExported}
            </span>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-4">

          {/* Info */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-950/40 border border-blue-900/40 text-xs text-blue-300">
            <HelpCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-400" />
            <p>Presiona cualquier botón para generar y descargar el Excel correspondiente con datos reales de la base de datos.
               Los archivos se descargan directamente en tu carpeta de Descargas.</p>
          </div>

          {/* Button Grid — 2 columns like VFP original */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Left column */}
            <div className="flex flex-col gap-2">
              {leftBtns.map(btn => (
                <button
                  key={btn.id}
                  onClick={() => handleExport(btn)}
                  disabled={loadingId !== null}
                  title={btn.description}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border border-slate-700 bg-[#0c1938] hover:bg-[#112240] hover:border-emerald-700/60 text-slate-200 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-[13px] font-medium text-left group"
                >
                  {loadingId === btn.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-400 flex-shrink-0" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 text-emerald-500 group-hover:text-emerald-400 flex-shrink-0" />
                  )}
                  <span className="flex-1 truncate">{btn.label}</span>
                  {loadingId === btn.id && (
                    <span className="text-[10px] text-emerald-400 font-bold">Generando...</span>
                  )}
                </button>
              ))}
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-2">
              {rightBtns.map(btn => (
                <button
                  key={btn.id}
                  onClick={() => handleExport(btn)}
                  disabled={loadingId !== null}
                  title={btn.description}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border border-slate-700 bg-[#0c1938] hover:bg-[#112240] hover:border-emerald-700/60 text-slate-200 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-[13px] font-medium text-left group"
                >
                  {loadingId === btn.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-400 flex-shrink-0" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 text-emerald-500 group-hover:text-emerald-400 flex-shrink-0" />
                  )}
                  <span className="flex-1 truncate">{btn.label}</span>
                  {loadingId === btn.id && (
                    <span className="text-[10px] text-emerald-400 font-bold">Generando...</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <p className="text-[10px] text-slate-600 text-center pt-2">
            Los reportes se generan con datos en tiempo real. Datos del año fiscal 2026 y 2025 incluidos.
          </p>
        </div>
      </div>
    </div>
  );
}
