'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/shared/DashboardLayout';
import SlaBadge from '@/components/shared/SlaBadge';
import ModalFeedback from '@/components/tickets/ModalFeedback';
import ChatTicketModal from '@/components/tickets/ChatTicketModal';
import { authService } from '@/services/authService';
import { ticketService } from '@/services/ticketService';
import { Ticket } from '@/types/ticket';

export default function EmpleadoDashboard() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [usuario, setUsuario] = useState<any>(null);

  // Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');

  // Modales
  const [ticketParaFeedback, setTicketParaFeedback] = useState<string | null>(null);
  const [ticketParaChat, setTicketParaChat] = useState<string | null>(null);
  const [historialTicket, setHistorialTicket] = useState<any[] | null>(null);

  useEffect(() => {
    const sesion = authService.obtenerSesion();
    if (!sesion || sesion.rol !== 'empleado') {
      router.push('/login');
      return;
    }
    setUsuario(sesion);
    cargarTickets(sesion.codigo);
  }, [router]);

  const cargarTickets = async (cod: string) => {
    try {
      setCargando(true);
      const data = await ticketService.obtenerTickets({ codigo: cod });
      setTickets(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar tickets.');
    } finally {
      setCargando(false);
    }
  };

  const verHistorial = async (ticketId: string) => {
    try {
      const data = await ticketService.obtenerHistorial(ticketId);
      setHistorialTicket(data);
    } catch (err: any) {
      alert(err.message || 'Error al cargar historial');
    }
  };

  const handleEnviarFeedback = async (calificacion: number, comentario: string, solucionado: boolean) => {
    if (!ticketParaFeedback) return;
    await ticketService.enviarFeedback(ticketParaFeedback, calificacion, comentario, solucionado);
    if (usuario?.codigo) {
      cargarTickets(usuario.codigo);
    }
  };

  const ticketsFiltrados = tickets.filter((t) => {
    const matchBusqueda =
      t.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.id.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.categoria.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = filtroEstado === 'todos' || t.estado === filtroEstado;
    const matchCategoria = filtroCategoria === 'todas' || t.categoria === filtroCategoria;
    return matchBusqueda && matchEstado && matchCategoria;
  });

  const total = tickets.length;
  const pendientes = tickets.filter((t) => t.estado === 'pendiente').length;
  const enProceso = tickets.filter((t) => t.estado === 'en_proceso').length;
  const resueltos = tickets.filter((t) => t.estado === 'resuelto' || t.estado === 'cerrado').length;

  return (
    <DashboardLayout rol="empleado" nombre={usuario?.nombre} codigo={usuario?.codigo} titulo="Panel del Empleado">
      {/* Tarjetas de Resumen (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Solicitudes</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{total}</p>
          <span className="text-[11px] text-slate-500">Histórico registrado</span>
        </div>
        <div className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Pendientes</span>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendientes}</p>
          <span className="text-[11px] text-amber-700 dark:text-amber-300">En espera de asignación</span>
        </div>
        <div className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1D70B8]">En Atención</span>
          <p className="text-3xl font-black text-[#1D70B8] mt-1">{enProceso}</p>
          <span className="text-[11px] text-blue-700 dark:text-blue-300">Técnico trabajando</span>
        </div>
        <div className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Resueltos</span>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{resueltos}</p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300">Casos solucionados</span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por descripción o código de ticket..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-[#1D70B8] focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="todos">Todos los Estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="en_proceso">En Proceso</option>
            <option value="resuelto">Resueltos</option>
            <option value="cerrado">Cerrados</option>
          </select>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="todas">Todas las Categorías</option>
            <option value="hardware">Hardware</option>
            <option value="software">Software</option>
            <option value="redes">Redes</option>
            <option value="impresoras">Impresoras</option>
          </select>

          <Link
            href="/usuarios/usuario/ticket"
            className="px-4 py-2 bg-[#002D62] hover:bg-[#1D70B8] text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            + Crear Incidencia
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-800">
          {error}
        </div>
      )}

      {/* Listado de Tickets */}
      {cargando ? (
        <div className="text-center py-20 text-slate-400 text-xs font-semibold">Cargando incidencias...</div>
      ) : ticketsFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <span className="text-4xl block mb-2">🎫</span>
          <h3 className="font-bold text-slate-800 dark:text-white text-sm">No se encontraron tickets</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">No hay registros que coincidan con los criterios de búsqueda.</p>
          <Link
            href="/usuarios/usuario/ticket"
            className="px-4 py-2 bg-[#002D62] hover:bg-[#1D70B8] text-white text-xs font-bold rounded-xl"
          >
            Crear Nueva Solicitud
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {ticketsFiltrados.map((t) => (
            <div
              key={t.id}
              className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">#{t.id.slice(0, 8)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    t.prioridad === 'critica' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400' :
                    t.prioridad === 'alta' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                  }`}>
                    {t.prioridad}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {t.categoria}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {t.estado.replace('_', ' ')}
                  </span>
                </div>

                <SlaBadge
                  createdAt={t.created_at}
                  slaStartAt={t.sla_start_at}
                  prioridad={t.prioridad}
                  estado={t.estado}
                />
              </div>

              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mb-3">{t.descripcion}</p>

              {t.solucion_tecnica && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-300 mb-3">
                  <span className="font-bold block mb-1">✓ Solución Aplicada por Soporte:</span>
                  {t.solucion_tecnica}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                <span>Registrado: {new Date(t.created_at).toLocaleString()}</span>

                <div className="flex items-center gap-2">
                  {/* Botón de Mini Chat */}
                  <button
                    onClick={() => setTicketParaChat(t.id)}
                    className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-[#1D70B8] rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>💬</span> Chat Técnico
                  </button>

                  <button
                    onClick={() => verHistorial(t.id)}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold transition cursor-pointer"
                  >
                    Historial
                  </button>

                  {t.estado === 'resuelto' && (
                    <button
                      onClick={() => setTicketParaFeedback(t.id)}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-xs transition cursor-pointer"
                    >
                      ★ Calificar
                    </button>
                  )}

                  {t.calificacion && (
                    <span className="text-amber-500 font-bold">
                      Calificado: {'★'.repeat(t.calificacion)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Chat con el Técnico */}
      <ChatTicketModal
        isOpen={!!ticketParaChat}
        ticketId={ticketParaChat || ''}
        usuarioCodigo={usuario?.codigo || ''}
        onClose={() => setTicketParaChat(null)}
      />

      {/* Modal Historial */}
      {historialTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">Historial de Movimientos</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {historialTicket.length === 0 ? (
                <p className="text-xs text-slate-400">No hay movimientos registrados.</p>
              ) : (
                historialTicket.map((h, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                      <span>{h.estado_anterior} → {h.estado_nuevo}</span>
                      <span className="text-slate-400 font-normal">{new Date(h.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{h.comentario}</p>
                    <span className="text-[10px] text-[#1D70B8] block mt-1">Por: {h.usuario_codigo}</span>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setHistorialTicket(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalFeedback
        isOpen={!!ticketParaFeedback}
        ticketId={ticketParaFeedback || ''}
        onClose={() => setTicketParaFeedback(null)}
        onConfirm={handleEnviarFeedback}
      />
    </DashboardLayout>
  );
}
