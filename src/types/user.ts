export type UserRole = 'empleado' | 'tecnico' | 'admin';

export interface User {
  id: string;
  codigo_empleado: string;
  nombre: string;
  departamento: string;
  correo: string;
  extension?: string;
  rol: UserRole;
  activo: boolean;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  access?: string;
  token_type: string;
  rol: UserRole;
  user: User;
}

