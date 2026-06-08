'use client';

import { Construction } from 'lucide-react';

export default function EjecucionProyectosPage() {
  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] gap-6 select-none">
      {/* Icon */}
      <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-[#0c1938] border border-slate-700 shadow-2xl">
        <Construction className="w-10 h-10 text-amber-400" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 animate-ping opacity-60" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400" />
      </div>

      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Ejecución de Proyectos
        </h1>
        <p className="text-slate-400 text-sm font-medium">
          Este módulo está en desarrollo y estará disponible próximamente.
        </p>
      </div>

      {/* Badge */}
      <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold uppercase tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Módulo no activo
      </span>
    </div>
  );
}
