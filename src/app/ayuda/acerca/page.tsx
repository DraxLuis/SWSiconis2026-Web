'use client';

import { Info, ShieldCheck, Cpu, Database, Sparkles, Code, Clock } from 'lucide-react';

export default function AcercaPage() {
  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Window Wrapper */}
      <div className="w-full rounded-xl border border-slate-700 bg-[#070e1b]/90 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col">
        {/* Window Top Title */}
        <div className="bg-[#0c1938] border-b border-slate-700 px-4 py-2.5 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-[#D40000]" />
            <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
              Ayuda &gt; Acerca del Sistema
            </span>
          </div>
          <div className="text-xs font-bold text-[#3b82f6] bg-blue-950/40 border border-blue-900/60 rounded px-2.5 py-0.5">
            SICONIS 2026 — v1.0.0
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative p-8 border-b border-white/[0.04] bg-gradient-to-r from-blue-950/20 via-slate-950/40 to-red-950/10 flex flex-col md:flex-row items-center gap-8">
          <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-[#D40000] to-[#8B0000] flex items-center justify-center shadow-lg shadow-[#D40000]/10 flex-shrink-0">
            <span className="text-3xl font-black text-white tracking-tighter">SIAF</span>
          </div>
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center md:justify-start gap-2">
              SICONIS <span className="text-[#D40000] font-black">2026</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#D40000]/15 text-[#D40000] border border-[#D40000]/25">Web Edition</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Sistema Integrado de Consultas Interactivas con Conexión a SIAF® de la Municipalidad Provincial de Huancabamba. Modernizado por Team Libera Sistemas Informáticos.
            </p>
          </div>
          {/* Sparkles background effect */}
          <div className="absolute right-4 top-4 text-yellow-500/10 pointer-events-none">
            <Sparkles className="h-24 w-24 animate-pulse" />
          </div>
        </div>

        {/* System Specs and Cards */}
        <div className="p-6 md:p-8 space-y-8">
          {/* Main Info Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.03] transition-colors space-y-3">
              <div className="h-10 w-10 rounded-lg bg-blue-950/50 flex items-center justify-center text-[#3b82f6]">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white text-lg">Tecnología de Vanguardia</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Migrado desde sistemas Visual FoxPro heredados a una arquitectura moderna basada en Next.js, React, Tailwind CSS y TypeScript. Mayor velocidad, escalabilidad y accesibilidad web.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.03] transition-colors space-y-3">
              <div className="h-10 w-10 rounded-lg bg-green-950/50 flex items-center justify-center text-emerald-400">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white text-lg">Integración Híbrida SIAF</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Capacidad de procesamiento híbrido: consulta directa a bases de datos SQL Server sincronizadas en tiempo real con SIAF®, y fallback automático a archivos JSON optimizados para asegurar disponibilidad 24/7.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.03] transition-colors space-y-3">
              <div className="h-10 w-10 rounded-lg bg-red-950/50 flex items-center justify-center text-[#D40000]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white text-lg">Seguridad & Rendimiento</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Control estricto de acceso de usuarios, sesiones protegidas, rutas middleware seguras y optimización estática de páginas para carga instantánea de reportes complejos.
              </p>
            </div>
          </div>

          {/* Section: Technical Specs details */}
          <div className="border border-white/[0.06] rounded-xl overflow-hidden bg-white/[0.01]">
            <div className="bg-white/[0.03] px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Code className="h-4 w-4 text-slate-400" />
                Especificaciones del Entorno y Sistema
              </h3>
              <span className="text-[10px] font-mono text-slate-500">System Info</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.06] text-xs">
              <div className="bg-[#070e1b] p-4 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Nombre del Sistema:</span>
                <span className="font-mono text-slate-200">SICONIS (Control Institucional y Giras)</span>
              </div>
              <div className="bg-[#070e1b] p-4 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Edición:</span>
                <span className="font-mono text-slate-200">Web SWSiconis 2026</span>
              </div>
              <div className="bg-[#070e1b] p-4 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Cliente Destino:</span>
                <span className="font-mono text-slate-200">MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA</span>
              </div>
              <div className="bg-[#070e1b] p-4 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Desarrollado Por:</span>
                <span className="font-bold text-[#3b82f6]">Team Libera Sistemas Informáticos</span>
              </div>
              <div className="bg-[#070e1b] p-4 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Motor de Reportes:</span>
                <span className="font-mono text-slate-200">xlsx-js-style Engine (Advanced Fidelity)</span>
              </div>
              <div className="bg-[#070e1b] p-4 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Framework Base:</span>
                <span className="font-mono text-slate-200">Next.js v14.2 (React 18)</span>
              </div>
            </div>
          </div>

          {/* Copyright/Footer Info */}
          <div className="flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 pt-4 border-t border-white/[0.04]">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <span>Sincronización SIAF activa para el año fiscal 2026</span>
            </div>
            <div className="mt-2 md:mt-0">
              <span>© {new Date().getFullYear()} Team Libera. Todos los derechos reservados.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
