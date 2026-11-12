export default interface Ticket {
    id: string;
    categoria: string;
    prioridad: 'baja' | 'media' | 'alta' | 'critica';
    estado: 'pendiente' | 'en_proceso' | 'resuelto' | 'cerrado';
    descripcion: string;
    created_at: string;
}