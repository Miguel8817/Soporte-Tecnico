import { apiRequest } from './apiClient';

export interface Notificacion {
  id: string;
  destinatario_codigo: string;
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'success' | 'warning' | 'danger';
  ticket_id?: string;
  leido: boolean;
  created_at: string;
}

export interface MensajeChat {
  id: string;
  ticket_id: string;
  remitente_id?: string;
  remitente_codigo: string;
  remitente_nombre: string;
  rol: string;
  mensaje: string;
  editado?: boolean;
  created_at: string;
}

export interface FaqItem {
  id: string;
  categoria: string;
  titulo: string;
  resumen: string;
  contenido: string;
  visitas: number;
}

export const interaccionService = {
  // Notificaciones
  obtenerNotificaciones: async (): Promise<Notificacion[]> => {
    return apiRequest<Notificacion[]>('/api/v1/notificaciones');
  },

  marcarLeida: async (id: string): Promise<any> => {
    return apiRequest(`/api/v1/notificaciones/${id}/leer`, { method: 'PATCH' });
  },

  marcarTodasLeidas: async (): Promise<any> => {
    return apiRequest('/api/v1/notificaciones/leer-todas', { method: 'PATCH' });
  },

  // Chat por ticket
  obtenerMensajes: async (ticketId: string): Promise<MensajeChat[]> => {
    return apiRequest<MensajeChat[]>(`/api/v1/tickets/${ticketId}/mensajes`);
  },

  enviarMensaje: async (ticketId: string, mensaje: string): Promise<MensajeChat> => {
    return apiRequest<MensajeChat>(`/api/v1/tickets/${ticketId}/mensajes`, {
      method: 'POST',
      body: JSON.stringify({ mensaje }),
    });
  },

  editarMensaje: async (ticketId: string, mensajeId: string, mensaje: string): Promise<any> => {
    return apiRequest(`/api/v1/tickets/${ticketId}/mensajes/${mensajeId}`, {
      method: 'PATCH',
      body: JSON.stringify({ mensaje }),
    });
  },

  eliminarMensaje: async (ticketId: string, mensajeId: string): Promise<any> => {
    return apiRequest(`/api/v1/tickets/${ticketId}/mensajes/${mensajeId}`, {
      method: 'DELETE',
    });
  },

  // Base de conocimientos FAQ
  obtenerFaqs: async (categoria?: string, busqueda?: string): Promise<FaqItem[]> => {
    const query = new URLSearchParams();
    if (categoria) query.append('categoria', categoria);
    if (busqueda) query.append('busqueda', busqueda);
    const url = `/api/v1/faq${query.toString() ? `?${query.toString()}` : ''}`;
    return apiRequest<FaqItem[]>(url);
  },

  // Auditoría
  obtenerAuditoriaSesiones: async (): Promise<any[]> => {
    return apiRequest<any[]>('/api/v1/admin/auditoria-sesiones');
  }
};
