'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HardDrive, X, Save } from 'lucide-react';

export default function RutaSiafPage() {
  const router = useRouter();

  // States
  const [ruta, setRuta] = useState('C:\\SIAF\\DATA');
  const [entidad, setEntidad] = useState('301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch current SIAF config
    fetch('/api/utilitarios/ruta-siaf')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRuta(data.ruta);
          setEntidad(data.entidad);
        }
      })
      .catch(() => {
        setErrorMsg('Error al conectar con la API de configuración');
      });
  }, []);

  const handleGuardar = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/utilitarios/ruta-siaf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruta })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || 'Configuración guardada correctamente');
        setTimeout(() => {
          router.push('/');
        }, 1200);
      } else {
        setErrorMsg(data.message || 'Error al guardar la ruta');
      }
    } catch {
      setErrorMsg('Error de red al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleCerrar = () => {
    // Standard behavior: save on close, or just exit if already saved.
    // Let's call save, then exit
    handleGuardar();
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center p-6 relative">
      
      {/* Decorative background grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at center, rgba(212,0,0,0.15) 0%, transparent 70%)`
        }}
      />

      {/* FoxPro Style dialog window */}
      <div className="w-full max-w-2xl bg-[#04101e] border-2 border-[#1E293B] shadow-2xl rounded-lg overflow-hidden animate-scale-in relative z-10">
        
        {/* Titlebar Frame */}
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#0d1e3d] px-4 py-2 flex items-center justify-between border-b border-[#2A3F64]">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-[#FF3B30]/20 border border-[#FF3B30]/40 flex items-center justify-center">
              <HardDrive className="h-3.5 w-3.5 text-[#FF3B30]" />
            </div>
            <span className="text-[12px] font-black text-slate-100 tracking-wider font-mono">
              Ruta DATA SIAF
            </span>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-white transition-colors p-0.5 rounded hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Window Content */}
        <div className="p-8 flex flex-col">
          
          {/* Feedbacks */}
          {errorMsg && (
            <div className="mb-6 p-2.5 rounded bg-red-950/45 border border-red-800 text-[11px] font-mono text-red-400">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-2.5 rounded bg-green-950/45 border border-green-800 text-[11px] font-mono text-green-400">
              {successMsg}
            </div>
          )}

          {/* Entity code & name heading */}
          <div className="mb-8 border border-[#2A3F64] rounded bg-[#020b18]/45 px-4 py-3">
            <h2 className="text-[#3b82f6] font-mono font-bold text-[13px] tracking-wide text-center leading-snug">
              {entidad}
            </h2>
          </div>

          {/* Form field: Ruta DATA SIA */}
          <div className="flex flex-col gap-2 font-mono text-[11px] mb-8">
            <label className="text-slate-300 font-bold uppercase tracking-wider">
              Ruta DATA SIAF:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ruta}
                onChange={(e) => setRuta(e.target.value)}
                className="flex-1 bg-[#020b18] border-2 border-[#2A3F64] text-slate-200 font-mono text-[12px] px-4 py-2 rounded focus:outline-none focus:border-[#D40000] focus:ring-1 focus:ring-[#D40000]"
                placeholder="C:\SIAF\DATA"
              />
              <button
                type="button"
                onClick={() => alert('Para configurar la ruta de red, ingrese la dirección UNC del servidor o unidad mapeada.')}
                className="px-4 bg-[#0d1e3d] hover:bg-slate-800 border border-[#2A3F64] text-slate-300 rounded font-black transition-colors"
                title="Examinar ruta"
              >
                ...
              </button>
            </div>
          </div>

          {/* Cerrar button (acts as Accept/Save) */}
          <div className="flex justify-center border-t border-[#1E293B] pt-6">
            <button
              onClick={handleCerrar}
              disabled={loading}
              className="px-8 py-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-[#2A3F64] hover:border-[#D40000] font-mono text-[12px] font-black tracking-wider transition-all shadow-md focus:outline-none flex items-center gap-2"
            >
              <Save className="h-4 w-4 text-blue-400" />
              {loading ? 'Guardando...' : 'Cerrar'}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
