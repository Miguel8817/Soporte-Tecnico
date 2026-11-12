import { TicketPrioridad } from '@/types/ticket';

export const SLA_MINUTOS: Record<TicketPrioridad, number> = {
  baja: 1440,    // 24 horas
  media: 240,    // 4 horas
  alta: 60,      // 1 hora
  critica: 30,   // 30 minutos
};

export function calcularTiempoRestanteSLA(createdAt: string, prioridad: TicketPrioridad) {
  const limiteMinutos = SLA_MINUTOS[prioridad] || 240;
  const fechaCreacion = new Date(createdAt).getTime();
  const fechaLimite = fechaCreacion + limiteMinutos * 60 * 1000;
  const ahora = new Date().getTime();
  const diferenciaMs = fechaLimite - ahora;

  const minutosRestantes = Math.floor(diferenciaMs / (1000 * 60));

  if (minutosRestantes <= 0) {
    return {
      texto: 'SLA Vencido',
      color: 'bg-red-600 text-white',
      vencido: true,
      minutos: minutosRestantes
    };
  }

  const horas = Math.floor(minutosRestantes / 60);
  const mins = minutosRestantes % 60;
  const texto = horas > 0 ? `${horas}h ${mins}m restantes` : `${mins}m restantes`;

  let color = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (minutosRestantes < 30) {
    color = 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse';
  } else if (minutosRestantes < 90) {
    color = 'bg-amber-100 text-amber-800 border-amber-300';
  }

  return {
    texto,
    color,
    vencido: false,
    minutos: minutosRestantes
  };
}

