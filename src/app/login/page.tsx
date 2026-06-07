'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database, Lock, User, ArrowRight, ShieldCheck, Server } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState('ADMINISTRADOR');
  const [clave, setClave] = useState('');
  const [conexion, setConexion] = useState('produccion');
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulamos un retraso sutil para dar sensación de procesamiento premium
    setTimeout(() => {
      // Establecer cookie de sesión por 1 día (o 30 días si rememberMe está marcado)
      const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
      document.cookie = `siconis_session=${encodeURIComponent(usuario)}; path=/; max-age=${maxAge}; SameSite=Lax`;
      
      // Redirigir al dashboard principal e invalidar caché del router
      router.push('/');
      router.refresh();
    }, 800);
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden select-none"
      style={{
        background: 'linear-gradient(145deg, #020B18 0%, #03101F 50%, #020D1E 100%)',
      }}
    >
      {/* Grid overlay — sutil */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: '52px 52px',
          zIndex: 0,
        }}
      />

      {/* Glow radial de acento rojo (SICONIS) — arriba izquierda */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: '-10%',
          left: '10%',
          width: '50vw',
          height: '50vh',
          background: 'radial-gradient(ellipse at center, rgba(212,0,0,0.07) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />

      {/* Glow radial de acento azul (Libera) — abajo derecha */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          bottom: '-10%',
          right: '10%',
          width: '50vw',
          height: '50vh',
          background: 'radial-gradient(ellipse at center, rgba(21,101,192,0.06) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />

      <div className="w-full max-w-[440px] z-10 animate-scale-in">
        {/* Contenedor principal con efecto vidrio */}
        <div className="glass-card p-8 md:p-10 relative overflow-hidden shadow-2xl border-white/[0.06] bg-[#061526]/70 backdrop-blur-2xl">
          {/* Línea decorativa roja en la parte superior */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#D40000] via-[#FF2020] to-[#8B0000]" />

          {/* Header del Login */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#D40000] to-[#8B0000] flex items-center justify-center shadow-xl shadow-red-950/70 border border-white/10 glow-red">
                  <span className="text-lg font-black text-white tracking-wider">SC</span>
                </div>
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-[#061526] animate-pulse" />
              </div>
            </div>

            <div className="flex items-baseline justify-center gap-1.5">
              <h1 className="text-2xl font-black tracking-widest text-white">
                SICONIS
              </h1>
              <span className="text-sm font-bold text-[#D40000]">2026</span>
            </div>
            <p className="text-[10px] text-[#4A6080] font-bold tracking-widest uppercase mt-1">
              Consultas Interactivas SIAF®
            </p>
            <p className="text-[11px] text-[#94A3B8] mt-2 font-medium">
              Municipalidad Provincial de Huancabamba
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Input: Servidor / Conexión */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Servidor de Datos
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Database className="h-4 w-4 text-[#4A6080]" />
                </div>
                <select
                  value={conexion}
                  onChange={(e) => setConexion(e.target.value)}
                  className="form-select pl-10 pr-10 cursor-pointer bg-[#03101F]/80 border-white/[0.08]"
                >
                  <option value="produccion">SQL Server - Producción (Local)</option>
                  <option value="respaldo">SQL Server - Respaldo Externo</option>
                  <option value="demo">Base de Datos de Pruebas (DEMO)</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                  <Server className="h-3.5 w-3.5 text-slate-500" />
                </div>
              </div>
            </div>

            {/* Input: Usuario */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Nombre de Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-[#4A6080]" />
                </div>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="form-input pl-10 bg-[#03101F]/80 border-white/[0.08]"
                  placeholder="Ingrese su usuario"
                  required
                />
              </div>
            </div>

            {/* Input: Clave */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Contraseña del Sistema
                </label>
                <span className="text-[9px] text-[#4A6080] font-semibold cursor-not-allowed hover:underline">
                  ¿Olvidó su clave?
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-[#4A6080]" />
                </div>
                <input
                  type="password"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  className="form-input pl-10 bg-[#03101F]/80 border-white/[0.08]"
                  placeholder="•••••••• (Opcional en desarrollo)"
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-white/[0.08] bg-[#03101F]/80 text-[#D40000] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-[11px] font-medium text-slate-400">Recordar sesión</span>
              </label>
            </div>

            {/* Botón de Ingreso */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2 flex justify-center items-center gap-2 border-none relative overflow-hidden transition-all duration-300 group shadow-lg shadow-red-950/20"
              style={{
                background: 'linear-gradient(135deg, #D40000 0%, #A30000 100%)',
              }}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-xs font-bold tracking-wider uppercase">Iniciando Conexión...</span>
                </>
              ) : (
                <>
                  <span className="text-xs font-bold tracking-wider uppercase">Ingresar al Sistema</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Modo de Desarrollo / Acceso Rápido Badge */}
          <div className="mt-6 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Modo Desarrollo Activo
              </p>
              <p className="text-[9.5px] text-[#94A3B8] leading-normal mt-0.5">
                Acceso rápido habilitado. Puedes pulsar **Ingresar al Sistema** directamente sin ingresar contraseña.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-[10px] text-[#4A6080] font-semibold tracking-wider">
            SICONIS © 2026 · WEB EDITION
          </p>
          <p className="text-[9px] text-[#2A3A50] font-bold tracking-widest uppercase">
            DESARROLLADO POR TEAM LIBERA SISTEMAS INFORMÁTICOS
          </p>
        </div>
      </div>
    </div>
  );
}
