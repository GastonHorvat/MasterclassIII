import React, { useState } from 'react';
import { UserSession } from '../types';
import { Shield, Key, Mail, Building, LogIn, UserPlus, CheckCircle } from 'lucide-react';
import { supabase } from '../supabase';

interface LoginFormProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationPending, setRegistrationPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Por favor introduce un correo corporativo válido.');
      return;
    }

    if (!password) {
      setErrorMsg('Por favor introduce tu contraseña.');
      return;
    }

    if (activeTab === 'register' && (!company || !name)) {
      setErrorMsg('Por favor completa todos los campos de registro.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (activeTab === 'login') {
        // 1. Autenticación con Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (!data.user) throw new Error('No se pudo recuperar la información del usuario.');

        // 2. Handshake de Roles Relacionales
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('name, role, company_id')
          .eq('id', data.user.id)
          .single();

        if (profileErr) {
          throw new Error('Error al obtener el perfil de usuario: ' + profileErr.message);
        }

        // 3. Extracción de Payload Seguro de Inquilino (Compañía)
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

        // 4. Propagación del Estado de Producción
        const computedSession: UserSession = {
          id: data.user.id,
          username: profile.name || name || email.split('@')[0],
          email: data.user.email || email,
          company: companyName,
          role: profile.role,
        };

        onLoginSuccess(computedSession);
      } else {
        // Crear Cuenta (Registro)
        // 1. Registro en Supabase Auth con metadata para el trigger de confirmacion
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
              company: company,
            }
          }
        });

        if (error) throw error;

        // 2. El perfil se creara automaticamente via trigger cuando el usuario confirme su email.
        //    Mostramos el mensaje de confirmacion pendiente.
        setPendingEmail(email);
        setRegistrationPending(true);
      }
    } catch (err: any) {
      let msg = err.message || 'Ocurrió un error inesperado durante el flujo de autenticación.';
      if (msg.toLowerCase().includes('email not confirmed')) {
        msg = 'Debes confirmar tu correo electrónico antes de iniciar sesión. Por favor, revisa tu bandeja de entrada.';
      } else if (msg.toLowerCase().includes('invalid login credentials')) {
        msg = 'Credenciales de inicio de sesión inválidas. Por favor, verifica tu correo y contraseña.';
      } else if (msg.toLowerCase().includes('user already registered')) {
        msg = 'Este correo electrónico ya está registrado.';
      }
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
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

      {/* === PANTALLA DE CONFIRMACION PENDIENTE === */}
      {registrationPending ? (
        <div className="w-full max-w-md bg-zinc-900/95 border border-emerald-500/30 rounded-xl shadow-[0_0_50px_rgba(16,185,129,0.05)] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">¡Cuenta creada con éxito!</h2>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed">
            Te enviamos un email de confirmación a:
          </p>
          <div className="px-4 py-2.5 bg-black border border-slate-700 rounded-lg font-mono text-emerald-400 text-sm mb-5">
            {pendingEmail}
          </div>
          <p className="text-slate-500 text-xs leading-relaxed mb-6">
            Por favor revisá tu bandeja de entrada y hacé clic en el enlace de confirmación para activar tu cuenta. Una vez confirmada, podrás iniciar sesión normalmente.
          </p>
          <div className="p-3 bg-amber-950/20 border border-amber-800/30 rounded text-amber-400/80 text-[11px] font-mono mb-5">
            ⚠ Tu rol de acceso será asignado por el administrador del sistema una vez que tu cuenta sea verificada.
          </div>
          <button
            type="button"
            onClick={() => {
              setRegistrationPending(false);
              setActiveTab('login');
              setEmail(pendingEmail);
              setPassword('');
              setName('');
              setCompany('');
            }}
            className="w-full py-2.5 rounded font-mono text-xs uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-slate-300 transition-all cursor-pointer"
          >
            Volver al inicio de sesión
          </button>
        </div>
      ) : (

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

              {/* Nota informativa sobre el correo y rol */}
              <div className="p-3 bg-zinc-950 border border-slate-800/60 rounded text-[11px] font-mono text-slate-400 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✉</span>
                  <span><strong>Confirmación por Correo:</strong> Se enviará un email para verificar tu cuenta. Deberás confirmarlo antes de poder iniciar sesión.</span>
                </div>
                <div className="flex items-start gap-2 border-t border-slate-800/40 pt-2">
                  <span className="text-emerald-500 mt-0.5">👤</span>
                  <span><strong>Asignación de Rol:</strong> Tu rol de acceso será asignado por el administrador tras la verificación.</span>
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
                <span>Registrar Cuenta y Enviar Confirmación</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info indicating Secure Enterprise Auth */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] font-mono text-slate-600 uppercase">
            CONEXIÓN DIRECTA CON EL MOTOR DE AUTENTICACIÓN DE SUPABASE
          </p>
        </div>
      </div>
      )}
    </div>
  );
}
