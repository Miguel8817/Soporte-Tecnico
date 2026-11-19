export type TicketCategoria = 'hardware' | 'software' | 'redes' | 'impresoras';
export type TicketPrioridad = 'baja' | 'media' | 'alta' | 'critica';
export type TicketEstado = 'pendiente' | 'en_proceso' | 'resuelto' | 'cerrado';

export interface Ticket {
  id: string;
  codigo_empleado: string;
  tecnico_id?: string | null;
  categoria: TicketCategoria;
  prioridad: TicketPrioridad;
  estado: TicketEstado;
  descripcion: string;
  motivo_rechazo?: string | null;
  solucion_tecnica?: string | null;
  calificacion?: number | null;
  comentario_feedback?: string | null;
  created_at: string;
  updated_at: string;
  tiempo_sla_minutos?: number;
  sla_start_at?: string | null;
  empleado_nombre?: string;
  empleado_departamento?: string;
  tecnico_nombre?: string;
}

export interface TicketCreateInput {
  categoria: TicketCategoria;
  prioridad: TicketPrioridad;
  descripcion: string;
}
