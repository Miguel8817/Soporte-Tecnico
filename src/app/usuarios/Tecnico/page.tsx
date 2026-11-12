'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import SlaBadge from '@/components/shared/SlaBadge';
import ModalRechazo from '@/components/tickets/ModalRechazo';
import ChatTicketModal from '@/components/tickets/ChatTicketModal';
import { authService } from '@/services/authService';
import { ticketService } from '@/services/ticketService';
import { Ticket } from '@/types/ticket';

export default function TecnicoDashboard() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [usuario, setUsuario] = useState<any>(null);

  // Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Modales
  const [ticketParaRechazo, setTicketParaRechazo] = useState<string | null>(null);
  const [ticketParaResolver, setTicketParaResolver] = useState<string | null>(null);
  const [ticketParaExtension, setTicketParaExtension] = useState<string | null>(null);
  const [ticketParaChat, setTicketParaChat] = useState<string | null>(null);
  const [solucionTexto, setSolucionTexto] = useState('');
  const [motivoExtension, setMotivoExtension] = useState('');
  const [minutosExtension, setMinutosExtension] = useState(60);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const sesion = authService.obtenerSesion();
    if (!sesion || (sesion.rol !== 'tecnico' && sesion.rol !== 'admin')) {
      router.push('/login');
      return;
    }
    setUsuario(sesion);
    cargarBandeja();
  }, [router]);

  const cargarBandeja = async () => {
    try {
      setCargando(true);
      const data = await ticketService.obtenerTickets();
      setTickets(data);
    } catch (err: any) {
      setError(err.message || 'Error al obtener la bandeja de tickets.');
    } finally {
      setCargando(false);
    }
  };

  const handleAceptar = async (id: string) => {
    try {
      setGuardando(true);
      await ticketService.aceptarTicket(id);
      cargarBandeja();
    } catch (err: any) {
      alert(err.message || 'Error al aceptar ticket');
    } finally {
      setGuardando(false);
    }
  };

  const handleRechazar = async (motivo: string) => {
    if (!ticketParaRechazo) return;
    await ticketService.rechazarTicket(ticketParaRechazo, motivo);
    setTickets((prev) => prev.filter((t) => t.id !== ticketParaRechazo));
    setTicketParaRechazo(null);
  };

  const handleResolver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketParaResolver || solucionTexto.trim().length < 5) {
      alert('Especifique la solución aplicada (mínimo 5 caracteres).');
      return;
    }
    try {
      setGuardando(true);
      await ticketService.resolverTicket(ticketParaResolver, solucionTexto);
      setTicketParaResolver(null);
      setSolucionTexto('');
      cargarBandeja();
    } catch (err: any) {
      alert(err.message || 'Error al resolver ticket');
    } finally {
      setGuardando(false);
    }
  };

  const handleSolicitarExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketParaExtension || motivoExtension.trim().length < 5) {
      alert('Detalle el motivo de la solicitud.');
      return;
    }
    try {
      setGuardando(true);
      await ticketService.solicitarExtensionSLA(ticketParaExtension, motivoExtension, minutosExtension);
      alert('Solicitud de extensión enviada al administrador. Recibirás una notificación cuando sea evaluada.');
      setTicketParaExtension(null);
      setMotivoExtension('');
    } catch (err: any) {
      alert(err.message || 'Error al solicitar extensión');
    } finally {
      setGuardando(false);
    }
  };

  const ticketsFiltrados = tickets.filter((t) => {
    const matchBusqueda =
      t.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.id.toLowerCase().includes(busqueda.toLowerCase()) ||
      (t.empleado_nombre || '').toLowerCase().includes(busqueda.toLowerCase());
    const matchPrioridad = filtroPrioridad === 'todas' || t.prioridad === filtroPrioridad;
    const matchEstado = filtroEstado === 'todos' || t.estado === filtroEstado;
    return matchBusqueda && matchPrioridad && matchEstado;
  });

  const total = tickets.length;
  const enProceso = tickets.filter((t) => t.estado === 'en_proceso').length;
  const pendientes = tickets.filter((t) => t.estado === 'pendiente').length;
  const resueltos = tickets.filter((t) => t.estado === 'resuelto' || t.estado === 'cerrado').length;

  return (
    <DashboardLayout rol="tecnico" nombre={usuario?.nombre} codigo={usuario?.codigo} titulo="Bandeja de Soporte Técnico con SLA">
      {/* Tarjetas de Resumen (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total en Bandeja</span>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{total}</p>
          <span className="text-[11px] text-slate-500">Asignados y en cola</span>
        </div>
        <div className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1D70B8]">En Atención Activa</span>
          <p className="text-3xl font-black text-[#1D70B8] mt-1">{enProceso}</p>
          <span className="text-[11px] text-blue-700 dark:text-blue-300">Temporizador SLA corriendo</span>
        </div>
        <div className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Sin Iniciar</span>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendientes}</p>
          <span className="text-[11px] text-amber-700 dark:text-amber-300">Esperando Aceptación</span>
        </div>
        <div className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Completados</span>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{resueltos}</p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300">Casos resueltos</span>
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
            placeholder="Buscar por solicitante, descripción o ID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-[#1D70B8] focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={filtroPrioridad}
            onChange={(e) => setFiltroPrioridad(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="todas">Todas las Prioridades</option>
            <option value="critica">Crítica (30m)</option>
            <option value="alta">Alta (1h)</option>
            <option value="media">Media (4h)</option>
            <option value="baja">Baja (24h)</option>
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="todos">Todos los Estados</option>
            <option value="pendiente">Pendientes de Aceptar</option>
            <option value="en_proceso">En Proceso</option>
            <option value="resuelto">Resueltos</option>
          </select>

          <button
            onClick={cargarBandeja}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            ↻ Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-800">
          {error}
        </div>
      )}

      {/* Grid de Tickets */}
      {cargando ? (
        <div className="text-center py-24 text-slate-400 text-xs font-semibold">Cargando bandeja de soporte...</div>
      ) : ticketsFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-md mx-auto">
          <span className="text-4xl block mb-2">🎉</span>
          <h3 className="font-bold text-slate-800 dark:text-white text-sm">Bandeja al día</h3>
          <p className="text-xs text-slate-400 mt-1">No hay incidencias que coincidan con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ticketsFiltrados.map((t) => (
            <div
              key={t.id}
              className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-slate-400">#{t.id.slice(0, 8)}</span>
                  <SlaBadge
                    createdAt={t.created_at}
                    slaStartAt={t.sla_start_at}
                    prioridad={t.prioridad}
                    estado={t.estado}
                  />
                </div>

                <div className="flex items-center gap-2 mb-3">
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

                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mb-4 line-clamp-3">
                  {t.descripcion}
                </p>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl mb-4 space-y-1">
                  <p><strong>Solicitante:</strong> {t.empleado_nombre || t.codigo_empleado}</p>
                  {t.empleado_departamento && <p><strong>Depto:</strong> {t.empleado_departamento}</p>}
                </div>
              </div>

              {/* Acciones del Técnico */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                {/* Chat Directo */}
                <button
                  onClick={() => setTicketParaChat(t.id)}
                  className="w-full py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-[#1D70B8] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>💬</span> Enviar Mensaje al Solicitante
                </button>

                {t.estado === 'pendiente' && (
                  <div className="flex gap-2 w-full mt-1">
                    <button
                      onClick={() => handleAceptar(t.id)}
                      disabled={guardando}
                      className="flex-1 py-2 bg-[#002D62] hover:bg-[#1D70B8] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Aceptar Caso
                    </button>
                    <button
                      onClick={() => setTicketParaRechazo(t.id)}
                      disabled={guardando}
                      className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Rechazar
                    </button>
                  </div>
                )}

                {t.estado === 'en_proceso' && (
                  <div className="w-full space-y-2 mt-1">
                    <button
                      onClick={() => {
                        setTicketParaResolver(t.id);
                        setSolucionTexto('');
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      ✓ Documentar Solución y Resolver
                    </button>
                    <button
                      onClick={() => {
                        setTicketParaExtension(t.id);
                        setMotivoExtension('');
                      }}
                      className="w-full py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold rounded-xl transition cursor-pointer"
                    >
                      ⏱ Solicitar Extensión SLA al Admin
                    </button>
                  </div>
                )}

                {t.estado === 'resuelto' && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block text-center w-full">
                    Resuelto &bull; Esperando feedback del empleado
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Chat con Solicitante */}
      <ChatTicketModal
        isOpen={!!ticketParaChat}
        ticketId={ticketParaChat || ''}
        usuarioCodigo={usuario?.codigo || ''}
        onClose={() => setTicketParaChat(null)}
      />

      {/* Modal de Resolución Técnica */}
      {ticketParaResolver && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Cierre Técnico del Ticket</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Describe los procedimientos técnicos realizados para solucionar la avería.
            </p>

            <form onSubmit={handleResolver}>
              <textarea
                required
                rows={4}
                value={solucionTexto}
                onChange={(e) => setSolucionTexto(e.target.value)}
                placeholder="Ejemplo: Se reemplazó el conector RJ45 y se restableció la configuración IP en el switch de piso..."
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setTicketParaResolver(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Marcar como Resuelto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Solicitar Extensión SLA */}
      {ticketParaExtension && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Solicitar Extensión de Tiempo SLA</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Indica al administrador por qué requieres más tiempo para este caso.
            </p>

            <form onSubmit={handleSolicitarExtension} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Minutos adicionales requeridos:
                </label>
                <select
                  value={minutosExtension}
                  onChange={(e) => setMinutosExtension(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value={30}>+30 minutos</option>
                  <option value={60}>+1 hora (60 min)</option>
                  <option value={120}>+2 horas (120 min)</option>
                  <option value={240}>+4 horas (240 min)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Justificación para el Administrador:
                </label>
                <textarea
                  required
                  rows={3}
                  value={motivoExtension}
                  onChange={(e) => setMotivoExtension(e.target.value)}
                  placeholder="Ejemplo: Se requiere repuesto de memoria RAM que está en almacén central..."
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-[#1D70B8] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTicketParaExtension(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#002D62] hover:bg-[#1D70B8] rounded-xl transition cursor-pointer"
                >
                  {guardando ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rechazo */}
      <ModalRechazo
        isOpen={!!ticketParaRechazo}
        ticketId={ticketParaRechazo || ''}
        onClose={() => setTicketParaRechazo(null)}
        onConfirm={handleRechazar}
      />
    </DashboardLayout>
  );
}
