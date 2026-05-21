import React, { useState, useEffect } from 'react';
import { UserRole, UserSession, Ticket, TicketResponse } from './types';
import { INITIAL_TICKETS, INITIAL_TECHNICIANS } from './mockData';
import LoginForm from './components/LoginForm';
import UserPortal from './components/UserPortal';
import SoporteDashboard from './components/SoporteDashboard';
import AdminDashboard from './components/AdminDashboard';
import { LogOut, SlidersHorizontal, Terminal, Shield, RefreshCw, LayoutGrid, MessageSquare, Users, Settings } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('usuario');
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [isRoundRobinActive, setIsRoundRobinActive] = useState<boolean>(false);
  const [roundRobinIndex, setRoundRobinIndex] = useState<number>(0);

  // Sync userRole with userSession when user registers/logs in
  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    setUserRole(newSession.role);
  };

  const handleLogout = () => {
    setSession(null);
  };

  // Direct manual role-switching dropdown for interactive classroom demo
  const handleForcedRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const forcedRole = e.target.value as UserRole;
    setUserRole(forcedRole);
    if (session) {
      setSession({
        ...session,
        role: forcedRole,
        // Optional placeholder adjustment to match company identity
        company: forcedRole === 'usuario' ? 'Acme Corp' : forcedRole === 'soporte' ? 'Soporte Técnico #02' : 'Global IT Operations',
        username: forcedRole === 'usuario' ? 'Gastón Horvat' : forcedRole === 'soporte' ? 'Marta' : 'Administrador Principal'
      });
    }
  };

  // Create Ticket Callback (From UserPortal)
  const handleCreateTicket = (title: string, description: string, priority: 'Alta' | 'Media' | 'Baja') => {
    const nextIdNumber = Math.max(...tickets.map(t => parseInt(t.id.replace('TK-', '')) || 0)) + 1;
    const computedId = `TK-${nextIdNumber}`;

    let assignedTech = 'Sin Asignar';
    let currentIdx = roundRobinIndex;

    // Apply Round Robin distribution automatically if toggle switch is active
    if (isRoundRobinActive) {
      assignedTech = INITIAL_TECHNICIANS[currentIdx];
      currentIdx = (currentIdx + 1) % INITIAL_TECHNICIANS.length;
      setRoundRobinIndex(currentIdx);
    }

    const newTicket: Ticket = {
      id: computedId,
      title,
      description,
      priority,
      status: 'Abierto',
      clientCompany: session?.company || 'Empresa Asociada B2B',
      assignedTo: assignedTech,
      createdBy: session?.email || 'anonimo@b2bclient.com',
      createdAt: new Date().toISOString(),
      responses: []
    };

    setTickets([newTicket, ...tickets]);
  };

  // Assign ticket (From Admin Console / Round Robin Switch)
  const handleReassignTicket = (ticketId: string, technician: string) => {
    setTickets(prevTickets =>
      prevTickets.map(tk =>
        tk.id === ticketId ? { ...tk, assignedTo: technician } : tk
      )
    );
  };

  // Auto assign all "Sin Asignar" tickets when Round Robin is toggled ON
  const handleToggleRoundRobin = (active: boolean) => {
    setIsRoundRobinActive(active);
    if (active) {
      let currentIdx = roundRobinIndex;
      setTickets(prevTickets =>
        prevTickets.map(tk => {
          if (tk.assignedTo === 'Sin Asignar' || !tk.assignedTo) {
            const assignedTech = INITIAL_TECHNICIANS[currentIdx];
            currentIdx = (currentIdx + 1) % INITIAL_TECHNICIANS.length;
            
            // Generate system log thread
            const roundRobinLog: TicketResponse = {
              id: `RR-${Date.now()}-${Math.random()}`,
              author: 'SISTEMA AUTOMÁTICO',
              role: 'admin',
              text: `SISTEMA: Round Robin asignó automáticamente este incidente de forma óptima al ingeniero [${assignedTech}].`,
              createdAt: new Date().toISOString()
            };

            return {
              ...tk,
              assignedTo: assignedTech,
              responses: [...tk.responses, roundRobinLog]
            };
          }
          return tk;
        })
      );
      setRoundRobinIndex(currentIdx);
    }
  };

  // Add communication message response (From both technician, client and admin)
  const handleAddResponse = (ticketId: string, text: string) => {
    if (!session) return;

    const newResponse: TicketResponse = {
      id: `R-${Date.now()}`,
      author: session.username,
      role: session.role,
      text: text,
      createdAt: new Date().toISOString()
    };

    setTickets(prevTickets =>
      prevTickets.map(tk =>
        tk.id === ticketId
          ? { ...tk, responses: [...tk.responses, newResponse] }
          : tk
      )
    );
  };

  // Update status open/resolved
  const handleUpdateStatus = (ticketId: string, status: 'Abierto' | 'Resuelto') => {
    setTickets(prevTickets =>
      prevTickets.map(tk =>
        tk.id === ticketId ? { ...tk, status: status } : tk
      )
    );
  };

  // Technical claim on unassigned tickets
  const handleClaimTicket = (ticketId: string, techName: string) => {
    setTickets(prevTickets =>
      prevTickets.map(tk =>
        tk.id === ticketId ? { ...tk, assignedTo: techName } : tk
      )
    );

    // Automated audit thread response
    handleAddResponse(ticketId, `SISTEMA: El ingeniero de soporte [${techName}] tomó posesión de esta incidencia para asegurar la meta de SLA.`);
  };

  // Render LoginForm if no session is active
  if (!session) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* GLOBAL MANAGEMENT NAVBAR */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-800 bg-zinc-950 px-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] text-black">
            <Terminal className="w-5 h-5 text-black" />
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-tight uppercase text-emerald-400 font-sans">
            Nexus <span className="text-slate-100">Core B2B</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* ROLE SIMULATOR DROPDOWN */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-slate-800 rounded px-2.5 py-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={userRole}
              onChange={handleForcedRoleChange}
              className="bg-transparent text-[11px] font-semibold text-emerald-400 focus:outline-none cursor-pointer pr-1 font-mono"
            >
              <option value="usuario">USUARIO (Cliente VIP)</option>
              <option value="soporte">SOPORTE (Técnico)</option>
              <option value="admin">ADMIN (Mesa Central)</option>
            </select>
          </div>

          <div className="flex items-center gap-3 border-l border-slate-850 pl-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold leading-none">{session.username}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">{session.company}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-zinc-800 border border-emerald-500/30 flex items-center justify-center text-xs font-bold font-mono">
              {session.username.substring(0, 2).toUpperCase()}
            </div>
            
            {/* Logout button */}
            <button
              onClick={handleLogout}
              title="Cerrar sesión simulada"
              className="p-1 px-1.5 rounded hover:bg-zinc-850 text-slate-500 hover:text-slate-300 transition-all font-mono text-[10px] uppercase flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* CORE FRAME FOR VIEWS LAYOUT WITH MULTI-PANEL SIDEBAR */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* COMPACT LEFT SIDEBAR */}
        <aside className="hidden md:flex w-14 flex-col items-center py-4 gap-6 border-r border-slate-800 bg-zinc-950 shrink-0">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            <LayoutGrid className="h-4 w-4" />
          </div>
          <div className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer" title="Canales de Comunicación B2B">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer" title="SLA Directorio">
            <Users className="h-4 w-4" />
          </div>
          <div className="mt-auto text-slate-600 hover:text-slate-400 transition-colors cursor-pointer" title="Parámetros del Sistema">
            <Settings className="h-4 w-4" />
          </div>
        </aside>

        {/* MAIN ROUTE CONTENT SCROLLABLE AREA */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-black">
          
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-5 space-y-5">
            
            {/* State Banner reminding students that everything is statefully simulated */}
            <div className="px-4 py-2 bg-emerald-950/15 border border-emerald-900/30 rounded flex items-center justify-between text-[11px] font-mono text-emerald-400">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>ENTORNO INTERACTIVO EN TIEMPO REAL (REACT STATE ENGINE)</span>
              </div>
              <div className="hidden lg:flex items-center gap-3">
                <span>RUTEADOR: {isRoundRobinActive ? 'AUTOROUTE ACTIVO' : 'ASIGNACIÓN MANUAL'}</span>
                <span>|</span>
                <span>DB SIZE: {tickets.length} RECORDS</span>
              </div>
            </div>

            {/* Dynamic CONDITIONAL View Render according to userRole */}
            <div className="animate-fadeIn">
              {userRole === 'admin' ? (
                <AdminDashboard
                  tickets={tickets}
                  onReassignTicket={handleReassignTicket}
                  isRoundRobinActive={isRoundRobinActive}
                  onToggleRoundRobin={handleToggleRoundRobin}
                />
              ) : userRole === 'soporte' ? (
                <SoporteDashboard
                  session={session}
                  tickets={tickets}
                  onAddResponse={handleAddResponse}
                  onUpdateStatus={handleUpdateStatus}
                  onClaimTicket={handleClaimTicket}
                />
              ) : (
                <UserPortal
                  session={session}
                  tickets={tickets}
                  onCreateTicket={handleCreateTicket}
                  onAddResponse={handleAddResponse}
                />
              )}
            </div>
          </main>

          {/* FOOTER */}
          <footer className="bg-zinc-950 border-t border-slate-800/80 py-3.5 px-4 text-center text-xs text-slate-600 font-mono mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>© 2026 NEXUS B2B PLATFORM | ENTERPRISE GRADE SLA INTEGRITY</p>
              <p className="text-emerald-500/80 bg-emerald-950/10 px-2 py-0.5 rounded border border-emerald-900/20">
                SOPORTE AVANZADO DE INCIDENCIAS CORPORATIVAS
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
