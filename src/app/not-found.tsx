'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LayoutDashboard, HelpCircle, HardDrive } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="max-w-[800px] mx-auto py-12 animate-in fade-in duration-500">
      {/* Outer VFP Window Wrapper */}
      <div className="rounded-xl border border-slate-700 bg-[#070e1b] shadow-2xl overflow-hidden flex flex-col">
        {/* Window Top Title / Metadata Banner */}
        <div className="bg-[#0c1938] border-b border-slate-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
              SISTEMA INTEGRADO SICONIS — INFORMACIÓN
            </span>
          </div>
          <div className="text-[10px] font-bold text-slate-500 bg-slate-900/60 border border-slate-800/80 rounded px-2 py-0.5">
            SIAF® MUNICIPALIDAD DE HUANCABAMBA
          </div>
        </div>

        {/* Inner Window Header Banner - Light amber/yellow solid background */}
        <div className="bg-[#f59e0b] text-[#070e1b] px-4 py-2.5 flex items-center gap-2 shadow-md">
          <HelpCircle className="h-5 w-5 stroke-[2.5]" />
          <h2 className="font-extrabold text-sm tracking-wide uppercase">
            SECCIÓN SIN REGISTROS O EN CONSTRUCCIÓN
          </h2>
        </div>

        {/* Window Content */}
        <div className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-slate-900/80 border border-slate-800 shadow-inner">
              <HardDrive className="h-12 w-12 text-slate-400" />
            </div>
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Módulo sin funcionalidad activa en el sistema origen
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Esta sección está contemplada en la estructura de navegación heredada del sistema original, 
              pero no cuenta con lógica de consulta, tablas asociadas, ni datos registrados en la base de datos origen.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold px-5 py-2.5 rounded-lg border border-slate-700 bg-slate-950/40 hover:bg-slate-900/40 text-slate-300 hover:text-white transition-all"
            >
              <ArrowLeft className="h-4 w-4" /> Regresar
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold px-5 py-2.5 rounded-lg border border-blue-900/60 bg-blue-950/40 hover:bg-blue-900/40 text-blue-400 hover:text-blue-300 transition-all"
            >
              <LayoutDashboard className="h-4 w-4" /> Ir al Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
