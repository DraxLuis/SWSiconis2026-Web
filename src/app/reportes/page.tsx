'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  FileSpreadsheet,
  Loader2,
  HelpCircle,
  Calendar,
  Search,
  X,
  ListChecks,
  FileCheck,
  TrendingDown,
  Building2,
  AlertTriangle
} from 'lucide-react';
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
  category: 'ejecucion' | 'certificaciones' | 'devengados_giros' | 'inversion';
  description: string;
}

const BUTTONS: ReportBtn[] = [
  // Ejecución Presupuestal
  { id: 'ejecucion_ppto',              label: 'Ejecucion_PPTO',              category: 'ejecucion',  description: 'Ejecución presupuestal por programa presupuestal' },
  { id: 'ejecucion_metas',             label: 'Ejecucion-metas',             category: 'ejecucion',  description: 'Ejecución presupuestal agrupada por meta' },
  { id: 'ejecucion_metas_clasificador',label: 'Ejecucion_metas_clasificador',category: 'ejecucion',  description: 'Ejecución por meta y clasificador de gasto' },
  { id: 'ejecucion_actproy',           label: 'Ejecucion_actproy',           category: 'ejecucion',  description: 'Ejecución presupuestal por actividad/proyecto' },
  { id: 'ejecucion_activ_obra_accinv', label: 'Ejecucion_activ_obra_accinv', category: 'ejecucion',  description: 'Ejecución por actividad/obra/acción de inversión' },
  { id: 'ejecucion_ppto_meta',         label: 'Ejecucion_ppto_meta',         category: 'ejecucion',  description: 'Ejecución por programa presupuestal y meta' },

  // Certificaciones
  { id: 'certificado',                 label: 'Certificado',                 category: 'certificaciones',  description: 'Detalle de movimientos de certificaciones' },
  { id: 'data_certificados',           label: 'Data  certificados',          category: 'certificaciones',  description: 'Data completa de certificaciones y compromisos' },
  { id: 'meta_certificados',           label: 'Meta_certificados',           category: 'certificaciones',  description: 'Certificaciones agrupadas por meta' },

  // Devengados y Giros
  { id: 'data_devengados',             label: 'Data  Devengados',            category: 'devengados_giros',  description: 'Detalle de registros devengados' },
  { id: 'meta_devengados',             label: 'Meta_devengados',             category: 'devengados_giros',  description: 'Devengados agrupados por meta' },
  { id: 'programa_devengados',         label: 'Pograma_devengados',          category: 'devengados_giros',  description: 'Detalle de devengados por programa presupuestal' },
  { id: 'data_girados',                label: 'Data  Girados',               category: 'devengados_giros',  description: 'Detalle de registros girados (cheques)' },

  // Inversión / Proyectos
  { id: 'programa_accion_inversion',   label: 'Programa_accion_inversion',   category: 'inversion', description: 'Resumen de proyectos de inversión' },
];

