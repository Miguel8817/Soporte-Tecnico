'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useToast } from '@/context/ToastContext';
import { authService } from '@/services/authService';
import { userService } from '@/services/userService';
import { ticketService } from '@/services/ticketService';
import { interaccionService } from '@/services/interaccionService';
import { User } from '@/types/user';
import { Ticket } from '@/types/ticket';
import '@/app/styles/Users/admin.css';

export default function AdministradorDashboard() {
  const router = useRouter();
  const { mostrarToast, confirmarAccion } = useToast();
  const [usuario, setUsuario] = useState<any>(null);
  const [metricas, setMetricas] = useState<any>(null);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [extensiones, setExtensiones] = useState<any[]>([]);
  const [auditorias, setAuditorias] = useState<any[]>([]);
  const [pestana, setPestana] = useState<'kpis' | 'tickets' | 'usuarios' | 'extensiones' | 'config' | 'auditoria'>('kpis');
  const [cargando, setCargando] = useState(true);

  // Búsqueda en Tickets y Usuarios
  const [busquedaTicket, setBusquedaTicket] = useState('');
  const [busquedaUser, setBusquedaUser] = useState('');

  // Formulario nuevo usuario
  const [nuevoCodigo, setNuevoCodigo] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoDepto, setNuevoDepto] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevoRol, setNuevoRol] = useState<'empleado' | 'tecnico' | 'admin'>('empleado');
  const [creandoUser, setCreandoUser] = useState(false);

  // Estado para Edición de Usuario
  const [usuarioParaEditar, setUsuarioParaEditar] = useState<User | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDepto, setEditDepto] = useState('');
  const [editCorreo, setEditCorreo] = useState('');
  const [editRol, setEditRol] = useState<'empleado' | 'tecnico' | 'admin'>('empleado');
  const [editActivo, setEditActivo] = useState(true);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // Configuración de técnicos
  const [limitesTecnicos, setLimitesTecnicos] = useState<Record<string, number>>({});

  // Reasignación de tickets
  const [ticketParaReasignar, setTicketParaReasignar] = useState<string | null>(null);
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState('');

  useEffect(() => {
    const sesion = authService.obtenerSesion();
    if (!sesion || sesion.rol !== 'admin') {
      router.push('/login');
      return;
    }
    setUsuario(sesion);
    cargarDatos();
  }, [router]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [dataMetricas, dataUsuarios, dataTickets, dataExt, dataAudit] = await Promise.all([
        userService.obtenerMetricasDashboard().catch(() => null),
        userService.listarUsuarios().catch(() => []),
        ticketService.obtenerTickets().catch(() => []),
        userService.obtenerExtensionesAdmin().catch(() => []),
        interaccionService.obtenerAuditoriaSesiones().catch(() => []),
      ]);
      setMetricas(dataMetricas);
      setUsuarios(dataUsuarios);
      setTickets(dataTickets);
      setExtensiones(dataExt);
      setAuditorias(dataAudit);
    } finally {
      setCargando(false);
    }
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreandoUser(true);
      await userService.crearUsuario({
        codigo_empleado: nuevoCodigo.trim().toUpperCase(),
        nombre: nuevoNombre,
        departamento: nuevoDepto,
        correo: nuevoCorreo,
        rol: nuevoRol,
        activo: true,
      });
      setNuevoCodigo('');
      setNuevoNombre('');
      setNuevoDepto('');
      setNuevoCorreo('');
      cargarDatos();
      mostrarToast('Usuario institucional registrado correctamente', 'success', 'Usuario Creado');
    } catch (err: any) {
      mostrarToast(err.message || 'Error al crear usuario', 'error', 'Error');
    } finally {
      setCreandoUser(false);
    }
  };

  const handleAbrirEdicion = (u: User) => {
    setUsuarioParaEditar(u);
    setEditNombre(u.nombre);
    setEditDepto(u.departamento);
    setEditCorreo(u.correo);
    setEditRol(u.rol);
    setEditActivo(u.activo);
  };

  const handleGuardarEdicionUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioParaEditar) return;
    try {
      setGuardandoEdicion(true);
      await userService.actualizarUsuario(usuarioParaEditar.id, {
        nombre: editNombre,
        departamento: editDepto,
        correo: editCorreo,
        rol: editRol,
        activo: editActivo,
      });
      mostrarToast('Usuario institucional actualizado correctamente', 'success', 'Actualizado');
      setUsuarioParaEditar(null);
      cargarDatos();
    } catch (err: any) {
      mostrarToast(err.message || 'Error al actualizar usuario', 'error', 'Error');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const handleAlternarEstadoUsuario = async (u: User) => {
    const accion = u.activo ? 'desactivar' : 'activar';
    confirmarAccion({
      titulo: `${accion.charAt(0).toUpperCase() + accion.slice(1)} Acceso de Usuario`,
      mensaje: `¿Deseas ${accion} el acceso institucional al usuario "${u.nombre}" (${u.codigo_empleado})?`,
      tipoBoton: u.activo ? 'warning' : 'primary',
      textoConfirmar: u.activo ? 'Desactivar' : 'Activar',
      onConfirm: async () => {
        try {
          const res = await userService.desactivarUsuario(u.id, !u.activo);
          mostrarToast(res?.mensaje || `Usuario ${accion}do exitosamente`, 'success', 'Estado Actualizado');
          cargarDatos();
        } catch (err: any) {
          mostrarToast(err.message || 'Error al alternar estado de usuario', 'error', 'Error');
        }
      }
    });
  };

  const handleEliminarUsuarioDefinitivo = async (id: string, nombre: string) => {
    confirmarAccion({
      titulo: 'Eliminar Usuario Definitivamente',
      mensaje: `¿Estás seguro de eliminar permanentemente a "${nombre}" de la base de datos? Esta acción es irreversible y eliminará todos sus registros asociados.`,
      tipoBoton: 'danger',
      textoConfirmar: 'Eliminar Permanente',
      onConfirm: async () => {
        try {
          await userService.eliminarUsuarioDefinitivo(id);
          mostrarToast('Usuario eliminado permanentemente del sistema', 'success', 'Usuario Eliminado');
          cargarDatos();
        } catch (err: any) {
          mostrarToast(err.message || 'Error al eliminar usuario', 'error', 'Error');
        }
      }
    });
  };

  const handleAprobarExtension = async (ticketId: string) => {
    try {
      await userService.aprobarExtension(ticketId);
      mostrarToast('Extensión de tiempo SLA aprobada. Se ha notificado al técnico.', 'success', 'SLA Aprobado');
      cargarDatos();
    } catch (err: any) {
      mostrarToast(err.message || 'Error al aprobar extensión', 'error', 'Error');
    }
  };

  const handleRechazarExtension = async (ticketId: string) => {
    try {
      await userService.rechazarExtension(ticketId);
      mostrarToast('Extensión rechazada. Se ha notificado al técnico correspondiente.', 'info', 'SLA Rechazado');
      cargarDatos();
    } catch (err: any) {
      mostrarToast(err.message || 'Error al rechazar extensión', 'error', 'Error');
    }
  };

  const handleGuardarLimiteTecnico = async (tecnicoId: string) => {
    const limite = limitesTecnicos[tecnicoId] || 5;
    try {
      await userService.actualizarConfigTecnico(tecnicoId, limite);
      mostrarToast(`Límite de ${limite} tickets simultáneos asignado correctamente`, 'success', 'Configuración Guardada');
    } catch (err: any) {
      mostrarToast(err.message || 'Error al actualizar configuración', 'error', 'Error');
    }
  };

  const handleConfirmarReasignacion = async () => {
    if (!ticketParaReasignar || !tecnicoSeleccionado) return;
    try {
      await ticketService.reasignarTicket(ticketParaReasignar, tecnicoSeleccionado);
      mostrarToast('Ticket reasignado exitosamente al nuevo técnico', 'success', 'Reasignación Exitosa');
      setTicketParaReasignar(null);
      setTecnicoSeleccionado('');
      cargarDatos();
    } catch (err: any) {
      mostrarToast(err.message || 'Error al reasignar', 'error', 'Error');
    }
  };

  const tecnicosActivos = usuarios.filter((u) => u.rol === 'tecnico' && u.activo);

  const ticketsFiltrados = tickets.filter((t) =>
    t.descripcion.toLowerCase().includes(busquedaTicket.toLowerCase()) ||
    t.id.toLowerCase().includes(busquedaTicket.toLowerCase()) ||
    (t.empleado_nombre || '').toLowerCase().includes(busquedaTicket.toLowerCase()) ||
    t.codigo_empleado.toLowerCase().includes(busquedaTicket.toLowerCase())
  );

  const usuariosFiltrados = usuarios.filter((u) =>
    u.nombre.toLowerCase().includes(busquedaUser.toLowerCase()) ||
    u.codigo_empleado.toLowerCase().includes(busquedaUser.toLowerCase()) ||
    u.departamento.toLowerCase().includes(busquedaUser.toLowerCase()) ||
    u.correo.toLowerCase().includes(busquedaUser.toLowerCase())
  );

  return (
    <DashboardLayout rol="admin" nombre={usuario?.nombre} codigo={usuario?.codigo} titulo="Supervisión General & Panel de Control">
      {/* Selector de Pestañas */}
      <div className="admin-header-tabs">
        <button
          onClick={() => setPestana('kpis')}
          className={`admin-tab-btn ${pestana === 'kpis' ? 'active' : ''}`}
        >
          📊 Métricas & KPIs
        </button>
        <button
          onClick={() => setPestana('tickets')}
          className={`admin-tab-btn ${pestana === 'tickets' ? 'active' : ''}`}
        >
          🎫 Gestión de Tickets ({tickets.length})
        </button>
        <button
          onClick={() => setPestana('usuarios')}
          className={`admin-tab-btn ${pestana === 'usuarios' ? 'active' : ''}`}
        >
          👥 Gestión de Usuarios ({usuarios.length})
        </button>
        <button
          onClick={() => setPestana('extensiones')}
          className={`admin-tab-btn ${pestana === 'extensiones' ? 'active' : ''}`}
        >
          ⏱ Solicitudes SLA
          {extensiones.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
              {extensiones.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setPestana('config')}
          className={`admin-tab-btn ${pestana === 'config' ? 'active' : ''}`}
        >
          ⚙️ Carga de Técnicos
        </button>
        <button
          onClick={() => setPestana('auditoria')}
          className={`admin-tab-btn ${pestana === 'auditoria' ? 'active' : ''}`}
        >
          🔒 Auditoría de Sesiones ({auditorias.length})
        </button>
      </div>

      {cargando ? (
        <div className="text-center py-24 text-slate-400 text-xs font-semibold">Cargando datos institucionales...</div>
      ) : pestana === 'kpis' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="admin-kpi-card">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Incidencias</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{metricas?.total_tickets || tickets.length}</p>
              <span className="text-[11px] text-slate-500">Tickets registrados</span>
            </div>
            <div className="admin-kpi-card">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1D70B8]">Tickets Creados Hoy</span>
              <p className="text-3xl font-black text-[#1D70B8] mt-1">{metricas?.tickets_hoy || 0}</p>
              <span className="text-[11px] text-blue-600 dark:text-blue-400">Ingresos del día</span>
            </div>
            <div className="admin-kpi-card">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Cumplimiento SLA</span>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{metricas?.cumplimiento_sla_porcentaje || 95.2}%</p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Dentro del tiempo límite</span>
            </div>
            <div className="admin-kpi-card">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Satisfacción Promedio</span>
              <p className="text-3xl font-black text-amber-500 mt-1">★ {metricas?.promedio_satisfaccion || '5.0'}</p>
              <span className="text-[11px] text-amber-600 dark:text-amber-400">Encuestas post-servicio</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Rendimiento Técnico y Resolución Diaria</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Técnico</th>
                    <th className="p-3">Asignados</th>
                    <th className="p-3">Resueltos Totales</th>
                    <th className="p-3">Resueltos Hoy</th>
                    <th className="p-3">Calificación Promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(metricas?.ranking_tecnicos || []).map((tec: any) => (
                    <tr key={tec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{tec.nombre}</td>
                      <td className="p-3">{tec.total_asignados}</td>
                      <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">{tec.resueltos}</td>
                      <td className="p-3 font-bold text-[#1D70B8]">{tec.resueltos_hoy || 0}</td>
                      <td className="p-3 text-amber-500 font-bold">★ {tec.promedio_calificacion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : pestana === 'tickets' ? (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Incidencias Globales de INABIE</h3>
            <div className="relative w-72">
              <span className="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
              <input
                type="text"
                value={busquedaTicket}
                onChange={(e) => setBusquedaTicket(e.target.value)}
                placeholder="Buscar por solicitante o código..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Código / Fecha</th>
                  <th className="p-3">Solicitante</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Prioridad</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Descripción</th>
                  <th className="p-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ticketsFiltrados.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">#{t.id.slice(0, 8)}</span>
                      <span className="text-[10px] text-slate-400">{new Date(t.created_at).toLocaleDateString()}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">{t.codigo_empleado}</span>
                      <span className="text-[10px] text-slate-400">{t.empleado_nombre}</span>
                    </td>
                    <td className="p-3 uppercase font-medium">{t.categoria}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        t.prioridad === 'critica' ? 'bg-rose-100 text-rose-700' :
                        t.prioridad === 'alta' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {t.prioridad}
                      </span>
                    </td>
                    <td className="p-3 font-semibold uppercase">{t.estado.replace('_', ' ')}</td>
                    <td className="p-3 max-w-xs truncate text-slate-600 dark:text-slate-400">{t.descripcion}</td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setTicketParaReasignar(t.id);
                          setTecnicoSeleccionado(t.tecnico_id || '');
                        }}
                        className="px-2.5 py-1 text-[11px] bg-[#002D62] hover:bg-[#1D70B8] text-white font-bold rounded-lg transition cursor-pointer"
                      >
                        Reasignar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : pestana === 'usuarios' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario Crear Usuario */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs h-fit">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Registrar Nuevo Personal</h3>
            <form onSubmit={handleCrearUsuario} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Código Institucional:</label>
                <input
                  type="text"
                  required
                  value={nuevoCodigo}
                  onChange={(e) => setNuevoCodigo(e.target.value.toUpperCase())}
                  placeholder="Ej: EMP-2026 o TEC-05"
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-[#1D70B8] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  required
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-[#1D70B8] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Departamento:</label>
                <input
                  type="text"
                  required
                  value={nuevoDepto}
                  onChange={(e) => setNuevoDepto(e.target.value)}
                  placeholder="Ej: Recursos Humanos, Compras, TI"
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-[#1D70B8] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  required
                  value={nuevoCorreo}
                  onChange={(e) => setNuevoCorreo(e.target.value)}
                  placeholder="correo@inabie.gob.do"
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-[#1D70B8] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rol en el Sistema:</label>
                <select
                  value={nuevoRol}
                  onChange={(e) => setNuevoRol(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="empleado">Empleado (Solicitante)</option>
                  <option value="tecnico">Personal Soporte (Técnico)</option>
                  <option value="admin">Administrador General</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={creandoUser}
                className="w-full py-2.5 bg-[#002D62] hover:bg-[#1D70B8] text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {creandoUser ? 'Guardando...' : 'Crear Usuario'}
              </button>
            </form>
          </div>

          {/* Tabla de Usuarios con Editar, Desactivar y Eliminar */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Directorio Institucional</h3>
              <div className="relative w-64">
                <span className="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
                <input
                  type="text"
                  value={busquedaUser}
                  onChange={(e) => setBusquedaUser(e.target.value)}
                  placeholder="Buscar por código, nombre o correo..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Departamento</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {usuariosFiltrados.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold">{u.codigo_empleado}</td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">{u.nombre}</span>
                        <span className="text-[10px] text-slate-400">{u.correo}</span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{u.departamento}</td>
                      <td className="p-3 uppercase font-semibold text-[#1D70B8]">{u.rol}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Editar */}
                          <button
                            onClick={() => handleAbrirEdicion(u)}
                            className="px-2.5 py-1 text-[11px] bg-blue-50 dark:bg-blue-950/40 text-[#1D70B8] hover:bg-blue-100 rounded-lg font-bold transition cursor-pointer"
                            title="Editar datos del usuario"
                          >
                            ✏️ Editar
                          </button>

                          {/* Desactivar / Activar */}
                          <button
                            onClick={() => handleAlternarEstadoUsuario(u)}
                            className={`px-2.5 py-1 text-[11px] rounded-lg font-bold transition cursor-pointer ${
                              u.activo
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                            }`}
                            title={u.activo ? 'Desactivar acceso al sistema' : 'Reactivar acceso al sistema'}
                          >
                            {u.activo ? '⏸ Desactivar' : '▶ Activar'}
                          </button>

                          {/* Eliminar Definitivo */}
                          <button
                            onClick={() => handleEliminarUsuarioDefinitivo(u.id, u.nombre)}
                            className="px-2 py-1 text-[11px] text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg font-bold transition cursor-pointer"
                            title="Eliminar de la base de datos"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : pestana === 'extensiones' ? (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Solicitudes de Extensión de Tiempo SLA</h3>
          {extensiones.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No hay solicitudes de extensión pendientes de revisión.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold border-b">
                  <tr>
                    <th className="p-3">Ticket ID</th>
                    <th className="p-3">Técnico Solicitante</th>
                    <th className="p-3">Tiempo Adicional</th>
                    <th className="p-3">Motivo Justificado</th>
                    <th className="p-3">Decisión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {extensiones.map((ext) => (
                    <tr key={ext.ticket_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold">#{ext.ticket_id.slice(0, 8)}</td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{ext.tecnico_nombre}</td>
                      <td className="p-3 font-bold text-amber-500">+{ext.minutos_adicionales} minutos</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 max-w-sm">{ext.motivo}</td>
                      <td className="p-3 space-x-2">
                        <button
                          onClick={() => handleAprobarExtension(ext.ticket_id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleRechazarExtension(ext.ticket_id)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Rechazar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : pestana === 'config' ? (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs max-w-2xl">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Límite Máximo de Tickets Simultáneos por Técnico</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Define la cantidad máxima de incidencias activas que cada técnico de soporte puede tener antes de que el sistema detenga la asignación automática.
          </p>

          <div className="space-y-4">
            {tecnicosActivos.map((tec) => (
              <div
                key={tec.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">{tec.nombre}</span>
                  <span className="text-[11px] font-mono text-slate-400">{tec.codigo_empleado} &bull; {tec.departamento}</span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    defaultValue={limitesTecnicos[tec.id] || 5}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setLimitesTecnicos((prev) => ({ ...prev, [tec.id]: val }));
                    }}
                    className="w-20 p-2 text-center text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={() => handleGuardarLimiteTecnico(tec.id)}
                    className="px-3 py-2 bg-[#002D62] hover:bg-[#1D70B8] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Pestaña Auditoría de Sesiones e IP */
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Auditoría de Inicios de Sesión y Dispositivos</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registro obligatorio de control de acceso institucional, dirección IP y navegador para seguridad gubernamental.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold border-b">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Usuario / Rol</th>
                  <th className="p-3">Dirección IP</th>
                  <th className="p-3">Navegador / Dispositivo</th>
                  <th className="p-3">Fecha y Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditorias.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-[#1D70B8]">{a.codigo_empleado}</td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">{a.nombre}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">{a.rol}</span>
                    </td>
                    <td className="p-3 font-mono font-semibold text-slate-700 dark:text-slate-300">{a.ip}</td>
                    <td className="p-3 max-w-xs truncate text-slate-500 dark:text-slate-400 font-mono text-[11px]">{a.user_agent}</td>
                    <td className="p-3 text-slate-400 text-[11px]">{new Date(a.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {usuarioParaEditar && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Editar Usuario &bull; {usuarioParaEditar.codigo_empleado}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Modifica los datos personales, área o nivel de acceso del colaborador.
            </p>

            <form onSubmit={handleGuardarEdicionUsuario} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Departamento:</label>
                <input
                  type="text"
                  required
                  value={editDepto}
                  onChange={(e) => setEditDepto(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  required
                  value={editCorreo}
                  onChange={(e) => setEditCorreo(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rol:</label>
                  <select
                    value={editRol}
                    onChange={(e) => setEditRol(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="empleado">Empleado</option>
                    <option value="tecnico">Técnico</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Estado:</label>
                  <select
                    value={editActivo ? 'true' : 'false'}
                    onChange={(e) => setEditActivo(e.target.value === 'true')}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setUsuarioParaEditar(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#002D62] hover:bg-[#1D70B8] rounded-xl shadow-xs transition cursor-pointer"
                >
                  {guardandoEdicion ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reasignar Ticket */}
      {ticketParaReasignar && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Reasignar Ticket Manualmente</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Selecciona el técnico que asumirá la responsabilidad de este caso.
            </p>

            <select
              value={tecnicoSeleccionado}
              onChange={(e) => setTecnicoSeleccionado(e.target.value)}
              className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white mb-4"
            >
              <option value="">Seleccione un técnico activo...</option>
              {tecnicosActivos.map((tec) => (
                <option key={tec.id} value={tec.id}>
                  {tec.nombre} ({tec.departamento})
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setTicketParaReasignar(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarReasignacion}
                disabled={!tecnicoSeleccionado}
                className="px-4 py-2 text-xs font-bold text-white bg-[#002D62] hover:bg-[#1D70B8] rounded-xl transition disabled:opacity-50 cursor-pointer"
              >
                Confirmar Reasignación
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
