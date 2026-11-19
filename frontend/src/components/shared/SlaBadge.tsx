'use client';

import React from 'react';
import { TicketPrioridad, TicketEstado } from '@/types/ticket';
import { calcularTiempoRestanteSLA } from '@/lib/slaUtils';

interface SlaBadgeProps {
  createdAt?: string;
  slaStartAt?: string | null;
  prioridad: TicketPrioridad;
  estado: TicketEstado;
}

export default function SlaBadge({ createdAt, slaStartAt, prioridad, estado }: SlaBadgeProps) {
  if (estado === 'resuelto' || estado === 'cerrado') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
        <span>✓</span> SLA Cumplido
      </span>
    );
  }

  // Si el ticket aún está pendiente, el temporizador NO ha comenzado
  if (estado === 'pendiente' || !slaStartAt) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        <span>⏸</span> SLA en Espera (Inicia al Aceptar)
      </span>
    );
  }

  // En proceso con temporizador activo desde slaStartAt
  const info = calcularTiempoRestanteSLA(slaStartAt, prioridad);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${info.color}`}>
      <span>⏱</span> {info.texto}
    </span>
  );
}
