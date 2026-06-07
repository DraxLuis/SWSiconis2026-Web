'use client';

import { useState } from 'react';
import { 
  Database, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp, 
  Coins, 
  FileText, 
  CheckCircle2, 
  Activity, 
  Globe,
  Server
} from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState('ADMINISTRADOR');
  const [clave, setClave] = useState('');
  const [conexion, setConexion] = useState('produccion');
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
      document.cookie = `siconis_session=${encodeURIComponent(usuario)}; path=/; max-age=${maxAge}; SameSite=Lax`;
      
      // Redirección forzada de página para limpiar la caché del router del cliente de Next.js
      window.location.href = '/';
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#020B18] text-white font-sans overflow-hidden relative selection:bg-[#D40000]/30 selection:text-white">
      
      {/* ========================================== */}
      {/* LADO IZQUIERDO: VISUAL / DEMO DASHBOARD    */}
      {/* ========================================== */}
      <div 
        className="hidden lg:flex lg:w-[55%] flex-col p-12 xl:p-16 relative border-r border-white/[0.04] overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 10% 20%, #04142b 0%, #020B18 100%)',
        }}
      >
        {/* Grid Overlay */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Ambient Glows */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: '-20%',
            left: '-10%',
            width: '60vw',
            height: '60vh',
            background: 'radial-gradient(ellipse at center, rgba(212,0,0,0.08) 0%, transparent 65%)',
          }}
        />
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            bottom: '-15%',
            right: '-10%',
            width: '50vw',
            height: '50vh',
            background: 'radial-gradient(ellipse at center, rgba(21,101,192,0.06) 0%, transparent 65%)',
          }}
        />

        {/* Contenedor Interno Centrado Simétricamente */}
        <div className="max-w-[620px] w-full mx-auto flex-1 flex flex-col justify-between z-10">
          
          {/* Header Superior Izquierdo */}
          <div className="flex items-center gap-3.5 animate-fade-in">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#D40000] to-[#8B0000] flex items-center justify-center shadow-lg shadow-red-950/40 border border-white/10">
              <span className="text-sm font-black text-white tracking-widest">SC</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="text-base font-black tracking-widest text-white">SICONIS</span>
                <span className="text-[11px] font-bold text-[#D40000]">2026</span>
              </div>
              <p className="text-[9px] text-[#4A6080] font-bold tracking-widest uppercase mt-0.5">
                Consultas Interactivas SIAF®
              </p>
            </div>
          </div>

          {/* Centro: Visualización del Dashboard SICONIS */}
          <div className="space-y-8 my-auto py-8 stagger-children">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-semibold text-slate-300">
                <TrendingUp className="h-3.5 w-3.5 text-[#D40000]" />
                <span>Plataforma de Consulta y Monitoreo Municipal</span>
              </div>
              <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Control Presupuestal de Alta Gama para la Gestión Municipal
              </h2>
              <p className="text-sm text-slate-400 max-w-lg">
                Accede a las métricas del Presupuesto Institucional Modificado (PIM), metas físicas, expedientes administrativos SIAF y tesorería con tiempos de carga optimizados.
              </p>
            </div>

            {/* Maqueta simulada del Dashboard */}
            <div className="glass-card p-6 border-white/[0.08] bg-[#061526]/60 backdrop-blur-xl shadow-2xl relative rounded-2xl overflow-hidden group">
              {/* Glossy top highlight */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              
              <div className="flex items-center justify-between mb-5 border-b border-white/[0.05] pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Vista Previa Interactiva</span>
                </div>
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                </div>
              </div>

              {/* Fila de Tarjetas Mini-KPI */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                {/* KPI 1 */}
                <div className="bg-[#03101F]/80 border border-white/[0.05] rounded-xl p-3.5 space-y-1 hover:border-[#D40000]/30 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">PIM Anual</span>
                    <Coins className="h-3.5 w-3.5 text-[#D40000]" />
                  </div>
                  <div className="text-sm xl:text-base font-bold text-white tracking-tight font-mono">
                    S/ 84.2M
                  </div>
                  <div className="text-[9px] text-[#4A6080] font-semibold">
                    Avance: 72.4%
                  </div>
                </div>

                {/* KPI 2 */}
                <div className="bg-[#03101F]/80 border border-white/[0.05] rounded-xl p-3.5 space-y-1 hover:border-[#D40000]/30 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Devengado</span>
                    <Activity className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <div className="text-sm xl:text-base font-bold text-white tracking-tight font-mono">
                    S/ 61.0M
                  </div>
                  <div className="text-[9px] text-[#4A6080] font-semibold">
                    Meta Devengada OK
                  </div>
                </div>

                {/* KPI 3 */}
                <div className="bg-[#03101F]/80 border border-white/[0.05] rounded-xl p-3.5 space-y-1 hover:border-[#D40000]/30 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Expedientes</span>
                    <FileText className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div className="text-sm xl:text-base font-bold text-white tracking-tight font-mono">
                    12,841
                  </div>
                  <div className="text-[9px] text-emerald-500 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Activos
                  </div>
                </div>
              </div>

              {/* Simulación Gráfico con SVG */}
              <div className="bg-[#020B18]/70 border border-white/[0.04] rounded-xl p-4 relative">
                <div className="flex items-center justify-between mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Ejecución Mensual (Devengado vs Girado)</span>
                  <span className="text-[#D40000]">En vivo SIAF</span>
                </div>
                <div className="h-28 w-full flex items-end justify-between gap-1 pt-4 relative">
                  {/* SVG Curve */}
                  <svg 
                    className="absolute inset-0 h-full w-full pointer-events-none overflow-visible" 
                    viewBox="0 0 480 100"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D40000" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#D40000" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Area */}
                    <path 
                      d="M 0 100 Q 60 70 120 85 T 240 45 T 360 20 T 480 30 L 480 110 L 0 110 Z" 
                      fill="url(#chartGlow)" 
                      stroke="none" 
                    />
                    {/* Line */}
                    <path 
                      d="M 0 100 Q 60 70 120 85 T 240 45 T 360 20 T 480 30" 
                      fill="none" 
                      stroke="#D40000" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                    />
                  </svg>
                  
                  {/* Barras de fondo y labels de meses */}
                  {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'].map((mes, index) => (
                    <div key={index} className="flex flex-col items-center flex-1 z-10">
                      <span className="text-[8px] text-[#4A6080] font-bold font-mono">{mes}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Inferior Izquierdo */}
          <div className="flex items-center justify-between text-[10px] text-[#4A6080] font-semibold tracking-wide border-t border-white/[0.04] pt-6 animate-fade-in">
            <span>SICONIS v2026.1 · WEB EDITION</span>
            <span>© 2026 Team Libera Sistemas Informáticos</span>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* LADO DERECHO: FORMULARIO DE INGRESO        */}
      {/* ========================================== */}
      <div 
        className="w-full lg:w-[45%] flex flex-col p-12 xl:p-16 relative bg-[#020B18]"
      >
        {/* Glow de fondo para darle profundidad a la tarjeta */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: '30%',
            right: '10%',
            width: '40vw',
            height: '40vh',
            background: 'radial-gradient(ellipse at center, rgba(212,0,0,0.065) 0%, transparent 65%)',
          }}
        />

        {/* Contenedor Interno Centrado Simétricamente */}
        <div className="max-w-[440px] w-full mx-auto flex-1 flex flex-col justify-between z-10">
          
          {/* Header Superior Derecho - Alinear en la misma línea que el logo izquierdo */}
          <div className="flex items-center justify-between lg:justify-end gap-3 h-10">
            {/* Logo en móviles únicamente */}
            <div className="flex lg:hidden items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#D40000] to-[#8B0000] flex items-center justify-center">
                <span className="text-xs font-black text-white tracking-widest">SC</span>
              </div>
              <div>
                <span className="text-xs font-black tracking-widest text-white">SICONIS</span>
              </div>
            </div>
            
            {/* Desktop-only Server Clock/Status */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-[10px] font-bold text-slate-400">
              <Server className="h-3 w-3 text-emerald-400" />
              <span>SIAF SERVER: ONLINE</span>
            </div>
          </div>

          {/* Centro: Login Card (con el título e inputs encapsulados) */}
          <div className="my-auto py-8">
            <div className="glass-card p-6 md:p-8 border-white/[0.08] bg-[#061526]/50 backdrop-blur-2xl shadow-2xl relative rounded-2xl">
              {/* Top highlight bar */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#D40000] to-[#8B0000]" />

              {/* Título interno alineado simétricamente con los inputs */}
              <div className="mb-6 space-y-1.5">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white leading-none">
                  Inicio de Sesión
                </h1>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Ingresa tus credenciales para acceder a la base de datos municipal.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                
                {/* Selector de Servidor */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    Servidor / Conexión
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Database className="h-3.5 w-3.5 text-[#4A6080]" />
                    </div>
                    <select
                      value={conexion}
                      onChange={(e) => setConexion(e.target.value)}
                      className="form-select pr-9 py-2 cursor-pointer bg-[#03101F]/90 border-white/[0.06] text-xs font-semibold text-white focus:border-[#D40000]/50"
                      style={{ paddingLeft: '2.5rem' }}
                    >
                      <option value="produccion">SQL Server - Producción (Local)</option>
                      <option value="respaldo">SQL Server - Respaldo Externo</option>
                      <option value="demo">Base de Datos de Pruebas (DEMO)</option>
                    </select>
                  </div>
                </div>

                {/* Input: Usuario */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    Usuario
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-3.5 w-3.5 text-[#4A6080]" />
                    </div>
                    <input
                      type="text"
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      className="form-input py-2 bg-[#03101F]/90 border-white/[0.06] text-xs font-semibold focus:border-[#D40000]/50"
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="ADMINISTRADOR"
                      required
                    />
                  </div>
                </div>

                {/* Input: Clave */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Contraseña
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-3.5 w-3.5 text-[#4A6080]" />
                    </div>
                    <input
                      type="password"
                      value={clave}
                      onChange={(e) => setClave(e.target.value)}
                      className="form-input py-2 bg-[#03101F]/90 border-white/[0.06] text-xs focus:border-[#D40000]/50"
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="•••••••• (Opcional en desarrollo)"
                    />
                  </div>
                </div>

                {/* Checkbox: Recordar */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3 w-3 rounded border-white/[0.08] bg-[#03101F]/90 text-[#D40000] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-[10px] font-semibold text-slate-400">Mantener sesión activa</span>
                  </label>
                </div>

                {/* Botón de Ingresar */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-2.5 mt-2 flex justify-center items-center gap-1.5 border-none relative overflow-hidden transition-all duration-300 group shadow-lg shadow-red-950/20 active:translate-y-px"
                  style={{
                    background: 'linear-gradient(135deg, #D40000 0%, #A30000 100%)',
                  }}
                >
                  {loading ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-[11px] font-bold tracking-wider uppercase">Conectando...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] font-bold tracking-wider uppercase">Ingresar al Sistema</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Modo de Desarrollo / Bypass Alert */}
              <div className="mt-5 p-3 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/10 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">
                    Acceso Rápido Habilitado
                  </p>
                  <p className="text-[9px] text-slate-400 leading-normal mt-0.5">
                    Puedes pulsar **Ingresar al Sistema** directamente sin ingresar contraseña.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer en derecho: estado de red / servidores - Alineado en la misma línea del footer izquierdo */}
          <div className="flex items-center justify-between border-t border-white/[0.04] pt-6 text-[9px] font-bold tracking-wider text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>SIAF LINK: ONLINE</span>
            </div>
            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3 text-slate-600" />
              <span>HUANCABAMBA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
