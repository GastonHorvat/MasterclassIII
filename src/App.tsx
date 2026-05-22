import React, { useState, useEffect } from 'react';
import { UserRole, UserSession, Ticket, MockUser } from './types';
import LoginForm from './components/LoginForm';
import UserPortal from './components/UserPortal';
import SoporteDashboard from './components/SoporteDashboard';
import AdminDashboard from './components/AdminDashboard';
import UserManagement from './components/UserManagement';
import { LogOut, Terminal, LayoutGrid, MessageSquare, Users, Settings } from 'lucide-react';
import { supabase } from './supabase';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('usuario');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isRoundRobinActive, setIsRoundRobinActive] = useState<boolean>(false);
  const [roundRobinIndex, setRoundRobinIndex] = useState<number>(0);
  const [users, setUsers] = useState<MockUser[]>([]);
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'users'>('dashboard');

  // Verify and restore active Supabase Auth Session on mount
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      if (supabaseSession?.user) {
        // Retrieve relational profile information
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, role, company_id')
          .eq('id', supabaseSession.user.id)
          .single();
          
        if (profile) {
          let companyName = 'Empresa B2B';
          if (profile.company_id) {
            const { data: comp } = await supabase
              .from('companies')
              .select('name')
              .eq('id', profile.company_id)
              .single();
            if (comp) {
              companyName = comp.name;
            }
          }
          
          setSession({
            id: supabaseSession.user.id,
            username: profile.name,
            email: supabaseSession.user.email || '',
            company: companyName,
            role: profile.role
          });
          setUserRole(profile.role);
        }
      }
    };
    
    checkUser();
  }, []);

  // Fetch Tickets from database dynamically
  const fetchTickets = async () => {
    if (!session) return;
    
    let query = supabase
      .from('tickets')
      .select(`
        id,
        title,
        description,
        priority,
        status,
        created_at,
        resolved_at,
        client_company_id,
        companies:client_company_id(name),
        profiles:created_by_id(email, name),
        assigned:assigned_to_id(name),
        ticket_responses(
          id,
          response_text,
          created_at,
          profiles:author_id(name, role)
        )
      `);
      
    // Enforce Tenant Separation at API/Frontend level
    if (userRole === 'usuario') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', session.id)
        .single();
        
      if (profile && profile.company_id) {
        query = query.eq('client_company_id', profile.company_id);
      }
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching tickets:', error);
      return;
    }
    
    if (data) {
      const mappedTickets: Ticket[] = data.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        clientCompany: t.companies?.name || 'Inquilino B2B',
        assignedTo: t.assigned?.name || 'Sin Asignar',
        createdBy: t.profiles?.email || t.profiles?.name || 'usuario@b2bclient.com',
        createdAt: t.created_at,
        responses: (t.ticket_responses || []).map((r: any) => ({
          id: r.id,
          author: r.profiles?.name || 'Soporte',
          role: r.profiles?.role || 'soporte',
          text: r.response_text,
          createdAt: r.created_at
        })).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      }));
      setTickets(mappedTickets);
    }
  };

  // Fetch profiles/users list for Admin tab directory
  const fetchUsers = async () => {
    if (!session || userRole !== 'admin') return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, status, company_id, companies(name)');
      
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    if (data) {
      const mappedUsers: MockUser[] = data.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        company: u.companies?.name || 'Inquilino B2B',
        role: u.role,
        status: u.status === 'Online' ? 'Online' : 'Offline'
      }));
      setUsers(mappedUsers);
    }
  };

  // Load Tickets and Directory upon session activation
  useEffect(() => {
    if (session) {
      fetchTickets();
      if (userRole === 'admin') {
        fetchUsers();
      }
    }
  }, [session, userRole]);

  // Load Round Robin algorithm configurations from DB
  useEffect(() => {
    const fetchSettings = async () => {
      if (!session) return;
      
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'round_robin')
        .single();
        
      if (data && data.value) {
        const val = data.value as any;
        setIsRoundRobinActive(!!val.active);
        setRoundRobinIndex(val.last_tech_index || 0);
      }
    };
    
    fetchSettings();
  }, [session]);

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    setUserRole(newSession.role);
    setActiveAdminTab('dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserRole('usuario');
    setActiveAdminTab('dashboard');
  };

  // Create Ticket Callback (Client auto-services)
  const handleCreateTicket = async (title: string, description: string, priority: 'Alta' | 'Media' | 'Baja') => {
    if (!session || !session.id) return;
    
    // 1. Resolve company_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', session.id)
      .single();
      
    if (!profile || !profile.company_id) return;

    // 2. Transact insertion
    const { data: newTicket, error } = await supabase
      .from('tickets')
      .insert({
        title,
        description,
        priority,
        status: 'Abierto',
        client_company_id: profile.company_id,
        created_by_id: session.id,
        assigned_to_id: null
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating ticket:', error);
      return;
    }
    
    // 3. Apply active Round Robin distribution in real-time
    if (isRoundRobinActive) {
      const { data: settings } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'round_robin')
        .single();
        
      const val = settings?.value as any || { active: false, last_tech_index: 0 };
      const lastTechIndex = val.last_tech_index || 0;
      
      const { data: techs } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'soporte')
        .order('name');
        
      if (techs && techs.length > 0) {
        const nextIndex = (lastTechIndex + 1) % techs.length;
        const assignedTech = techs[lastTechIndex];
        
        await supabase
          .from('tickets')
          .update({ assigned_to_id: assignedTech.id })
          .eq('id', newTicket.id);
          
        await supabase
          .from('system_settings')
          .update({ value: { active: true, last_tech_index: nextIndex } })
          .eq('key', 'round_robin');
          
        await supabase.from('ticket_responses').insert({
          ticket_id: newTicket.id,
          author_id: session.id,
          response_text: `SISTEMA: Round Robin asignó automáticamente este incidente de forma óptima al ingeniero [${assignedTech.name}].`
        });
      }
    }

    fetchTickets();
  };

  // Reassign ticket manually (Admin actions)
  const handleReassignTicket = async (ticketId: string, technician: string) => {
    if (!session || !session.id) return;
    
    let assignedToId = null;
    if (technician !== 'Sin Asignar') {
      const { data: tech } = await supabase
        .from('profiles')
        .select('id')
        .eq('name', technician)
        .eq('role', 'soporte')
        .single();
      if (tech) {
        assignedToId = tech.id;
      }
    }
    
    const { error } = await supabase
      .from('tickets')
      .update({ assigned_to_id: assignedToId })
      .eq('id', ticketId);
      
    if (error) {
      console.error('Error reassigning ticket:', error);
      return;
    }
    
    await supabase.from('ticket_responses').insert({
      ticket_id: ticketId,
      author_id: session.id,
      response_text: `SISTEMA: El administrador reasignó este incidente al ingeniero [${technician}].`
    });
    
    fetchTickets();
  };

  // Toggle Round Robin algorithm dynamically on system_settings
  const handleToggleRoundRobin = async (active: boolean) => {
    const { error } = await supabase
      .from('system_settings')
      .update({ value: { active, last_tech_index: roundRobinIndex } })
      .eq('key', 'round_robin');
      
    if (error) {
      console.error('Error toggling round robin:', error);
      return;
    }
    
    setIsRoundRobinActive(active);
    
    // Auto-distribute existing unassigned tickets upon activation
    if (active) {
      const { data: unassigned } = await supabase
        .from('tickets')
        .select('id')
        .is('assigned_to_id', null);
        
      if (unassigned && unassigned.length > 0) {
        const { data: techs } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('role', 'soporte')
          .order('name');
          
        if (techs && techs.length > 0) {
          let currentIdx = roundRobinIndex;
          for (const tk of unassigned) {
            const assignedTech = techs[currentIdx];
            currentIdx = (currentIdx + 1) % techs.length;
            
            await supabase
              .from('tickets')
              .update({ assigned_to_id: assignedTech.id })
              .eq('id', tk.id);
              
            await supabase.from('ticket_responses').insert({
              ticket_id: tk.id,
              author_id: session?.id || techs[0].id,
              response_text: `SISTEMA: Round Robin asignó automáticamente este incidente de forma óptima al ingeniero [${assignedTech.name}].`
            });
          }
          
          setRoundRobinIndex(currentIdx);
          await supabase
            .from('system_settings')
            .update({ value: { active, last_tech_index: currentIdx } })
            .eq('key', 'round_robin');
        }
      }
    }
    
    fetchTickets();
  };

  // Add communication message response (thread updates)
  const handleAddResponse = async (ticketId: string, text: string) => {
    if (!session || !session.id) return;
    
    const { error } = await supabase.from('ticket_responses').insert({
      ticket_id: ticketId,
      author_id: session.id,
      response_text: text
    });
    
    if (error) {
      console.error('Error adding response:', error);
      return;
    }
    
    fetchTickets();
  };

  // Update resolved/open status of a ticket
  const handleUpdateStatus = async (ticketId: string, status: 'Abierto' | 'Resuelto') => {
    const { error } = await supabase
      .from('tickets')
      .update({ status })
      .eq('id', ticketId);
      
    if (error) {
      console.error('Error updating status:', error);
      return;
    }
    
    fetchTickets();
  };

  // Claim unassigned ticket (Technical self-takeover)
  const handleClaimTicket = async (ticketId: string, techName: string) => {
    if (!session || !session.id) return;
    
    const { error } = await supabase
      .from('tickets')
      .update({ assigned_to_id: session.id })
      .eq('id', ticketId);
      
    if (error) {
      console.error('Error claiming ticket:', error);
      return;
    }
    
    await supabase.from('ticket_responses').insert({
      ticket_id: ticketId,
      author_id: session.id,
      response_text: `SISTEMA: El ingeniero de soporte [${techName}] tomó posesión de esta incidencia para asegurar la meta de SLA.`
    });
    
    fetchTickets();
  };

  // Directory user role update (Admin tab callbacks)
  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
      
    if (error) {
      console.error('Error updating user role:', error);
      return;
    }
    
    fetchUsers();
    
    if (session && userId === session.id) {
      setUserRole(newRole);
      setSession(prev => prev ? { ...prev, role: newRole } : null);
    }
  };

  // Directory user status update (Admin tab callbacks)
  const handleUpdateUserStatus = async (userId: string, newStatus: 'Online' | 'Offline') => {
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', userId);
      
    if (error) {
      console.error('Error updating user status:', error);
      return;
    }
    
    fetchUsers();
  };

  // Directory user provision manually
  const handleAddUser = async (name: string, email: string, company: string, role: UserRole) => {
    let companyId = null;
    const { data: existingComp } = await supabase
      .from('companies')
      .select('id')
      .eq('name', company)
      .single();
      
    if (existingComp) {
      companyId = existingComp.id;
    } else {
      const { data: newComp } = await supabase
        .from('companies')
        .insert({
          name: company,
          domain: email.split('@')[1] || 'generic.com',
          sla_hours: 24
        })
        .select('id')
        .single();
      if (newComp) {
        companyId = newComp.id;
      }
    }
    
    const newUserId = crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-0000-0000-' + Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
    const { error } = await supabase.from('profiles').insert({
      id: newUserId,
      name,
      email,
      role,
      company_id: companyId,
      status: 'Online'
    });
    
    if (error) {
      console.error('Error creating user profile:', error);
      return;
    }
    
    fetchUsers();
  };

  // Render Login screen if no authentic active session exists
  if (!session) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* GLOBAL PRODUCTION NAVBAR */}
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
          <div className="flex items-center gap-3">
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
              title="Cerrar sesión de producción"
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
          <button
            onClick={() => setActiveAdminTab('dashboard')}
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeAdminTab === 'dashboard'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Panel Control Principal"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <div className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer" title="Canales de Comunicación B2B">
            <MessageSquare className="h-4 w-4" />
          </div>
          {userRole === 'admin' && (
            <button
              onClick={() => setActiveAdminTab('users')}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                activeAdminTab === 'users'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Gestión de Usuarios y Roles"
            >
              <Users className="h-4 w-4" />
            </button>
          )}
          <div className="mt-auto text-slate-600 hover:text-slate-400 transition-colors cursor-pointer" title="Parámetros del Sistema">
            <Settings className="h-4 w-4" />
          </div>
        </aside>

        {/* MAIN ROUTE CONTENT SCROLLABLE AREA */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-black">
          
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-5 space-y-5">
            
            {/* Clean Production Status Banner */}
            <div className="px-4 py-2 bg-zinc-900/40 border border-slate-800/80 rounded flex items-center justify-between text-[11px] font-mono text-emerald-400">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>CONECTADO AL MOTOR DE PRODUCCIÓN (SUPABASE RELATIONAL CLOUD)</span>
              </div>
              <div className="hidden lg:flex items-center gap-3 text-slate-500">
                <span>RUTEADOR: {isRoundRobinActive ? 'ROUND ROBIN ACTIVO' : 'ASIGNACIÓN DE INCIDENTES MANUAL'}</span>
                <span>|</span>
                <span>DB SIZE: {tickets.length} RECORDS</span>
              </div>
            </div>

            {/* Dynamic CONDITIONAL View Render according to userRole */}
            <div className="animate-fadeIn">
              {userRole === 'admin' ? (
                activeAdminTab === 'users' ? (
                  <UserManagement
                    users={users}
                    onUpdateUserRole={handleUpdateUserRole}
                    onUpdateUserStatus={handleUpdateUserStatus}
                    onAddUser={handleAddUser}
                  />
                ) : (
                  <AdminDashboard
                    tickets={tickets}
                    onReassignTicket={handleReassignTicket}
                    isRoundRobinActive={isRoundRobinActive}
                    onToggleRoundRobin={handleToggleRoundRobin}
                  />
                )
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
