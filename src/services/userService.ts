import { apiRequest } from './apiClient';
import { User } from '@/types/user';

export const userService = {
  listarUsuarios: async (rol?: string): Promise<User[]> => {
    const url = rol ? `/api/v1/users?rol=${rol}` : '/api/v1/users';
    return apiRequest<User[]>(url);
  },

  crearUsuario: async (datos: Partial<User>): Promise<User> => {
    return apiRequest<User>('/api/v1/users', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  actualizarUsuario: async (id: string, datos: Partial<User>): Promise<User> => {
    return apiRequest<User>(`/api/v1/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },

  desactivarUsuario: async (id: string): Promise<any> => {
    return apiRequest(`/api/v1/users/${id}`, {
      method: 'DELETE',
    });
  },

  obtenerMetricasDashboard: async (): Promise<any> => {
    return apiRequest('/api/v1/dashboard/metricas');
  },

  obtenerExtensionesAdmin: async (): Promise<any[]> => {
    return apiRequest<any[]>('/api/v1/admin/extensiones-pendientes');
  },

  aprobarExtension: async (ticket_id: string): Promise<any> => {
    return apiRequest(`/api/v1/admin/extensiones/${ticket_id}/aprobar`, { method: 'PATCH' });
  },

  rechazarExtension: async (ticket_id: string): Promise<any> => {
    return apiRequest(`/api/v1/admin/extensiones/${ticket_id}/rechazar`, { method: 'PATCH' });
  },

  obtenerConfigTecnico: async (tecnico_id: string): Promise<any> => {
    return apiRequest(`/api/v1/admin/config/tecnicos/${tecnico_id}`);
  },

  actualizarConfigTecnico: async (tecnico_id: string, max_tickets: number): Promise<any> => {
    return apiRequest(`/api/v1/admin/config/tecnicos/${tecnico_id}`, {
      method: 'PUT',
      body: JSON.stringify({ max_tickets }),
    });
  },
};
