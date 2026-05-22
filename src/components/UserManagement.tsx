import React, { useState } from 'react';
import { MockUser, UserRole } from '../types';
import { Users, UserPlus, ShieldAlert, Cpu, Laptop, Search, RotateCcw, ShieldCheck, HelpCircle } from 'lucide-react';

interface UserManagementProps {
  users: MockUser[];
  onUpdateUserRole: (id: string, newRole: UserRole) => void;
  onUpdateUserStatus: (id: string, newStatus: 'Online' | 'Offline') => void;
  onAddUser: (name: string, email: string, company: string, role: UserRole) => void;
}

export default function UserManagement({
  users,
  onUpdateUserRole,
  onUpdateUserStatus,
  onAddUser,
}: UserManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('usuario');
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newCompany.trim()) return;

    setIsAdding(true);
    setTimeout(() => {
      onAddUser(newName, newEmail, newCompany, newRole);
      setNewName('');
      setNewEmail('');
      setNewCompany('');
      setNewRole('usuario');
      setIsAdding(false);
      setShowAddForm(false);
    }, 500);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">

      {/* Upper Info Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-zinc-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-emerald-950/40 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Panel de Control de Cuentas</div>
            <h2 className="text-xl font-bold text-slate-100 font-mono">Usuarios y Roles</h2>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs font-mono rounded flex items-center gap-1.5 cursor-pointer transition-colors uppercase"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showAddForm ? 'Cerrar Formulario' : 'Nuevo Usuario'}</span>
          </button>
        </div>
      </div>

      {/* Slideout/Collapsible Form to create mock users */}
      {showAddForm && (
        <div className="p-5 bg-zinc-900 border border-emerald-500/30 rounded-xl animate-fadeIn space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
            Registrar Nuevo Usuario Simulado (Instantáneo)
          </h3>
          <form onSubmit={handleCreateUserSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Nombre Completo</label>
              <input
                type="text"
                required
                placeholder="Ej: Marcelo Castro"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-black border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Email de Acceso</label>
              <input
                type="email"
                required
                placeholder="mcastro@empresa.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full bg-black border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Empresa / Unidad</label>
              <input
                type="text"
                required
                placeholder="Ej: Globex Inc"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                className="w-full bg-black border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Rol Inicial</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-black border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                >
                  <option value="usuario">usuario (Cliente)</option>
                  <option value="soporte">soporte (Técnico)</option>
                  <option value="admin">admin (Director)</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isAdding}
                className="px-4 bg-emerald-500 hover:bg-emerald-400 text-black py-1.5 rounded text-xs font-mono font-bold uppercase transition-colors select-none self-end h-[30px]"
              >
                {isAdding ? 'Sumando...' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filters bar */}
      <div className="bg-zinc-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Directorio de Cuentas y Control de Seguridad
            </h3>
            <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 px-1.5 py-0.5 rounded font-mono">
              ROLE REASSIGNMENT ACTIVE
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-600" />
              <input
                type="text"
                placeholder="Buscar por usuario o empresa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-black border border-slate-850 rounded pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-black border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="all">Ver Todos los Roles</option>
              <option value="usuario">usuario (Cliente B2B)</option>
              <option value="soporte">soporte (Técnico)</option>
              <option value="admin">admin (Administrador)</option>
            </select>
          </div>
        </div>

        {/* Directory grid/table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                <th className="py-2 px-2">ID</th>
                <th className="py-2 px-2">Usuario</th>
                <th className="py-2 px-2">Empresa</th>
                <th className="py-2 px-3 text-center">Estado Simulado</th>
                <th className="py-2 px-3 text-center w-[180px]">Asignar Nuevo Rol</th>
                <th className="py-2 px-2 text-right">Fórmula de Permisos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-slate-600 font-mono">
                    Ningún usuario coincide con los criterios de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="text-xs text-slate-300 hover:bg-emerald-500/5 transition-colors">
                    <td className="py-3 px-2 font-mono text-emerald-400">
                      #{u.id}
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-semibold text-slate-200">{u.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3 px-2 font-mono text-slate-400">
                      {u.company}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onUpdateUserStatus(u.id, u.status === 'Online' ? 'Offline' : 'Online')}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border uppercase transition-all ${u.status === 'Online'
                            ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/60 hover:text-emerald-300 hover:border-emerald-700'
                            : 'bg-zinc-900/40 text-slate-500 border-slate-800 hover:text-slate-400'
                          }`}
                        title="Haga clic para cambiar el estado simulado (Online/Offline)"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Online' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-505 bg-slate-600'}`} />
                        {u.status}
                      </button>
                    </td>

                    {/* SELECTOR DE ROL */}
                    <td className="py-3 px-3 text-center">
                      <select
                        value={u.role}
                        onChange={(e) => onUpdateUserRole(u.id, e.target.value as UserRole)}
                        className="w-full bg-black border border-slate-850 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                      >
                        <option value="usuario">usuario (Cliente)</option>
                        <option value="soporte">soporte (Técnico)</option>
                        <option value="admin">admin (Director)</option>
                      </select>
                    </td>

                    <td className="py-3 px-2 text-right">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${u.role === 'admin'
                          ? 'bg-purple-950/20 text-purple-400 border-purple-900/40'
                          : u.role === 'soporte'
                            ? 'bg-cyan-950/20 text-cyan-400 border-cyan-900/40'
                            : 'bg-zinc-900/40 text-slate-400 border-slate-800'
                        }`}>
                        {u.role === 'admin' ? (
                          <>
                            <ShieldAlert className="w-3 h-3 text-purple-400" />
                            Acceso Total
                          </>
                        ) : u.role === 'soporte' ? (
                          <>
                            <Cpu className="w-3 h-3 text-cyan-400" />
                            Operación Técnica
                          </>
                        ) : (
                          <>
                            <Laptop className="w-3 h-3 text-slate-400" />
                            Portal Cliente
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Informative Help Box */}
        <div className="mt-4 p-3 bg-zinc-950/60 border border-slate-850 rounded text-slate-500 text-[11px] font-mono flex gap-2 items-start leading-relaxed">
          <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>CONTROL DE ACCESO:</strong> Al modificar el rol de un usuario en esta tabla, se actualizarán sus privilegios globales de inmediato en la base de datos. Los cambios tendrán efecto la próxima vez que el usuario inicie sesión o interactúe con el sistema.
          </span>
        </div>
      </div>

    </div>
  );
}
