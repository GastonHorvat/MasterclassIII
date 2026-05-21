import React, { useState } from 'react';
import { Ticket, UserSession } from '../types';
import { PlusCircle, FileText, CheckCircle, Clock, AlertTriangle, MessageSquare, ChevronRight, User } from 'lucide-react';

interface UserPortalProps {
  session: UserSession;
  tickets: Ticket[];
  onCreateTicket: (title: string, description: string, priority: 'Alta' | 'Media' | 'Baja') => void;
  onAddResponse: (ticketId: string, text: string) => void;
}

export default function UserPortal({ session, tickets, onCreateTicket, onAddResponse }: UserPortalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Alta' | 'Media' | 'Baja'>('Media');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  // Filter tickets to display only the ones created by this user or related to standard demo data in order to feel active
  const myTickets = tickets.filter(
    (tk) => tk.createdBy === session.email || tk.clientCompany === session.company
  );

  const selectedTicket = tickets.find((tk) => tk.id === selectedTicketId);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    // Simulate interactive processing delay
    setTimeout(() => {
      onCreateTicket(title, description, priority);
      setTitle('');
      setDescription('');
      setPriority('Media');
      setIsSubmitting(false);
    }, 600);
  };

  const handleSendResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim() || !selectedTicketId) return;

    onAddResponse(selectedTicketId, responseText);
    setResponseText('');
  };

  return (
    <div className="space-y-6">
      
      {/* Banner / Header */}
      <div className="p-6 bg-gradient-to-r from-zinc-900 to-slate-950 border border-slate-800 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase text-emerald-400 tracking-wider">Portal de Autoservicio</div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
              Bienvenido, {session.username}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Organización: <span className="text-slate-200 font-mono font-bold">{session.company}</span> | Canal de soporte VIP asignado.
            </p>
          </div>
          <div className="flex items-center gap-4.5 bg-zinc-950/80 border border-slate-800 p-3 rounded-lg self-start sm:self-center">
            <div className="text-center px-2">
              <div className="text-lg font-bold text-emerald-400 font-mono">{myTickets.length}</div>
              <div className="text-[10px] text-slate-500 font-mono uppercase">Mis Solicitudes</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center px-2">
              <div className="text-lg font-bold text-amber-500 font-mono">
                {myTickets.filter((t) => t.status === 'Abierto').length}
              </div>
              <div className="text-[10px] text-slate-500 font-mono uppercase">Pendientes</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left: Interactive Creation Form (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-slate-800 rounded-xl p-5 relative">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-800/80">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              <h3 className="text-md font-semibold text-slate-100 uppercase tracking-wide font-mono">
                Crear Nueva Solicitud
              </h3>
            </div>

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Título de la Incidencia
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Falla de conexión SSL en terminales de caja"
                  className="w-full bg-black border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Nivel de Prioridad Comercial (SLA)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Alta', 'Media', 'Baja'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`py-2 text-xs font-mono rounded border transition-all ${
                        priority === p
                          ? p === 'Alta'
                            ? 'bg-red-950/40 text-red-400 border-red-800'
                            : p === 'Media'
                            ? 'bg-amber-950/40 text-amber-400 border-amber-800'
                            : 'bg-emerald-950/40 text-emerald-400 border-emerald-800'
                          : 'bg-black text-slate-500 border-slate-800 hover:text-slate-300'
                      }`}
                      onClick={() => setPriority(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Descripción Detallada y Pasos para Reproducir
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describa el comportamiento observado, mensajes de error específicos y el impacto en su negocio..."
                  className="w-full bg-black border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2.5 rounded font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  isSubmitting
                    ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black font-semibold cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span>Transmitiendo Reporte...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Enviar Ticket de Soporte</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right: History Grid + Ticket Inspect (3 columns) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-zinc-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-md font-semibold text-slate-100 uppercase tracking-wide font-mono">
                  Historial de Solicitudes ({session.company})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">ORDENADO POR RECIBIDOS</span>
            </div>

            {myTickets.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800/60 rounded-lg">
                <p className="text-slate-500 text-sm">No hay solicitudes registradas para tu organización.</p>
                <p className="text-xs text-slate-600 font-mono mt-1">Usa el formulario de la izquierda para registrar tu primera incidencia B2B.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {myTickets.map((tk) => {
                  const isSelected = selectedTicketId === tk.id;
                  return (
                    <div
                      key={tk.id}
                      onClick={() => setSelectedTicketId(isSelected ? null : tk.id)}
                      className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-zinc-950 border-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.05)]'
                          : 'bg-black border-slate-800 hover:border-slate-700 hover:bg-zinc-950/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-800/30 px-1.5 py-0.5 rounded">
                            #{tk.id}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            {new Date(tk.createdAt).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        
                        <div className="flex gap-1.5">
                          {/* Priority badge */}
                          <span
                            className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                              tk.priority === 'Alta'
                                ? 'bg-red-950/30 text-red-400 border border-red-900/40'
                                : tk.priority === 'Media'
                                ? 'bg-amber-950/30 text-amber-400 border border-amber-900/40'
                                : 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/40'
                            }`}
                          >
                            {tk.priority}
                          </span>

                          {/* Status badge */}
                          {tk.status === 'Abierto' ? (
                            <span className="flex items-center gap-1 text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 rounded">
                              <Clock className="w-2.5 h-2.5" />
                              Abierto
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 rounded">
                              <CheckCircle className="w-2.5 h-2.5" />
                              Resuelto
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="text-sm font-medium text-slate-200 mt-2 font-sans line-clamp-1">
                        {tk.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {tk.description}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>Asignado a: <strong className="text-slate-300">{tk.assignedTo}</strong></span>
                        <span className="text-emerald-400 flex items-center gap-0.5 hover:underline">
                          {tk.responses.length > 0 ? (
                            <>
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{tk.responses.length} resp.</span>
                            </>
                          ) : (
                            <span>Sin respuestas aún</span>
                          )}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ticket inspector thread */}
          {selectedTicket && (
            <div className="bg-zinc-900 border border-emerald-500/30 rounded-xl p-5 space-y-4 shadow-lg animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 font-mono">Conversación del Ticket</span>
                  <h4 className="text-sm font-bold text-slate-100 mt-0.5">[{selectedTicket.id}] {selectedTicket.title}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTicketId(null)}
                  className="text-xs text-slate-500 hover:text-slate-300 font-mono"
                >
                  CERRAR HILO
                </button>
              </div>

              {/* Initial description card */}
              <div className="p-3 bg-black/60 border border-slate-800 rounded">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                  <span className="flex items-center gap-1 text-slate-300">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    {selectedTicket.createdBy} ({selectedTicket.clientCompany})
                  </span>
                  <span>{new Date(selectedTicket.createdAt).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Responses timeline */}
              <div className="space-y-3 pl-4 border-l-2 border-slate-800">
                {selectedTicket.responses.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono italic">
                    Esperando asignación y primera respuesta técnica...
                  </p>
                ) : (
                  selectedTicket.responses.map((resp, index) => (
                    <div
                      key={resp.id || index}
                      className={`p-3 rounded border text-xs ${
                        resp.role === 'usuario'
                          ? 'bg-zinc-950 border-slate-800 text-slate-300'
                          : resp.role === 'soporte'
                          ? 'bg-slate-900 border-cyan-900/60 text-cyan-50 mr-4'
                          : 'bg-zinc-950 border-purple-900/60 text-purple-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 text-[10px] font-mono">
                        <span className={`font-semibold ${
                          resp.role === 'usuario' 
                            ? 'text-emerald-400' 
                            : resp.role === 'soporte' 
                            ? 'text-cyan-400' 
                            : 'text-purple-400'
                        }`}>
                          {resp.author} ({resp.role.toUpperCase()})
                        </span>
                        <span className="text-slate-500">
                          {new Date(resp.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="leading-relaxed font-sans">{resp.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Interactive add follow-up reply */}
              <form onSubmit={handleSendResponse} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Escriba un mensaje de seguimiento..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="flex-1 bg-black border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-3 bg-emerald-500 text-black py-1 rounded text-xs font-mono hover:bg-emerald-400 cursor-pointer"
                >
                  Responder
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
