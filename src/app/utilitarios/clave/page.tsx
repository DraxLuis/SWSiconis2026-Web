'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, X, Check, ShieldAlert } from 'lucide-react';

export default function ClavePage() {
  const router = useRouter();

  // States
  const [usuario, setUsuario] = useState('ADMINISTRADOR');
  const [claveActual, setClaveActual] = useState('');
  const [claveNueva, setClaveNueva] = useState('');
  const [confirmarClave, setConfirmarClave] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Read siconis_session cookie
    const matchUser = document.cookie.match(/(?:^|; )siconis_session=([^;]*)/);
    if (matchUser) {
      setUsuario(decodeURIComponent(matchUser[1]));
    }
  }, []);

  const handleAceptar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!claveNueva) {
      setErrorMsg('La nueva contraseña no puede estar vacía');
      return;
    }

    if (claveNueva !== confirmarClave) {
      setErrorMsg('La confirmación de la clave nueva no coincide');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/utilitarios/clave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario,
          claveActual,
          claveNueva
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Contraseña actualizada con éxito');
        setClaveActual('');
        setClaveNueva('');
        setConfirmarClave('');
      } else {
        setErrorMsg(data.message || 'Error al cambiar la clave');
      }
    } catch {
      setErrorMsg('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    router.push('/');
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center p-6 relative">
      
      {/* Decorative Background Glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at center, rgba(212,0,0,0.15) 0%, transparent 70%)`
        }}
      />

      {/* Actualizar Clave Dialog Window */}
      <div className="w-full max-w-lg bg-[#04101e] border-2 border-[#1E293B] shadow-2xl rounded-lg overflow-hidden animate-scale-in relative z-10">
        
        {/* Titlebar Frame */}
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#0d1e3d] px-4 py-2 flex items-center justify-between border-b border-[#2A3F64]">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-red-500/20 border border-red-500/40 flex items-center justify-center">
              <KeyRound className="h-3.5 w-3.5 text-red-400" />
            </div>
            <span className="text-[12px] font-black text-slate-100 tracking-wider font-mono">
              Actualizar Clave
            </span>
          </div>
          <button 
            onClick={handleCancelar}
            className="text-slate-400 hover:text-white transition-colors p-0.5 rounded hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Window Content Form */}
        <form onSubmit={handleAceptar} className="p-6">
          
          {/* Feedbacks */}
          {errorMsg && (
            <div className="mb-4 p-2.5 rounded bg-red-950/45 border border-red-800 text-[11.5px] font-mono text-red-400 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-2.5 rounded bg-green-950/45 border border-green-800 text-[11.5px] font-mono text-green-400">
              {successMsg}
            </div>
          )}

          {/* Form Fields Inner Container */}
          <div className="border border-[#2A3F64] rounded-lg p-5 bg-[#020b18]/40 flex flex-col gap-4">
            
            {/* Field: Usuario (Disabled) */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-[11px] font-black tracking-wider text-slate-400 uppercase font-mono">
                Usuario :
              </label>
              <input
                type="text"
                value={usuario}
                disabled
                className="col-span-2 bg-[#020b18] border border-[#2A3F64] text-slate-300 font-mono text-[12px] font-bold px-3 py-1.5 rounded select-none cursor-not-allowed opacity-60"
              />
            </div>

            {/* Field: Clave actual */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-[11px] font-black tracking-wider text-slate-300 uppercase font-mono">
                Clave actual :
              </label>
              <input
                type="password"
                value={claveActual}
                onChange={(e) => setClaveActual(e.target.value)}
                className="col-span-2 bg-[#020b18] border border-[#2A3F64] text-slate-200 font-mono text-[12px] px-3 py-1.5 rounded focus:outline-none focus:border-[#D40000] focus:ring-1 focus:ring-[#D40000]"
                required
              />
            </div>

            {/* Divider */}
            <div className="h-px bg-[#2A3F64] my-1" />

            {/* Field: Clave nueva */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-[11px] font-black tracking-wider text-slate-300 uppercase font-mono">
                Clave Nueva :
              </label>
              <input
                type="password"
                value={claveNueva}
                onChange={(e) => setClaveNueva(e.target.value)}
                className="col-span-2 bg-[#020b18] border border-[#2A3F64] text-slate-200 font-mono text-[12px] px-3 py-1.5 rounded focus:outline-none focus:border-[#D40000] focus:ring-1 focus:ring-[#D40000]"
                required
              />
            </div>

            {/* Field: Confirmar clave nueva */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-[11px] font-black tracking-wider text-slate-300 uppercase font-mono">
                Confirmar Clave :
              </label>
              <input
                type="password"
                value={confirmarClave}
                onChange={(e) => setConfirmarClave(e.target.value)}
                className="col-span-2 bg-[#020b18] border border-[#2A3F64] text-slate-200 font-mono text-[12px] px-3 py-1.5 rounded focus:outline-none focus:border-[#D40000] focus:ring-1 focus:ring-[#D40000]"
                required
              />
            </div>

          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-12 mt-6 pt-4 border-t border-[#1E293B] w-full justify-center">
            <button
              type="submit"
              disabled={loading}
              className="text-[#3b82f6] hover:text-[#60a5fa] font-black font-mono text-[13px] hover:underline focus:outline-none flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {loading ? 'Procesando...' : 'Aceptar'}
            </button>
            <button
              type="button"
              onClick={handleCancelar}
              className="text-[#ef4444] hover:text-[#f87171] font-black font-mono text-[13px] hover:underline focus:outline-none flex items-center gap-1.5 transition-colors"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
