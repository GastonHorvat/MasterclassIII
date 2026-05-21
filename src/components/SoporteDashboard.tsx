import React, { useState } from 'react';
import { Ticket, UserSession } from '../types';
import { ShieldCheck, ClipboardList, CheckSquare, MessageSquare, AlertTriangle, User, ArrowUpRight, Search } from 'lucide-react';

interface SoporteDashboardProps {
  session: UserSession;
  tickets: Ticket[];
  onAddResponse: (ticketId: string, text: string) => void;
  onUpdateStatus: (ticketId: string, status: 'Abierto' | 'Resuelto') => void;
  onClaimTicket: (ticketId: string, techName: string) => void;
}

export default function SoporteDashboard({
  session,
  tickets,
  onAddResponse,
  onUpdateStatus,
  onClaimTicket,
}: SoporteDashboardProps) {
  // Determine technician active name for state matching
  // Handled elegantly: if logged as Marta preset, session.username is "Marta"
  const techName = session.username || 'Marta';
  const displayId = session.username === 'Marta' ? 'Soporte Técnico #02' : session.username === 'Carlos' ? 'Soporte Técnico #01' : 'Soporte Técnico #03';

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [activeTab, setActiveTab] = useState<'assigned' | 'unassigned'>('assigned');
  const [searchQuery, setSearchQuery] = useState('');

  // Get tickets assigned specifically to this technician
  const assignedTickets = tickets.filter(
    (tk) => tk.assignedTo.toLowerCase() === techName.toLowerCase()
  );

  // Get tickets that are not assigned to anybody yet
  const unassignedTickets = tickets.filter(
    (tk) => tk.assignedTo === 'Sin Asignar' || !tk.assignedTo
  );

  const displayedTickets = activeTab === 'assigned' ? assignedTickets : unassignedTickets;

  // Filter with search text if inputted
  const filteredTickets = displayedTickets.filter(
    (tk) =>
      tk.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tk.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tk.clientCompany.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTicket = tickets.find((tk) => tk.id === selectedTicketId);

  const handleSubmitResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim() || !selectedTicketId) return;

    onAddResponse(selectedTicketId, responseText);
    setResponseText('');
  };

  const handleMarkResolved = () => {
    if (!selectedTicketId) return;
    onUpdateStatus(selectedTicketId, 'Resuelto');
    // Add automated log
    onAddResponse(selectedTicketId, 'SISTEMA: El técnico marcó esta incidencia como [RESUELTO]. Se cerró la sesión de atención.');
  };

  const handleMarkOpen = () => {
    if (!selectedTicketId) return;
    onUpdateStatus(selectedTicketId, 'Abierto');
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Technical Console Head */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-zinc-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-cyan-950/40 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest">{displayId}</div>
            <h2 className="text-xl font-bold text-slate-100 font-mono">Consola Técnica: {techName}</h2>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs font-mono">
          <div className="px-3 py-1.5 bg-black rounded border border-slate-800">
            <span className="text-slate-500 mr-2">PENDIENTES ASIGNADOS:</span>
            <span className="text-amber-400 font-bold">{assignedTickets.filter(t => t.status === 'Abierto').length}</span>
          </div>
          <div className="px-3 py-1.5 bg-black rounded border border-slate-800">
            <span className="text-slate-500 mr-2">SIN ASIGNAR:</span>
            <span className="text-cyan-400 font-bold">{unassignedTickets.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Tickets Panel (8 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-zinc-900 border border-slate-800 rounded-xl p-5">
            
            {/* Tab switchers and Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800/80">
              <div className="flex bg-black p-1 rounded border border-slate-800/60 font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('assigned');
                    setSelectedTicketId(null);
                  }}
                  className={`px-3 py-1.5 text-xs rounded transition-all ${
                    activeTab === 'assigned'
                      ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/60 font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Mis Incidentes ({assignedTickets.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('unassigned');
                    setSelectedTicketId(null);
                  }}
                  className={`px-3 py-1.5 text-xs rounded transition-all ${
                    activeTab === 'unassigned'
                      ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/60 font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Buzón Global ({unassignedTickets.length})
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar ID, título o cliente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-48 bg-black border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 block">
              {activeTab === 'assigned' ? 'Incidencias Asignadas a mí' : 'Incidencias Libres en SLA'}
            </h3>

            {/* List / Table of Tickets */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left font-sans">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-2">ID</th>
                    <th className="py-2.5 px-2">Cliente</th>
                    <th className="py-2.5 px-2">Asunto / Título</th>
                    <th className="py-2.5 px-2 text-center">Prioridad</th>
                    <th className="py-2.5 px-2 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-xs text-slate-600 font-mono">
                        Ninguna incidencia coincide con el criterio actual.
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((tk) => {
                      const isSelected = selectedTicketId === tk.id;
                      return (
                        <tr
                          key={tk.id}
                          onClick={() => setSelectedTicketId(isSelected ? null : tk.id)}
                          className={`group cursor-pointer text-xs transition-colors ${
                            isSelected
                              ? 'bg-cyan-950/25 text-slate-100 font-semibold border-l-2 border-emerald-500'
                              : 'hover:bg-emerald-500/5 text-slate-300'
                          }`}
                        >
                          <td className="py-3 px-2 font-mono text-cyan-400">
                            #{tk.id}
                          </td>
                          <td className="py-3 px-2 font-mono max-w-[80px] truncate">
                            {tk.clientCompany}
                          </td>
                          <td className="py-3 px-2 font-medium max-w-[180px] truncate">
                            {tk.title}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span
                              className={`inline-block px-1.5 py-0.5 text-[9px] font-mono uppercase rounded ${
                                tk.priority === 'Alta'
                                  ? 'bg-red-950/40 text-red-400'
                                  : tk.priority === 'Media'
                                  ? 'bg-amber-950/40 text-amber-400'
                                  : 'bg-emerald-950/40 text-emerald-400'
                              }`}
                            >
                              {tk.priority}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            {tk.status === 'Abierto' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-mono">
                                Abierto
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono">
                                Resuelto
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>

        {/* Right Column: Split panel interaction (5 cols) */}
        <div className="lg:col-span-5">
          {selectedTicket ? (
            <div className="bg-zinc-900 border border-cyan-800/40 rounded-xl p-5 space-y-4 shadow-lg sticky top-4">
              
              {/* Header inspect info */}
              <div className="pb-3 border-b border-slate-800 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-1.5 py-0.5 rounded">
                      #{selectedTicket.id}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{selectedTicket.clientCompany}</span>
                  </div>
                  <h3 className="text-md font-bold text-slate-100 mt-2 font-sans">{selectedTicket.title}</h3>
                </div>
                {activeTab === 'unassigned' && (
                  <button
                    type="button"
                    onClick={() => {
                      onClaimTicket(selectedTicket.id, techName);
                      setActiveTab('assigned');
                    }}
                    className="px-2.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs font-mono rounded flex items-center gap-1 cursor-pointer"
                  >
                    Atender <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Status and Actions Bar */}
              <div className="p-3 bg-black/60 rounded border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Estado Resolutivo:</span>
                  {selectedTicket.status === 'Abierto' ? (
                    <span className="text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/30">
                      ABIERTO (SLA Activo)
                    </span>
                  ) : (
                    <span className="text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-800/30">
                      CERRADO / RESUELTO
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Solicitante:</span>
                  <span className="text-slate-300">{selectedTicket.createdBy}</span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex gap-2">
                  {selectedTicket.status === 'Abierto' ? (
                    <button
                      type="button"
                      onClick={handleMarkResolved}
                      className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] font-mono rounded transition-colors uppercase cursor-pointer"
                    >
                      Marcar como Resuelto ✓
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleMarkOpen}
                      className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-slate-200 font-bold text-[11px] font-mono rounded transition-colors uppercase cursor-pointer"
                    >
                      Reabrir Incidencia ↺
                    </button>
                  )}
                </div>
              </div>

              {/* Original Incident Description */}
              <div className="space-y-1">
                <h4 className="text-xs font-mono uppercase text-slate-500">Reporte del Cliente:</h4>
                <div className="p-3 bg-black/40 border border-slate-800 rounded text-slate-300 text-xs font-sans max-h-40 overflow-y-auto">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Response Logs */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase text-slate-500">Historial de Comunicación:</h4>
                <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                  {selectedTicket.responses.length === 0 ? (
                    <p className="text-[11px] text-slate-600 font-mono italic">Sin respuestas técnicas registradas en este incidente.</p>
                  ) : (
                    selectedTicket.responses.map((resp, index) => (
                      <div
                        key={resp.id || index}
                        className={`p-2.5 rounded border text-[11px] ${
                          resp.role === 'soporte'
                            ? 'bg-cyan-950/20 border-cyan-900/40 text-cyan-20'
                            : resp.role === 'usuario'
                            ? 'bg-black border-slate-800 text-slate-300'
                            : 'bg-zinc-950 border-purple-900/40 text-purple-100'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1 text-[9px] font-mono text-slate-400">
                          <span className={resp.role === 'soporte' ? 'text-cyan-400 font-medium' : 'text-emerald-400'}>
                            {resp.author} ({resp.role.toUpperCase()})
                          </span>
                          <span>{new Date(resp.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="font-sans leading-relaxed">{resp.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Respond to Incident input */}
              <form onSubmit={handleSubmitResponse} className="pt-2 border-t border-slate-800 space-y-2">
                <label className="block text-xs font-mono uppercase text-slate-400">
                  Redactar Respuesta Técnica:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Escriba código de error, resolución o solicitud de información..."
                    className="flex-1 bg-black border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-cyan-700 hover:bg-cyan-600 text-cyan-100 font-mono text-xs rounded transition-colors cursor-pointer"
                  >
                    Enviar
                  </button>
                </div>
              </form>

            </div>
          ) : (
            <div className="bg-zinc-900/60 border border-slate-800 border-dashed rounded-xl p-10 text-center flex flex-col items-center justify-center min-h-[400px]">
              <ClipboardList className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-slate-400 text-sm font-medium">No hay ninguna incidencia seleccionada</p>
              <p className="text-slate-600 text-xs font-mono mt-1">Selecciona un ticket de la lista para ver su historial, responder u operar su estado.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
