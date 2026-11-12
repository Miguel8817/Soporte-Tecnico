import { apiRequest } from './apiClient';
import { AuthResponse, User } from '@/types/user';

export const authService = {
  loginConCodigo: async (codigo: string): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/api/v1/auth/login-codigo', {
      method: 'POST',
      body: JSON.stringify({ codigo: codigo.trim() }),
    });
  },

  guardarSesion: (data: AuthResponse) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access', data.access_token || data.access || '');
    localStorage.setItem('user_role', data.rol || data.user?.rol);
    localStorage.setItem('codigo_empleado', data.user?.codigo_empleado || '');
    localStorage.setItem('user_name', data.user?.nombre || '');
    localStorage.setItem('user_departamento', data.user?.departamento || '');
    localStorage.setItem('user_id', data.user?.id || '');
  },

  cerrarSesion: () => {
    if (typeof window === 'undefined') return;
    localStorage.clear();
    window.location.href = '/login';
  },

  obtenerSesion: () => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('access');
    const rol = localStorage.getItem('user_role');
    const codigo = localStorage.getItem('codigo_empleado');
    const nombre = localStorage.getItem('user_name');
    const departamento = localStorage.getItem('user_departamento');
    const id = localStorage.getItem('user_id');

    if (!token || !rol) return null;
    return { token, rol, codigo, nombre, departamento, id };
  }
};

