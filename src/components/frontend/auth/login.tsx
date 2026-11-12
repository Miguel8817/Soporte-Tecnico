'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';

export default function LoginUser() {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const datos = await authService.loginConCodigo(codigo);
      authService.guardarSesion(datos);

      const rol = datos.rol || datos.user?.rol;
      if (rol === 'admin') {
        router.push('/usuarios/administrador');
      } else if (rol === 'tecnico') {
        router.push('/usuarios/Tecnico');
      } else {
        router.push('/usuarios/usuario');
      }
    } catch (err: any) {
      setError(err.message || 'Código institucional no válido o servidor no disponible.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001D40] via-[#002D62] to-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos visuales de fondo */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#1D70B8]/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-8 sm:p-10 relative z-10 transition-colors">
        {/* Cabecera con Identidad Institucional */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[#002D62] dark:bg-white text-white dark:text-[#002D62] font-black text-2xl shadow-xl shadow-blue-900/40 mb-4 transform hover:scale-105 transition">
            I
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-blue-50 dark:bg-blue-950/60 text-[#002D62] dark:text-blue-300 border border-blue-200 dark:border-blue-800 inline-block mb-2">
            Gobierno de la República Dominicana
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Mesa de Ayuda TI &bull; INABIE
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Ingreso centralizado mediante Código Institucional Único
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
            <span className="text-base shrink-0">⚠️</span>
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={manejarEnvio} className="space-y-5">
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Código Asignado (Empleado / Técnico / Admin)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="EJ: EMP-501, TEC-101, ADM-001"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-center tracking-widest text-base font-bold focus:ring-2 focus:ring-[#1D70B8] focus:outline-hidden transition shadow-inner"
              />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">
              Ingresa tu código sin espacios. Tus datos de departamento y cargo se cargarán automáticamente.
            </p>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#002D62] to-[#1D70B8] hover:from-[#00224b] hover:to-[#175b96] text-white font-bold rounded-2xl shadow-lg shadow-blue-900/30 transition duration-150 disabled:opacity-50 text-xs uppercase tracking-wider cursor-pointer"
          >
            {cargando ? 'Validando Credencial Institucional...' : 'Acceder al Sistema'}
          </button>
        </form>

        {/* Accesos rápidos de prueba institucional */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center mb-3">
            Códigos de Demostración:
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setCodigo('EMP-501')}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-slate-800 text-[#002D62] dark:text-blue-300 hover:bg-blue-100 transition cursor-pointer"
            >
              EMP-501 (Empleado)
            </button>
            <button
              type="button"
              onClick={() => setCodigo('TEC-101')}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-slate-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition cursor-pointer"
            >
              TEC-101 (Técnico)
            </button>
            <button
              type="button"
              onClick={() => setCodigo('ADM-001')}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-50 dark:bg-slate-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition cursor-pointer"
            >
              ADM-001 (Admin)
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-[10px] text-slate-400 dark:text-slate-500">
          Instituto Nacional de Bienestar Estudiantil &bull; Seguridad TI Auditada
        </div>
      </div>
    </div>
  );
}
