import { apiRequest } from './apiClient';
import { Ticket, TicketCreateInput } from '@/types/ticket';

export const ticketService = {
  obtenerTickets: async (params?: { codigo?: string; estado?: string; categoria?: string }): Promise<Ticket[]> => {
    const query = new URLSearchParams();
    if (params?.codigo) query.append('codigo', params.codigo);
    if (params?.estado) query.append('estado', params.estado);
    if (params?.categoria) query.append('categoria', params.categoria);

    const url = `/api/v1/tickets${query.toString() ? `?${query.toString()}` : ''}`;
    return apiRequest<Ticket[]>(url);
  },

  obtenerTicketPorId: async (id: string): Promise<Ticket> => {
    return apiRequest<Ticket>(`/api/v1/tickets/${id}`);
  },

  crearTicket: async (datos: TicketCreateInput): Promise<Ticket> => {
    return apiRequest<Ticket>('/api/v1/tickets', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  aceptarTicket: async (id: string): Promise<any> => {
    return apiRequest(`/api/v1/tickets/${id}/aceptar`, {
      method: 'PATCH',
    });
  },

  rechazarTicket: async (id: string, motivo: string): Promise<any> => {
    return apiRequest(`/api/v1/tickets/${id}/rechazar`, {
      method: 'PATCH',
      body: JSON.stringify({ motivo }),
    });
  },

  resolverTicket: async (id: string, solucion_tecnica: string): Promise<any> => {
    return apiRequest(`/api/v1/tickets/${id}/resolver`, {
      method: 'PATCH',
      body: JSON.stringify({ solucion_tecnica }),
    });
  },

  enviarFeedback: async (id: string, calificacion: number, comentario: string, solucionado: boolean): Promise<any> => {
    return apiRequest(`/api/v1/tickets/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ calificacion, comentario, solucionado }),
    });
  },

  obtenerHistorial: async (id: string): Promise<any[]> => {
    return apiRequest<any[]>(`/api/v1/tickets/${id}/historial`);
  },

  solicitarExtensionSLA: async (id: string, motivo: string, minutos_adicionales: number): Promise<any> => {
    return apiRequest(`/api/v1/tickets/${id}/solicitar-extension`, {
      method: 'POST',
      body: JSON.stringify({ motivo, minutos_adicionales }),
    });
  },

  reasignarTicket: async (id: string, tecnico_id: string): Promise<any> => {
    return apiRequest(`/api/v1/tickets/${id}/reasignar`, {
      method: 'PATCH',
      body: JSON.stringify({ tecnico_id }),
    });
  },
};