const SECTIONS = [
  {
    key: 'ejecucion',
    title: 'Ejecución Presupuestal',
    icon: ListChecks,
    colorClass: 'text-amber-400',
    borderColor: 'border-amber-950/40',
    bgColor: 'bg-amber-950/10'
  },
  {
    key: 'certificaciones',
    title: 'Certificaciones',
    icon: FileCheck,
    colorClass: 'text-[#3b82f6]',
    borderColor: 'border-blue-950/40',
    bgColor: 'bg-blue-950/10'
  },
  {
    key: 'devengados_giros',
    title: 'Devengados y Giros',
    icon: TrendingDown,
    colorClass: 'text-emerald-400',
    borderColor: 'border-emerald-950/40',
    bgColor: 'bg-emerald-950/10'
  },
  {
    key: 'inversion',
    title: 'Inversión y Proyectos',
    icon: Building2,
    colorClass: 'text-purple-400',
    borderColor: 'border-purple-950/40',
    bgColor: 'bg-purple-950/10'
  }
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
  const [search, setSearch] = useState('');

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

  // Filter & group buttons
  const filteredButtons = BUTTONS.filter(btn => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      btn.label.toLowerCase().includes(q) ||
      btn.description.toLowerCase().includes(q)
    );
  });

  const sectionsToRender = SECTIONS.map(sec => {
    const items = filteredButtons.filter(b => b.category === sec.key);
    return { ...sec, items };
  }).filter(sec => sec.items.length > 0);

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

        {/* Period Selector Panel & Search Input */}
        <div className="bg-[#0c1938]/40 border-b border-slate-800/70 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Período de Ejecución</h3>
              <p className="text-xs text-slate-400">Seleccione el año de los registros a exportar</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Year Selector */}
            <div className="flex items-center gap-2 bg-[#050b14] border border-slate-700 rounded-lg px-3 py-1.5 focus-within:border-emerald-500/50 transition-all">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Período:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent border-0 text-slate-200 focus:ring-0 text-xs font-bold cursor-pointer pr-8 py-0 focus:outline-none font-mono"
              >
                <option value="2026" className="bg-[#070e1b] text-slate-200">2026 (Año Actual)</option>
                <option value="2025" className="bg-[#070e1b] text-slate-200">2025 (Año Anterior)</option>
              </select>
            </div>

            {/* Search Input Bar */}
            <div className="relative flex-1 sm:w-64 select-text">
              <input
                type="text"
                placeholder="Buscar reportes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs bg-[#050b14] border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-mono"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
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
        <div className="p-6 space-y-6">

          {/* Info Banner */}
          <div className="flex items-start gap-2 p-3.5 rounded-lg bg-blue-950/30 border border-blue-900/30 text-xs text-blue-300">
            <HelpCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5 text-blue-400" />
            <p>
              Haga clic en cualquiera de los botones del panel para generar y descargar el reporte Excel estructurado con datos reales filtrados por el período fiscal seleccionado (<span className="text-emerald-400 font-bold">{selectedYear}</span>).
            </p>
          </div>

          {/* Sections List */}
          <div className="space-y-6">
            {sectionsToRender.map(sec => {
              const SecIcon = sec.icon;
              return (
                <div key={sec.key} className={cn("rounded-xl border bg-slate-950/20 overflow-hidden shadow-sm", sec.borderColor)}>
                  {/* Section Header */}
                  <div className={cn("px-4 py-2 border-b font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-2 select-none", sec.borderColor, sec.colorClass, sec.bgColor)}>
                    <SecIcon className="h-4 w-4" />
                    <span>{sec.title}</span>
                    <span className="ml-auto text-[10px] bg-slate-900/60 border border-white/5 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                      {sec.items.length} {sec.items.length === 1 ? 'reporte' : 'reportes'}
                    </span>
                  </div>

                  {/* Section Grid */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {sec.items.map(btn => {
                      const countVal = counts[btn.id];
                      return (
                        <button
                          key={btn.id}
                          onClick={() => handleExport(btn)}
                          disabled={loadingId !== null}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-800/80 bg-[#0c1938]/60 hover:bg-[#112240] hover:border-emerald-600/50 text-slate-200 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm hover:shadow-emerald-950/20 text-left"
                        >
                          {loadingId === btn.id ? (
                            <Loader2 className="h-4.5 w-4.5 animate-spin text-emerald-400 flex-shrink-0" />
                          ) : (
                            <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-500 group-hover:text-emerald-400 flex-shrink-0 transition-transform group-hover:scale-110" />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-200 group-hover:text-white truncate text-[12.5px] leading-tight font-mono">
                              {btn.label}
                            </p>
                            <p className="text-[10.5px] text-slate-400 group-hover:text-slate-300 truncate font-semibold mt-0.5">
                              {btn.description}
                            </p>
                          </div>
                          
                          {loadingId === btn.id ? (
                            <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800 flex-shrink-0 font-mono">
                              Generando...
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-400 bg-slate-900/60 px-2.5 py-0.5 rounded-full border border-slate-800 font-bold group-hover:border-emerald-900/50 group-hover:text-emerald-400 transition-colors flex-shrink-0 font-mono">
                              {loadingCounts ? (
                                <Loader2 className="h-2.5 w-2.5 animate-spin inline text-slate-500" />
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
              );
            })}

            {sectionsToRender.length === 0 && (
              <div className="py-16 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                <AlertTriangle className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <span className="font-bold text-sm">No se encontraron reportes que coincidan con la búsqueda.</span>
              </div>
            )}
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
