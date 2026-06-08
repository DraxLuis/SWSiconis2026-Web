'use client';

import { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Search,
  HardDrive,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportFichaProyecto, exportResumenInversion } from '@/lib/excel-exports';

interface ProjectRow {
  act_proy: string;
  act_proy_nombre: string;
  tipo: string;
  pia: number;
  pim: number;
  certif: number;
  comprometido: number;
  atcp: number;
  devengado: number;
  girado: number;
  metas_count: number;
}

interface ProjectInfo {
  codigo: string;
  nombre: string;
  programa: string;
  programaNombre: string;
  obra: string;
  obraNombre: string;
  funcion: string;
  funcionNombre: string;
  division: string;
  divisionNombre: string;
  grupo: string;
  grupoNombre: string;
}

interface ClassifierRow {
  clasificador: string;
  nombre: string;
  pia: number;
  pim: number;
  certificado: number;
  devengado: number;
  girado: number;
}

interface ProjectFicha {
  projectInfo: ProjectInfo;
  classifiers: ClassifierRow[];
  totals: {
    pia: number;
    pim: number;
    certificado: number;
    devengado: number;
    girado: number;
  };
}

const formatMoney = (val: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);

export default function ConsultaProyectosPage() {
  const [loading, setLoading] = useState(true);
  const [fichaLoading, setFichaLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectRow | null>(null);
  const [search, setSearch] = useState('');
  const [ficha, setFicha] = useState<ProjectFicha | null>(null);

  // Fetch all projects (type 'P')
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/proyectos?onlyProjects=true');
      const data = await res.json();
      if (data.success) {
        setProjects(data.rows || []);
        if (data.rows.length > 0) {
          setSelectedProject(data.rows[0]);
        } else {
          setSelectedProject(null);
          setFicha(null);
        }
      }
    } catch (e) {
      console.error('Error fetching projects:', e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Ficha Resumen for selected project
  const fetchFicha = async (code: string) => {
    setFichaLoading(true);
    try {
      const res = await fetch(`/api/proyectos/ficha?codigo=${code}`);
      const data = await res.json();
      if (data.success) {
        setFicha(data);
      } else {
        setFicha(null);
      }
    } catch (e) {
      console.error('Error fetching project ficha:', e);
      setFicha(null);
    } finally {
      setFichaLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchFicha(selectedProject.act_proy);
    } else {
      setFicha(null);
    }
  }, [selectedProject]);

  // Filtering
  const filteredProjects = projects.filter(p => {
    if (search) {
      const q = search.toLowerCase();
      return (
        p.act_proy.toLowerCase().includes(q) ||
        p.act_proy_nombre.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Excel handlers
  const handleExportFicha = () => {
    if (!ficha) return;
    exportFichaProyecto(ficha.projectInfo, ficha.classifiers);
  };

  const handleExportResumen = () => {
    if (projects.length === 0) return;
    exportResumenInversion(projects);
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 space-y-6">
      {/* Outer VFP Window Wrapper - SOLID BACKGROUND, NO TRANSPARENCY OVERLAPS */}
      <div className="rounded-xl border border-slate-700 bg-[#070e1b] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Window Top Title / Metadata Banner */}
        <div className="bg-[#0c1938] border-b border-slate-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
              Consulta Multianual: Consulta de Proyectos de Inversión
            </span>
          </div>
          <div className="text-xs font-bold text-[#d40000] bg-red-950/40 border border-red-900/60 rounded px-2.5 py-0.5">
            301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA
          </div>
        </div>

        {/* Inner Header Banner - Dark blue solid background */}
        <div className="bg-[#1e3a8a] text-white px-4 py-2.5 flex items-center justify-between shadow-md">
          <h2 className="font-extrabold text-sm tracking-wide uppercase flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-[#f59e0b]" />
            Consulta de Proyectos y Ficha de Resumen de Inversión
          </h2>
          <button 
            onClick={fetchProjects}
            className="flex items-center gap-1.5 text-[11px] font-bold bg-[#070e1b]/40 hover:bg-[#070e1b]/80 border border-blue-900/60 text-slate-300 rounded px-2.5 py-1 transition-all"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            Recargar
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="p-4 bg-[#0a1426] border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Buscar proyecto por código o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-[#070e1b] border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          </div>
          <div className="text-[11px] font-semibold text-slate-400">
            Mostrando {filteredProjects.length} de {projects.length} proyectos de inversión
          </div>
        </div>

        {/* Main Split Grid (Projects list at top, Ficha Resumen at bottom) */}
        <div className="flex flex-col divide-y divide-slate-800">
          
          {/* Top Panel: Projects Table */}
          <div className="max-h-[300px] overflow-y-auto bg-[#080f1d]">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="sticky top-0 bg-[#0c182e] border-b border-slate-700 text-slate-400 text-[10px] uppercase font-black tracking-wider z-20">
                <tr>
                  <th className="py-2.5 px-4 w-[35px]"></th>
                  <th className="py-2.5 px-3 w-[100px]">Código</th>
                  <th className="py-2.5 px-3 w-[550px]">Nombre del Proyecto de Inversión</th>
                  <th className="py-2.5 px-3 text-right">PIA</th>
                  <th className="py-2.5 px-3 text-right">PIM</th>
                  <th className="py-2.5 px-3 text-right">Devengado</th>
                  <th className="py-2.5 px-3 text-center w-[100px]">Avance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs font-semibold text-slate-300">
                {loading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td colSpan={7} className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-full" /></td>
                    </tr>
                  ))
                ) : filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-bold">
                      No se encontraron proyectos en la base de datos local.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((p) => {
                    const isSelected = selectedProject?.act_proy === p.act_proy;
                    const avance = p.pim > 0 ? (p.devengado / p.pim) * 100 : 0;
                    return (
                      <tr 
                        key={p.act_proy}
                        onClick={() => setSelectedProject(p)}
                        className={cn(
                          "cursor-pointer transition-all select-none",
                          isSelected 
                            ? "bg-[#f59e0b] text-[#070e1b] font-bold" 
                            : "even:bg-[#070e1a]/50 text-slate-300 hover:bg-slate-800/20"
                        )}
                      >
                        {/* Selected Indicator cursor ▶ */}
                        <td className="py-2 px-2 text-center font-black">
                          {isSelected && <span className="text-red-600 animate-pulse">▶</span>}
                        </td>
                        <td className={cn("py-2 px-3 font-mono text-[11px]", isSelected ? "text-[#070e1b]" : "text-slate-400")}>
                          {p.act_proy}
                        </td>
                        <td className="py-2 px-3 truncate" title={p.act_proy_nombre}>
                          {p.act_proy_nombre}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {formatMoney(p.pia)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {formatMoney(p.pim)}
                        </td>
                        <td className={cn("py-2 px-3 text-right font-mono", isSelected ? "text-[#070e1b]" : "text-red-400")}>
                          {formatMoney(p.devengado)}
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          {avance.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Panel: Ficha Resumen de Proyecto */}
          <div className="p-6 bg-[#070d18] min-h-[350px]">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Info className="h-4 w-4 text-[#4fbfa8]" />
              Ficha Resumen de Proyecto (Estructura Original)
            </h3>

            {fichaLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                <span className="text-xs font-bold text-slate-500">Cargando Ficha Resumen...</span>
              </div>
            ) : !ficha ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 font-bold text-xs">
                Seleccione un proyecto en la grilla superior para visualizar su Ficha Resumen.
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Meta-Información del Proyecto (SIAF original layout) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 p-4 bg-[#0a1529]/40 border border-slate-800/80 rounded-lg text-xs">
                  <div className="space-y-2">
                    <div className="flex items-start gap-1">
                      <span className="font-bold text-slate-500 uppercase w-32 shrink-0">PROYECTO:</span>
                      <span className="text-white font-semibold">{ficha.projectInfo.codigo} — {ficha.projectInfo.nombre}</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="font-bold text-slate-500 uppercase w-32 shrink-0">PROGRAMA:</span>
                      <span className="text-slate-300">{ficha.projectInfo.programa} — {ficha.projectInfo.programaNombre}</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="font-bold text-slate-500 uppercase w-32 shrink-0">OBRA/COMPONENTE:</span>
                      <span className="text-slate-300">{ficha.projectInfo.obra} — {ficha.projectInfo.obraNombre}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-1">
                      <span className="font-bold text-slate-500 uppercase w-32 shrink-0">FUNCIÓN:</span>
                      <span className="text-slate-300">{ficha.projectInfo.funcion} — {ficha.projectInfo.funcionNombre}</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="font-bold text-slate-500 uppercase w-32 shrink-0">DIV. FUNCIONAL:</span>
                      <span className="text-slate-300">{ficha.projectInfo.division} — {ficha.projectInfo.divisionNombre}</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="font-bold text-slate-500 uppercase w-32 shrink-0">GRUPO FUNCIONAL:</span>
                      <span className="text-slate-300">{ficha.projectInfo.grupo} — {ficha.projectInfo.grupoNombre}</span>
                    </div>
                  </div>
                </div>

                {/* Classifiers Table (Ficha Resumen) */}
                <div className="rounded-lg border border-slate-800 bg-[#091122]/60 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                        <th className="py-2 px-4 w-[120px]">Clasificador</th>
                        <th className="py-2 px-3">Descripción Clasificador</th>
                        <th className="py-2 px-3 text-right w-[150px]">PIA</th>
                        <th className="py-2 px-3 text-right w-[150px]">PIM</th>
                        <th className="py-2 px-3 text-right w-[150px]">Certificado</th>
                        <th className="py-2 px-3 text-right w-[150px]">Devengado</th>
                        <th className="py-2 px-3 text-right w-[150px]">Girado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30 text-xs font-semibold text-slate-300">
                      {ficha.classifiers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500">
                            Sin ejecución presupuestal registrada para este proyecto.
                          </td>
                        </tr>
                      ) : (
                        ficha.classifiers.map((c) => (
                          <tr key={c.clasificador} className="hover:bg-slate-800/10 transition-colors">
                            <td className="py-2 px-4 font-mono text-slate-400 text-[11px]">{c.clasificador}</td>
                            <td className="py-2 px-3 truncate max-w-[300px]" title={c.nombre}>{c.nombre}</td>
                            <td className="py-2 px-3 text-right font-mono">{formatMoney(c.pia)}</td>
                            <td className="py-2 px-3 text-right font-mono text-white">{formatMoney(c.pim)}</td>
                            <td className="py-2 px-3 text-right font-mono text-blue-400">{formatMoney(c.certificado)}</td>
                            <td className="py-2 px-3 text-right font-mono text-red-400">{formatMoney(c.devengado)}</td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-400">{formatMoney(c.girado)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {ficha.classifiers.length > 0 && (
                      <tfoot>
                        <tr className="border-t-2 border-slate-700/60 bg-slate-900/40 text-xs font-bold">
                          <td colSpan={2} className="py-2.5 px-4 text-slate-400 uppercase text-[10px] tracking-wider">
                            TOTALES RESUMEN
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">{formatMoney(ficha.totals.pia)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-white">{formatMoney(ficha.totals.pim)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-blue-400">{formatMoney(ficha.totals.certificado)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-red-400">{formatMoney(ficha.totals.devengado)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-400">{formatMoney(ficha.totals.girado)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

              </div>
            )}
          </div>

        </div>

        {/* Window Bottom Actions / Buttons Panel */}
        <div className="bg-[#0c1938] border-t border-slate-700 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            SICONIS 2026 · MÓDULO DE INVERSIONES
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleExportResumen}
              disabled={loading || projects.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg border border-emerald-800 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 hover:text-emerald-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Resumen de Inversión
            </button>
            <button
              onClick={handleExportFicha}
              disabled={fichaLoading || !ficha}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg border border-blue-800 bg-blue-950/40 hover:bg-blue-900/40 text-blue-400 hover:text-blue-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Ficha del Proyecto (Excel)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
