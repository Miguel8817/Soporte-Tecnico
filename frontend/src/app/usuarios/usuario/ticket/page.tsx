'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { authService } from '@/services/authService';
import { ticketService } from '@/services/ticketService';
import { TicketCategoria, TicketPrioridad } from '@/types/ticket';

export default function CrearTicketPage() {
  const router = useRouter();
  const [categoria, setCategoria] = useState<TicketCategoria>('hardware');
  const [prioridad, setPrioridad] = useState<TicketPrioridad>('media');
  const [descripcion, setDescripcion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const sesion = authService.obtenerSesion();
    if (!sesion || sesion.rol !== 'empleado') {
      router.push('/login');
      return;
    }
    setUsuario(sesion);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (descripcion.trim().length < 10) {
      setError('Por favor proporcione una descripción más detallada (mínimo 10 caracteres).');
      return;
    }
    setCargando(true);
    setError('');

    try {
      await ticketService.crearTicket({
        categoria,
        prioridad,
        descripcion,
      });
      router.push('/usuarios/usuario');
    } catch (err: any) {
      setError(err.message || 'Error al reportar la incidencia.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <DashboardLayout rol="empleado" nombre={usuario?.nombre} codigo={usuario?.codigo} titulo="Reportar Incidencia">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Nueva Solicitud de Soporte</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              El caso se asignará a un técnico con menor carga de trabajo respetando su límite institucional.
            </p>
          </div>
          <Link
            href="/usuarios/usuario"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            ← Volver a mis tickets
          </Link>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Categoría
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as TicketCategoria)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#1D70B8] focus:outline-hidden"
                >
                  <option value="hardware">Hardware (PC, Laptop, Monitor, Mouse)</option>
                  <option value="software">Software (Sistema, Windows, Office)</option>
                  <option value="redes">Redes e Internet (Wi-Fi, Cable, VPN)</option>
                  <option value="impresoras">Impresoras y Escáneres</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Nivel de Prioridad (SLA)
                </label>
                <select
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value as TicketPrioridad)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#1D70B8] focus:outline-hidden"
                >
                  <option value="baja">Baja (Atención estimada en 24h)</option>
                  <option value="media">Media (Atención estimada en 4h)</option>
                  <option value="alta">Alta (Atención estimada en 1h)</option>
                  <option value="critica">Crítica (Atención inmediata en 30m)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Descripción detallada de la avería
              </label>
              <textarea
                required
                rows={5}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Indica qué equipo está fallando, mensajes de error o detalles del inconveniente..."
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-[#1D70B8] focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/usuarios/usuario"
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={cargando}
                className="px-6 py-2.5 text-xs font-bold text-white bg-[#002D62] hover:bg-[#1D70B8] rounded-xl shadow-md transition disabled:opacity-50"
              >
                {cargando ? 'Registrando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
