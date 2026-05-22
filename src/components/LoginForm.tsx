import React, { useState } from 'react';
import { UserRole, UserSession } from '../types';
import { Shield, Key, Mail, Building, LogIn, UserPlus } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('usuario');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick credentials presets for demo purposes
  const PRESETS = [
    {
      label: 'Acceso Usuario Final (B2B)',
      email: 'gastonhorvat@gmail.com',
      company: 'Acme Corp',
      role: 'usuario' as UserRole,
      color: 'border-emerald-800 text-emerald-400 hover:border-emerald-400 hover:bg-emerald-950/20',
    },
    {
      label: 'Acceso Técnico Soporte',
      email: 'marta.soporte@ticketb2b.com',
      company: 'Soporte Interno #02',
      role: 'soporte' as UserRole,
      color: 'border-cyan-800 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-950/20',
    },
    {
      label: 'Acceso Administrador IT',
      email: 'chief.admin@ticketb2b.com',
      company: 'Global IT Operations',
      role: 'admin' as UserRole,
      color: 'border-purple-800 text-purple-400 hover:border-purple-400 hover:bg-purple-950/20',
    },
  ];

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    setEmail(preset.email);
    setPassword('••••••••••••');
    setCompany(preset.company);
    setName(preset.role === 'usuario' ? 'Gastón Horvat' : preset.role === 'soporte' ? 'Marta (Técnico)' : 'Administrador Principal');
    setSelectedRole(preset.role);
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Por favor introduce un correo corporativo válido.');
      return;
    }

    if (activeTab === 'login' && !password) {
      setErrorMsg('Por favor introduce tu contraseña.');
      return;
    }

    if (activeTab === 'register' && (!company || !name)) {
      setErrorMsg('Por favor completa todos los campos de registro.');
      return;
    }

    setIsSubmitting(true);

    // Simulate short network delay for visual feedback
    setTimeout(() => {
      setIsSubmitting(false);
      const computedSession: UserSession = {
        username: name || email.split('@')[0],
        email: email,
        company: company || (selectedRole === 'usuario' ? 'Empresa Asociada' : 'Global Soporte B2B'),
        role: selectedRole,
      };
      onLoginSuccess(computedSession);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      
      {/* Visual branding container */}
      <div className="w-full max-w-md text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-900/40 bg-emerald-950/10 mb-3 text-xs tracking-wider text-emerald-400 font-mono uppercase">
          <Shield className="w-4.5 h-4.5 animate-pulse" />
          <span>B2B SECURE TICKET SHELL v1.4</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight font-sans">
          Central Multi-Soporte <span className="text-emerald-400">Corporativo</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Gestión de incidencias de infraestructura crítica y SLAs de contrato.
        </p>
      </div>

      <div className="w-full max-w-md bg-zinc-900/95 border border-slate-800 rounded-xl shadow-[0_0_50px_rgba(16,185,129,0.02)] p-6 overflow-hidden relative">
        
        {/* Glowing border accent on top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 mb-6">
          <button
            type="button"
            className={`flex-1 pb-3 text-sm font-medium transition-colors relative flex items-center justify-center gap-2 ${
              activeTab === 'login' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-100'
            }`}
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
            }}
          >
            <LogIn className="w-4 h-4" />
            Iniciar Sesión
            {activeTab === 'login' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
            )}
          </button>
          <button
            type="button"
            className={`flex-1 pb-3 text-sm font-medium transition-colors relative flex items-center justify-center gap-2 ${
              activeTab === 'register' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-100'
            }`}
            onClick={() => {
              setActiveTab('register');
              setSelectedRole('usuario');
              setErrorMsg('');
            }}
          >
            <UserPlus className="w-4 h-4" />
            Registrar Cuenta
            {activeTab === 'register' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Preset quick buttons */}
        {activeTab === 'login' && (
          <div className="mb-6">
            <p className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-2.5">
              Presintonías de Usuario (Demostración Rápida)
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`w-full py-2 px-3 text-xs rounded border text-left flex items-center justify-between font-mono transition-all uppercase ${preset.color}`}
                  onClick={() => handlePresetSelect(preset)}
                >
                  <span>{preset.label}</span>
                  <span className="text-[10px] bg-zinc-800/80 px-1.5 py-0.5 rounded ml-2">
                    {preset.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'login' && (
          <div className="relative text-center my-4">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-800/80"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase font-mono">
              <span className="bg-zinc-900 px-2 text-slate-500">O credenciales manuales</span>
            </div>
          </div>
        )}

        {/* Real-time interactive form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-900/60 rounded text-red-400 text-xs font-mono">
              ⚠ Error: {errorMsg}
            </div>
          )}

          {activeTab === 'register' && (
            <>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Gastón Horvat"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-sans transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Empresa Corporativa</label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-600" />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Ej: Acme Corp"
                    className="w-full bg-slate-950 border border-slate-800 rounded pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-sans transition-all"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Email Corporativo</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-600" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@tuempresa.com"
                className="w-full bg-slate-950 border border-slate-800 rounded pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-sans transition-all animate-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Contraseña Encriptada</label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-600" />
              <input
                type="password"
                value={password || ''}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded font-mono text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              isSubmitting
                ? 'bg-emerald-950 text-emerald-600 border border-emerald-900/40 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black font-semibold cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4.5 h-4.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span>Autenticando...</span>
              </div>
            ) : activeTab === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Ingresar al Sistema</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Crear y Autenticar</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info indicating 100% Client-Side Simulation */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] font-mono text-slate-600 uppercase">
            ESTADO CORPORATIVO RESGUARDADO | CONTROL FRONTEND LOCAL
          </p>
        </div>
      </div>
    </div>
  );
}
