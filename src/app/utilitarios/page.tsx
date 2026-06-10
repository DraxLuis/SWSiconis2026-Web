'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  Users, 
  KeyRound, 
  Calendar, 
  Search, 
  Save, 
  UserPlus, 
  Trash2, 
  X, 
  ShieldAlert, 
  Check 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserItem {
  id?: number;
  equipo: string;
  usuario: string;
  descripcion: string;
  atributo: 'Sólo Lectura' | 'Control Total';
  suspendido: boolean;
}

export default function UtilitariosUnifiedPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('general');

  // Load active tab from URL query params safely without Suspense issues
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'usuarios' || tab === 'clave') {
        setActiveTab(tab);
      } else {
        setActiveTab('general');
      }
    }
  }, []);

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    // Update URL query param quietly
    router.replace(`/utilitarios?tab=${tab}`);
  };

  // ==========================================
  // TAB 1: CONFIGURACIÓN GENERAL (PERIODO & SIAF)
  // ==========================================
  const [selectedYear, setSelectedYear] = useState('2026');
  const [entidad, setEntidad] = useState('301548 MUNICIPALIDAD PROVINCIAL DE HUANCABAMBA');
  const [generalError, setGeneralError] = useState('');
  const [generalSuccess, setGeneralSuccess] = useState('');
  const [generalLoading, setGeneralLoading] = useState(false);

  useEffect(() => {
    // Read current active year from cookies
    const matchYear = document.cookie.match(/(?:^|; )siconis_year=([^;]*)/);
    if (matchYear) {
      setSelectedYear(matchYear[1]);
    }

    // Fetch current config (active entity)
    fetch('/api/utilitarios/ruta-siaf')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEntidad(data.entidad);
        }
      })
      .catch(() => {
        setGeneralError('Error al conectar con la API de configuración');
      });
  }, []);

  const handleSavePeriodo = async () => {
    setGeneralError('');
    setGeneralSuccess('');
    setGeneralLoading(true);
    try {
      // Save Period (cookie)
      document.cookie = `siconis_year=${selectedYear}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
      setGeneralSuccess('Periodo de ejecución guardado correctamente. Recargando...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch {
      setGeneralError('Error al guardar el periodo');
    } finally {
      setGeneralLoading(false);
    }
  };



  // ==========================================
  // TAB 2: GESTIÓN DE USUARIOS
  // ==========================================
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [usersSuccess, setUsersSuccess] = useState('');
  const [filterText, setFilterText] = useState('');
  
  // Selected user & mode states
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isNewMode, setIsNewMode] = useState(false);
  
  // Form states
  const [equipo, setEquipo] = useState('');
  const [usuario, setUsuario] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [atributo, setAtributo] = useState<'Sólo Lectura' | 'Control Total'>('Control Total');
  const [suspendido, setSuspendido] = useState(false);
  const [userClave, setUserClave] = useState('');

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/utilitarios/usuarios');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        if (data.users.length > 0) {
          // Select ADMINISTRADOR by default or first user
          const admin = (data.users as UserItem[]).find(u => u.usuario.toUpperCase() === 'ADMINISTRADOR');
          selectUser(admin || data.users[0]);
        }
      } else {
        setUsersError(data.message || 'Error al cargar los usuarios');
      }
    } catch {
      setUsersError('Error de conexión con el servidor');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'usuarios') {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  const selectUser = (user: UserItem) => {
    setSelectedUser(user);
    setIsNewMode(false);
    setEquipo(user.equipo);
    setUsuario(user.usuario);
    setDescripcion(user.descripcion);
    setAtributo(user.atributo === 'Sólo Lectura' ? 'Sólo Lectura' : 'Control Total');
    setSuspendido(!!user.suspendido);
    setUserClave(''); // Clear password input
    setUsersError('');
    setUsersSuccess('');
  };

  const handleNewUser = () => {
    setIsNewMode(true);
    setSelectedUser(null);
    setEquipo('PC-CLIENTE');
    setUsuario('');
    setDescripcion('');
    setAtributo('Control Total');
    setSuspendido(false);
    setUserClave('');
    setUsersError('');
    setUsersSuccess('');
  };

  const handleCancel = () => {
    setIsNewMode(false);
    if (selectedUser) {
      selectUser(selectedUser);
    } else if (users.length > 0) {
      selectUser(users[0]);
    } else {
      setEquipo('');
      setUsuario('');
      setDescripcion('');
      setUserClave('');
    }
    setUsersError('');
    setUsersSuccess('');
  };

  const handleSaveUser = async () => {
    setUsersError('');
    setUsersSuccess('');
    
    if (!usuario.trim()) {
      setUsersError('El nombre de usuario es requerido');
      return;
    }

    try {
      const method = isNewMode ? 'POST' : 'PUT';
      const bodyPayload = {
        equipo,
        usuario: usuario.trim(),
        descripcion,
        atributo,
        suspendido,
        ...(userClave ? { clave: userClave } : {}) // Only send password if set
      };

      const res = await fetch('/api/utilitarios/usuarios', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();

      if (data.success) {
        setUsersSuccess(data.message || 'Usuario guardado con éxito');
        await fetchUsers();
        if (isNewMode) {
          setIsNewMode(false);
        }
      } else {
        setUsersError(data.message || 'Error al guardar el usuario');
      }
    } catch {
      setUsersError('Error de red al guardar el usuario');
    }
  };

  const handleDeleteUser = async () => {
    setUsersError('');
    setUsersSuccess('');
    
    if (!selectedUser) return;
    if (selectedUser.usuario.toUpperCase() === 'ADMINISTRADOR') {
      setUsersError('El usuario ADMINISTRADOR no puede ser eliminado');
      return;
    }

    if (!confirm(`¿Está seguro que desea eliminar al usuario ${selectedUser.usuario}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/utilitarios/usuarios?usuario=${encodeURIComponent(selectedUser.usuario)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setUsersSuccess(data.message || 'Usuario eliminado');
        setSelectedUser(null);
        await fetchUsers();
      } else {
        setUsersError(data.message || 'Error al eliminar');
      }
    } catch {
      setUsersError('Error de red al eliminar usuario');
    }
  };

  const filteredUsers = users.filter(u => 
    u.usuario.toLowerCase().includes(filterText.toLowerCase()) ||
    u.equipo.toLowerCase().includes(filterText.toLowerCase()) ||
    u.descripcion.toLowerCase().includes(filterText.toLowerCase())
  );

  // ==========================================
  // TAB 3: ACTUALIZAR CLAVE
  // ==========================================
  const [currentSessionUser, setCurrentSessionUser] = useState('ADMINISTRADOR');
  const [claveActual, setClaveActual] = useState('');
  const [claveNueva, setClaveNueva] = useState('');
  const [confirmarClave, setConfirmarClave] = useState('');
  const [claveError, setClaveError] = useState('');
  const [claveSuccess, setClaveSuccess] = useState('');
  const [claveLoading, setClaveLoading] = useState(false);

  useEffect(() => {
    // Read current logged-in user from siconis_session cookie
    const matchUser = document.cookie.match(/(?:^|; )siconis_session=([^;]*)/);
    if (matchUser) {
      setCurrentSessionUser(decodeURIComponent(matchUser[1]));
    }
  }, []);

  const handleChangeClave = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaveError('');
    setClaveSuccess('');

    if (!claveNueva) {
      setClaveError('La nueva contraseña no puede estar vacía');
      return;
    }

    if (claveNueva !== confirmarClave) {
      setClaveError('La confirmación de la clave nueva no coincide');
      return;
    }

    setClaveLoading(true);
    try {
      const res = await fetch('/api/utilitarios/clave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: currentSessionUser,
          claveActual,
          claveNueva
        })
      });
      const data = await res.json();
      if (data.success) {
        setClaveSuccess('Contraseña actualizada con éxito');
        setClaveActual('');
        setClaveNueva('');
        setConfirmarClave('');
      } else {
        setClaveError(data.message || 'Error al cambiar la clave');
      }
    } catch {
      setClaveError('Error de conexión con el servidor');
    } finally {
      setClaveLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#ef4444]" />
            CONFIGURACIÓN Y UTILITARIOS DEL SISTEMA
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestione el año de ejecución, ruta del SIAF, cuentas de usuarios y credenciales del sistema.
          </p>
        </div>
        <div className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-1.5 font-mono">
          301548 HUANCABAMBA
        </div>
      </div>

      {/* Tabs selector */}
      <div className="flex border-b border-slate-850 gap-2 select-none">
        <button
          onClick={() => changeTab('general')}
          className={cn(
            "px-4 py-2.5 text-xs font-black tracking-wide flex items-center gap-2 border-b-2 transition-all rounded-t-lg",
            activeTab === 'general'
              ? "border-[#ef4444] text-white bg-slate-900/40"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10"
          )}
        >
          <Calendar className="h-4 w-4" />
          SELECCIONAR PERIODO
        </button>
        <button
          onClick={() => changeTab('usuarios')}
          className={cn(
            "px-4 py-2.5 text-xs font-black tracking-wide flex items-center gap-2 border-b-2 transition-all rounded-t-lg",
            activeTab === 'usuarios'
              ? "border-[#ef4444] text-white bg-slate-900/40"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10"
          )}
        >
          <Users className="h-4 w-4" />
          GESTIÓN DE USUARIOS
        </button>
        <button
          onClick={() => changeTab('clave')}
          className={cn(
            "px-4 py-2.5 text-xs font-black tracking-wide flex items-center gap-2 border-b-2 transition-all rounded-t-lg",
            activeTab === 'clave'
              ? "border-[#ef4444] text-white bg-slate-900/40"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10"
          )}
        >
          <KeyRound className="h-4 w-4" />
          ACTUALIZAR CLAVE
        </button>
      </div>

      {/* Tab Contents */}
      <div className="w-full bg-[#070e1b] border border-slate-700 rounded-xl shadow-2xl p-6 overflow-hidden min-h-[420px]">
        
        {/* ======================================= */}
        {/* TAB: SELECCIONAR PERIODO */}
        {/* ======================================= */}
        {activeTab === 'general' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
            <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2 select-none">
              <Calendar className="h-4 w-4 text-[#ef4444]" />
              Seleccionar Periodo de Trabajo
            </h2>

            {generalError && (
              <div className="p-3 rounded bg-red-950/45 border border-red-900/60 text-xs font-mono text-red-400 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            {generalSuccess && (
              <div className="p-3 rounded bg-green-950/45 border border-green-900/60 text-xs font-mono text-green-400 flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0" />
                <span>{generalSuccess}</span>
              </div>
            )}

            <div className="space-y-5 bg-[#0a1426] p-5 rounded-lg border border-slate-850">
              
              {/* Active Entity Info */}
              <div className="flex flex-col gap-1.5 select-none">
                <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Entidad Activa</label>
                <div className="bg-[#070e1b] border border-slate-800 rounded px-4 py-2.5 text-xs text-blue-400 font-mono font-bold">
                  {entidad}
                </div>
              </div>

              {/* Año de Ejecución */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Año de Ejecución (Período)</label>
                <div className="relative w-48">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full appearance-none bg-[#070e1b] border border-slate-700 text-slate-200 font-mono text-xs px-4 py-2 rounded focus:outline-none focus:border-red-500 cursor-pointer"
                  >
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400 border-l border-slate-700 bg-slate-900/40 rounded-r">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSavePeriodo}
                disabled={generalLoading}
                className="px-6 py-2 bg-[#ef4444] hover:bg-[#d32f2f] disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-red-950/20"
              >
                <Save className="h-4 w-4" />
                {generalLoading ? 'Guardando...' : 'Grabar Periodo'}
              </button>
            </div>
          </div>
        )}



        {/* ======================================= */}
        {/* TAB: GESTIÓN DE USUARIOS */}
        {/* ======================================= */}
        {activeTab === 'usuarios' && (
          <div className="flex flex-col md:flex-row gap-6 animate-in fade-in duration-300">
            
            {/* Grid panel */}
            <div className="flex-1 flex flex-col gap-4 select-none">
              <h2 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-400" /> Listado de Usuarios
              </h2>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Buscar usuario, descripción..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-full bg-[#070e1b] border border-slate-700 text-slate-200 font-mono text-xs px-3 py-2 pl-9 rounded focus:outline-none focus:border-blue-500"
                  />
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-650" />
                </div>
                <button 
                  onClick={() => setFilterText('')}
                  className="px-3 py-2 border border-slate-700 hover:bg-slate-900 text-slate-400 hover:text-white rounded font-mono text-[11px] transition-colors"
                >
                  Limpiar
                </button>
              </div>

              <div className="border border-slate-800 rounded-lg overflow-hidden bg-[#020b18] min-h-[280px] max-h-[380px] overflow-y-auto">
                <table className="w-full font-mono text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0c182e] text-slate-400 border-b border-slate-750 font-black uppercase tracking-wider text-[10px]">
                      <th className="px-3 py-2">Equipo</th>
                      <th className="px-3 py-2">Usuario</th>
                      <th className="px-3 py-2">Descripción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-350">
                    {usersLoading ? (
                      Array.from({ length: 4 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td colSpan={3} className="py-2.5 px-3"><div className="h-3.5 bg-slate-850 rounded w-full" /></td>
                        </tr>
                      ))
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-12 text-slate-550 font-bold">No se encontraron usuarios.</td>
                      </tr>
                    ) : (
                      filteredUsers.map((u, i) => {
                        const isSelected = selectedUser?.usuario.toUpperCase() === u.usuario.toUpperCase();
                        return (
                          <tr 
                            key={i}
                            onClick={() => selectUser(u)}
                            className={cn(
                              "cursor-pointer transition-colors hover:bg-slate-900/40",
                              isSelected && "bg-[#112240] text-white font-bold border-l-2 border-l-blue-500"
                            )}
                          >
                            <td className="px-3 py-2.5 truncate max-w-[120px]">{u.equipo}</td>
                            <td className="px-3 py-2.5 font-bold text-slate-200">{u.usuario}</td>
                            <td className="px-3 py-2.5 truncate max-w-[200px]">{u.descripcion}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-[10px] text-slate-500 font-mono flex justify-between px-1">
                <span>Registros: {filteredUsers.length}</span>
                {isNewMode && <span className="text-blue-400 font-black uppercase tracking-wide">Modo: Nuevo</span>}
              </div>
            </div>

            {/* Editor card */}
            <div className="w-full md:w-[400px] border border-slate-800 rounded-xl p-5 bg-[#0a1426] flex flex-col justify-between">
              
              <div className="space-y-4">
                <h3 className="text-slate-200 font-mono font-black text-xs border-b border-slate-850 pb-2 uppercase tracking-wider select-none">
                  {isNewMode ? 'NUEVO REGISTRO' : 'DETALLES DEL USUARIO'}
                </h3>

                {usersError && (
                  <div className="p-2.5 rounded bg-red-950/45 border border-red-900/60 text-xs font-mono text-red-400 flex items-start gap-2 animate-shake">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{usersError}</span>
                  </div>
                )}
                
                {usersSuccess && (
                  <div className="p-2.5 rounded bg-green-950/45 border border-green-900/60 text-xs font-mono text-green-400">
                    {usersSuccess}
                  </div>
                )}

                {/* PC Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre de PC</label>
                  <input
                    type="text"
                    value={equipo}
                    onChange={(e) => setEquipo(e.target.value.toUpperCase())}
                    className="bg-[#070e1b] border border-slate-700 text-slate-200 font-mono text-xs px-3 py-2 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Usuario (R/O if not new) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usuario</label>
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value.toUpperCase())}
                    disabled={!isNewMode}
                    className="bg-[#070e1b] border border-slate-700 text-slate-200 font-mono text-xs px-3 py-2 rounded focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Clave */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {isNewMode ? 'Clave de Acceso' : 'Cambiar Clave (opcional)'}
                  </label>
                  <input
                    type="password"
                    placeholder={isNewMode ? 'Defina la clave' : 'Dejar en blanco para no modificar'}
                    value={userClave}
                    onChange={(e) => setUserClave(e.target.value)}
                    className="bg-[#070e1b] border border-slate-700 text-slate-200 font-mono text-xs px-3 py-2 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Descripción */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descripción</label>
                  <input
                    type="text"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="bg-[#070e1b] border border-slate-700 text-slate-200 font-mono text-xs px-3 py-2 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Atributo (Radio) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Atributo</label>
                  <div className="flex items-center gap-6 mt-1 font-mono text-xs select-none">
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="atributo"
                        checked={atributo === 'Sólo Lectura'}
                        onChange={() => setAtributo('Sólo Lectura')}
                        className="accent-blue-500 h-4 w-4 bg-[#070e1b] border border-slate-700"
                      />
                      Sólo Lectura
                    </label>
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="atributo"
                        checked={atributo === 'Control Total'}
                        onChange={() => setAtributo('Control Total')}
                        className="accent-blue-500 h-4 w-4 bg-[#070e1b] border border-slate-700"
                      />
                      Control Total
                    </label>
                  </div>
                </div>

                {/* Suspendido (Checkbox) */}
                <div className="flex items-center gap-2 mt-2 font-mono text-xs">
                  <input
                    type="checkbox"
                    id="suspendido"
                    checked={suspendido}
                    onChange={(e) => setSuspendido(e.target.checked)}
                    disabled={usuario.toUpperCase() === 'ADMINISTRADOR'}
                    className="accent-blue-500 h-4.5 w-4.5 bg-[#070e1b] border border-slate-700 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <label htmlFor="suspendido" className="text-slate-300 cursor-pointer uppercase select-none font-bold">
                    Suspendido
                  </label>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={handleNewUser}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs font-bold transition-all"
                >
                  <UserPlus className="h-4 w-4 text-blue-400" />
                  Nuevo
                </button>
                <button
                  onClick={handleSaveUser}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-505 text-[#070e1b] font-mono text-xs font-bold transition-all shadow-md shadow-emerald-950/20"
                >
                  <Save className="h-4 w-4" />
                  Guardar
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={!selectedUser || selectedUser.usuario.toUpperCase() === 'ADMINISTRADOR' || isNewMode}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded bg-rose-950/25 hover:bg-rose-900/30 text-rose-450 border border-rose-950 font-mono text-xs font-bold transition-all disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded bg-slate-850 hover:bg-slate-800 text-slate-350 border border-slate-700 font-mono text-xs font-bold transition-all"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ======================================= */}
        {/* TAB: ACTUALIZAR CLAVE */}
        {/* ======================================= */}
        {activeTab === 'clave' && (
          <div className="max-w-lg mx-auto space-y-6 animate-in fade-in duration-300">
            <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2 select-none">
              <KeyRound className="h-4 w-4 text-amber-500" />
              Cambiar Clave de Acceso
            </h2>

            {claveError && (
              <div className="p-3 rounded bg-red-950/45 border border-red-900/60 text-xs font-mono text-red-400 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{claveError}</span>
              </div>
            )}

            {claveSuccess && (
              <div className="p-3 rounded bg-green-950/45 border border-green-900/60 text-xs font-mono text-green-400">
                {claveSuccess}
              </div>
            )}

            <form onSubmit={handleChangeClave} className="space-y-5 bg-[#0a1426] p-5 rounded-lg border border-slate-850">
              
              {/* PC User */}
              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Usuario :
                </label>
                <input
                  type="text"
                  value={currentSessionUser}
                  disabled
                  className="col-span-2 bg-[#070e1b] border border-slate-800 text-slate-500 font-mono text-xs font-bold px-3 py-2 rounded cursor-not-allowed opacity-60"
                />
              </div>

              {/* Clave actual */}
              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Clave actual :
                </label>
                <input
                  type="password"
                  value={claveActual}
                  onChange={(e) => setClaveActual(e.target.value)}
                  className="col-span-2 bg-[#070e1b] border border-slate-700 text-slate-200 font-mono text-xs px-3 py-2 rounded focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <hr className="border-slate-850" />

              {/* Clave nueva */}
              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Clave Nueva :
                </label>
                <input
                  type="password"
                  value={claveNueva}
                  onChange={(e) => setClaveNueva(e.target.value)}
                  className="col-span-2 bg-[#070e1b] border border-slate-700 text-slate-200 font-mono text-xs px-3 py-2 rounded focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              {/* Confirmar clave */}
              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Confirmar Clave :
                </label>
                <input
                  type="password"
                  value={confirmarClave}
                  onChange={(e) => setConfirmarClave(e.target.value)}
                  className="col-span-2 bg-[#070e1b] border border-slate-700 text-slate-200 font-mono text-xs px-3 py-2 rounded focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={claveLoading}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-505 disabled:opacity-40 text-[#070e1b] rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/20"
                >
                  <Save className="h-4 w-4" />
                  {claveLoading ? 'Guardando...' : 'Cambiar Contraseña'}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>

    </div>
  );
}
