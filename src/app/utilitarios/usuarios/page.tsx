'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, X, UserPlus, Save, Trash2, LogOut, Search, ShieldAlert } from 'lucide-react';

interface UserItem {
  id?: number;
  equipo: string;
  usuario: string;
  descripcion: string;
  atributo: 'Sólo Lectura' | 'Control Total';
  suspendido: boolean;
}

export default function UsuariosPage() {
  const router = useRouter();
  
  // States
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
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
  const [clave, setClave] = useState(''); // Allow setting password

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
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
        setErrorMsg(data.message || 'Error al cargar los usuarios');
      }
    } catch {
      setErrorMsg('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectUser = (user: UserItem) => {
    setSelectedUser(user);
    setIsNewMode(false);
    setEquipo(user.equipo);
    setUsuario(user.usuario);
    setDescripcion(user.descripcion);
    setAtributo(user.atributo === 'Sólo Lectura' ? 'Sólo Lectura' : 'Control Total');
    setSuspendido(!!user.suspendido);
    setClave(''); // Clear password input
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleNew = () => {
    setIsNewMode(true);
    setSelectedUser(null);
    setEquipo('PC-CLIENTE');
    setUsuario('');
    setDescripcion('');
    setAtributo('Control Total');
    setSuspendido(false);
    setClave('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSave = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!usuario.trim()) {
      setErrorMsg('El nombre de usuario es requerido');
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
        ...(clave ? { clave } : {}) // Only send password if changed/set
      };

      const res = await fetch('/api/utilitarios/usuarios', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg(data.message || 'Operación realizada con éxito');
        await fetchUsers();
        if (isNewMode) {
          setIsNewMode(false);
        }
      } else {
        setErrorMsg(data.message || 'Error al guardar el usuario');
      }
    } catch {
      setErrorMsg('Error de red al guardar el usuario');
    }
  };

  const handleDelete = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!selectedUser) return;
    if (selectedUser.usuario.toUpperCase() === 'ADMINISTRADOR') {
      setErrorMsg('El usuario ADMINISTRADOR no puede ser eliminado');
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
        setSuccessMsg(data.message || 'Usuario eliminado');
        setSelectedUser(null);
        await fetchUsers();
      } else {
        setErrorMsg(data.message || 'Error al eliminar');
      }
    } catch {
      setErrorMsg('Error de red al eliminar usuario');
    }
  };

  const handleSalir = () => {
    router.push('/');
  };

  // Filtering users list
  const filteredUsers = users.filter(u => 
    u.usuario.toLowerCase().includes(filterText.toLowerCase()) ||
    u.equipo.toLowerCase().includes(filterText.toLowerCase()) ||
    u.descripcion.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-72px)] p-6 flex items-center justify-center relative">
      
      {/* Decorative radial gradient */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at center, rgba(212,0,0,0.1) 0%, transparent 80%)`
        }}
      />

      {/* Main FoxPro Dialog Window Container */}
      <div className="w-full max-w-5xl bg-[#04101e] border-2 border-[#1E293B] shadow-2xl rounded-lg overflow-hidden flex flex-col z-10 animate-scale-in">
        
        {/* Titlebar Frame */}
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#0d1e3d] px-4 py-2.5 flex items-center justify-between border-b border-[#2A3F64]">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
              <Users className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <span className="text-[12px] font-black text-slate-100 tracking-wider font-mono">
              Control de Usuarios
            </span>
          </div>
          <button 
            onClick={handleSalir}
            className="text-slate-400 hover:text-white transition-colors p-0.5 rounded hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Window Content */}
        <div className="p-6 flex flex-col md:flex-row gap-6 bg-[#04101e]">
          
          {/* Left Panel: Master Grid */}
          <div className="flex-1 flex flex-col gap-4">
            
            {/* Search filter button/bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Buscar usuario, equipo..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="w-full bg-[#020b18] border border-[#2A3F64] text-slate-200 font-mono text-[11px] font-semibold px-3 py-2 rounded focus:outline-none focus:border-[#D40000] focus:ring-1 focus:ring-[#D40000]"
                />
                <Search className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-[#5F7A9F]" />
              </div>
              <button 
                onClick={() => setFilterText('')}
                className="px-3 py-2 border border-[#2A3F64] hover:bg-slate-800 text-[#5F7A9F] hover:text-white rounded font-mono text-[11px] transition-colors"
              >
                Limpiar
              </button>
            </div>

            {/* Grid Table */}
            <div className="border border-[#2A3F64] rounded overflow-hidden bg-[#020b18] min-h-[300px] max-h-[400px] overflow-y-auto">
              <table className="w-full font-mono text-[11px]">
                <thead>
                  <tr className="bg-[#0d1e3d] text-slate-300 border-b border-[#2A3F64]">
                    <th className="px-3 py-2 text-left font-bold tracking-wider">Equipo</th>
                    <th className="px-3 py-2 text-left font-bold tracking-wider">Usuario</th>
                    <th className="px-3 py-2 text-left font-bold tracking-wider">Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-slate-500">Cargando usuarios...</td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-slate-500">No se encontraron registros</td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, i) => {
                      const isSelected = selectedUser?.usuario.toUpperCase() === u.usuario.toUpperCase();
                      return (
                        <tr 
                          key={i}
                          onClick={() => selectUser(u)}
                          className={`cursor-pointer border-b border-white/[0.04] transition-colors hover:bg-white/[0.03] ${isSelected ? 'bg-blue-650/40 text-white font-bold border-l-4 border-l-blue-500' : 'text-slate-300'}`}
                        >
                          <td className="px-3 py-2.5 truncate max-w-[120px]">{u.equipo}</td>
                          <td className="px-3 py-2.5 font-black text-slate-200">{u.usuario}</td>
                          <td className="px-3 py-2.5 truncate max-w-[200px]">{u.descripcion}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Status counts */}
            <div className="text-[10px] text-slate-500 font-mono flex justify-between px-1">
              <span>Total registros: {filteredUsers.length}</span>
              {isNewMode && <span className="text-[#3b82f6] font-bold">Modo: Nuevo Usuario</span>}
            </div>

          </div>

          {/* Right Panel: Detail Editor */}
          <div className="w-full md:w-[420px] border border-[#2A3F64] rounded-lg p-5 bg-[#071526]/50 flex flex-col justify-between">
            
            {/* Input Form Fields */}
            <div className="flex flex-col gap-4">
              <h3 className="text-slate-200 font-mono font-bold text-[12px] border-b border-[#2A3F64] pb-2 mb-2">
                {isNewMode ? 'NUEVO REGISTRO' : 'DETALLES DEL USUARIO'}
              </h3>

              {/* Error/Success Feedbacks */}
              {errorMsg && (
                <div className="p-2.5 rounded bg-red-950/45 border border-red-800 text-[11px] font-mono text-red-400 flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-2.5 rounded bg-green-950/45 border border-green-800 text-[11px] font-mono text-green-400">
                  {successMsg}
                </div>
              )}

              {/* Field: Nombre de PC */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-black text-[#5F7A9F] uppercase font-mono">Nombre de PC</label>
                <input
                  type="text"
                  value={equipo}
                  onChange={(e) => setEquipo(e.target.value.toUpperCase())}
                  className="bg-[#020b18] border border-[#2A3F64] text-slate-200 font-mono text-[12px] px-3 py-2 rounded focus:outline-none focus:border-[#D40000]"
                />
              </div>

              {/* Field: Usuario */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-black text-[#5F7A9F] uppercase font-mono">Usuario</label>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value.toUpperCase())}
                  disabled={!isNewMode}
                  className="bg-[#020b18] border border-[#2A3F64] text-slate-200 font-mono text-[12px] px-3 py-2 rounded focus:outline-none focus:border-[#D40000] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Field: Clave (Opcional si es edición) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-black text-[#5F7A9F] uppercase font-mono">
                  {isNewMode ? 'Clave de Acceso' : 'Cambiar Clave (opcional)'}
                </label>
                <input
                  type="password"
                  placeholder={isNewMode ? 'Defina la clave' : 'Dejar en blanco para no modificar'}
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  className="bg-[#020b18] border border-[#2A3F64] text-slate-200 font-mono text-[12px] px-3 py-2 rounded focus:outline-none focus:border-[#D40000]"
                />
              </div>

              {/* Field: Descripción */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-black text-[#5F7A9F] uppercase font-mono">Descripción</label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="bg-[#020b18] border border-[#2A3F64] text-slate-200 font-mono text-[12px] px-3 py-2 rounded focus:outline-none focus:border-[#D40000]"
                />
              </div>

              {/* Field: Atributo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-black text-[#5F7A9F] uppercase font-mono">Atributo</label>
                <div className="flex items-center gap-6 mt-1 font-mono text-[11px]">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="atributo"
                      checked={atributo === 'Sólo Lectura'}
                      onChange={() => setAtributo('Sólo Lectura')}
                      className="accent-[#D40000] h-4 w-4 bg-[#020b18] border border-[#2A3F64]"
                    />
                    Sólo Lectura
                  </label>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="atributo"
                      checked={atributo === 'Control Total'}
                      onChange={() => setAtributo('Control Total')}
                      className="accent-[#D40000] h-4 w-4 bg-[#020b18] border border-[#2A3F64]"
                    />
                    Control Total
                  </label>
                </div>
              </div>

              {/* Field: Suspendido */}
              <div className="flex items-center gap-2 mt-2 font-mono text-[11px]">
                <input
                  type="checkbox"
                  id="suspendido"
                  checked={suspendido}
                  onChange={(e) => setSuspendido(e.target.checked)}
                  disabled={usuario.toUpperCase() === 'ADMINISTRADOR'}
                  className="accent-[#D40000] h-4.5 w-4.5 bg-[#020b18] border border-[#2A3F64] rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="suspendido" className="text-slate-300 cursor-pointer uppercase select-none font-bold">
                  Suspendido
                </label>
              </div>

            </div>

            {/* Action Buttons Panel */}
            <div className="grid grid-cols-2 gap-3 mt-8 pt-4 border-t border-[#1E293B]">
              <button
                onClick={handleNew}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-[#2A3F64] font-mono text-[11px] font-bold transition-all"
              >
                <UserPlus className="h-4 w-4 text-blue-400" />
                Nuevo
              </button>
              <button
                onClick={handleSave}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded bg-[#D40000] hover:bg-[#B30000] text-white border border-red-650 font-mono text-[11px] font-bold transition-all shadow-md"
              >
                <Save className="h-4 w-4" />
                Guardar
              </button>
              <button
                onClick={handleDelete}
                disabled={!selectedUser || selectedUser.usuario.toUpperCase() === 'ADMINISTRADOR' || isNewMode}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-950 font-mono text-[11px] font-bold transition-all disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
              <button
                onClick={handleSalir}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-[#2A3F64] font-mono text-[11px] font-bold transition-all"
              >
                <LogOut className="h-4 w-4 text-[#5F7A9F]" />
                Salir
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
