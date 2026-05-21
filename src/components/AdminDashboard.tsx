import { useState, useEffect } from 'react';
import { Ticket, UserRole } from '../types';
import { INITIAL_TECHNICIANS } from '../mockData';
import { Activity, Radio, Cpu, Lock, Unlock, RefreshCw, BarChart2, ShieldAlert } from 'lucide-react';

interface AdminDashboardProps {
  tickets: Ticket[];
  onReassignTicket: (ticketId: string, technician: string) => void;
  isRoundRobinActive: boolean;
  onToggleRoundRobin: (active: boolean) => void;
}

export default function AdminDashboard({
  tickets,
  onReassignTicket,
  isRoundRobinActive,
  onToggleRoundRobin,
}: AdminDashboardProps) {

  // Simulate average response time or calculate from state
  const totalTickets = tickets.length;
  const activeTicketsCount = tickets.filter((t) => t.status === 'Abierto').length;
  const completedTicketsCount = tickets.filter((t) => t.status === 'Resuelto').length;

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: Métricas de Control (Dashboard Básico) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Total Tickets Activos */}
        <div className="p-5 bg-zinc-900 border border-slate-800 rounded-xl flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-1">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">Total Tickets Activos</span>
            <span className="text-3xl font-mono font-bold text-red-400">{activeTicketsCount}</span>
            <span className="text-[10px] text-slate-600 block font-mono">EN CURSO DE RESOLUCIÓN</span>
          </div>
          <div className="p-3 bg-red-950/20 border border-red-900/40 rounded text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Soporte Conectado */}
        <div className="p-5 bg-zinc-900 border border-slate-800 rounded-xl flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-1">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">Soporte Conectado</span>
            <span className="text-3xl font-mono font-bold text-emerald-400">3 Agentes</span>
            <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              SISTEMA OPERATIVO OK
            </span>
          </div>
          <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded text-emerald-400">
            <Radio className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        {/* Card 3: Tiempo Promedio de Respuesta */}
        <div className="p-5 bg-zinc-900 border border-slate-800 rounded-xl flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-1">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">Tiempo Promedio SLA</span>
            <span className="text-3xl font-mono font-bold text-cyan-400">14.6 min</span>
            <span className="text-[10px] text-slate-600 block font-mono">CONTRATO PREMIUM ACTIVO</span>
          </div>
          <div className="p-3 bg-cyan-950/20 border border-cyan-900/40 rounded text-cyan-400">
            <BarChart2 className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* SECTION 2: Módulo de Automatización Operativa */}
      <div className="p-5 bg-zinc-900 border border-slate-800 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/[0.02] rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-100 uppercase font-mono tracking-wider">
                Módulo de Automatización Operativa
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              El algoritmo distribuye solicitudes de forma secuencial y equitativa entre los ingenieros de soporte disponibles (Marta, Carlos, Javier). Al activarse, anula la asignación manual para resguardar la distribución de incidencias de acuerdo con las prioridades de contrato.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-black border border-slate-800 p-3 rounded-lg self-start md:self-center">
            <span className="text-xs font-mono text-slate-400">ESTADO:</span>
            
            {/* Round Robin State Badge */}
            <span className={`px-2.5 py-1 text-[10px] font-mono rounded font-bold uppercase transition-all flex items-center gap-1.5 ${
              isRoundRobinActive 
                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                : 'bg-zinc-800 text-slate-400 border border-slate-700/60'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isRoundRobinActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              {isRoundRobinActive ? 'AUTOROUTE: ACTIVO' : 'AUTOROUTE: MANUAL'}
            </span>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={() => onToggleRoundRobin(!isRoundRobinActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isRoundRobinActive ? 'bg-emerald-500' : 'bg-zinc-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                  isRoundRobinActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: Consola Global de Tickets */}
      <div className="bg-zinc-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800/80">
          <div>
            <h3 className="text-md font-semibold text-slate-100 uppercase tracking-wide font-mono">
              Consola Global de Solicitudes Corporativas
            </h3>
            <p className="text-xs text-slate-500 mt-1">Supervisión en tiempo real de SLAs comerciales e investigadores técnicos.</p>
          </div>
          <div className="text-xs font-mono text-slate-500 uppercase">
            TOTAL EN DB LOCAL: <span className="text-slate-100 font-bold">{totalTickets}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left font-sans">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-2">ID</th>
                <th className="py-2.5 px-2">Compañía</th>
                <th className="py-2.5 px-2">Contacto / Creador</th>
                <th className="py-2.5 px-2">Título de Incidencia</th>
                <th className="py-2.5 px-2">Prioridad</th>
                <th className="py-2.5 px-2 text-center">Técnico Asignado</th>
                <th className="py-2.5 px-2 text-right font-mono">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {tickets.map((tk) => (
                <tr key={tk.id} className="text-xs text-slate-300 hover:bg-emerald-500/5 transition-colors">
                  <td className="py-3.5 px-2 font-mono text-emerald-400 font-semibold">
                    #{tk.id}
                  </td>
                  <td className="py-3.5 px-2 font-mono font-medium text-slate-200">
                    {tk.clientCompany}
                  </td>
                  <td className="py-3.5 px-2 text-slate-400">
                    {tk.createdBy}
                  </td>
                  <td className="py-3.5 px-2 font-medium text-slate-100 max-w-[200px] truncate">
                    {tk.title}
                  </td>
                  <td className="py-3.5 px-2">
                    <span className={`inline-block px-1.5 py-0.5 text-[9px] font-mono uppercase rounded ${
                      tk.priority === 'Alta'
                        ? 'bg-red-950/40 text-red-400'
                        : tk.priority === 'Media'
                        ? 'bg-amber-950/40 text-amber-400'
                        : 'bg-emerald-950/40 text-emerald-400'
                    }`}>
                      {tk.priority}
                    </span>
                  </td>
                  
                  {/* Select Reassign column */}
                  <td className="py-3.5 px-2 text-center min-w-[150px]">
                    <div className="inline-flex items-center gap-1">
                      {isRoundRobinActive ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-mono bg-emerald-950/20 px-2.5 py-1 rounded border border-emerald-900/60 cursor-not-allowed">
                          <Lock className="w-3.5 h-3.5" />
                          <span>{tk.assignedTo || 'Sin Asignar'}</span>
                        </div>
                      ) : (
                        <select
                          value={tk.assignedTo || 'Sin Asignar'}
                          onChange={(e) => onReassignTicket(tk.id, e.target.value)}
                          className="bg-black border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                        >
                          <option value="Sin Asignar">Sin Asignar</option>
                          {INITIAL_TECHNICIANS.map((tech) => (
                            <option key={tech} value={tech}>
                              {tech}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-2 text-right">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
