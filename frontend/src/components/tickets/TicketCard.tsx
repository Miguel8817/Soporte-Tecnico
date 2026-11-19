'use client';

import React, { useState } from 'react';
import type { Ticket } from '@/types/ticket';
import SlaBadge from '@/components/shared/SlaBadge';

interface TicketCardProps {
  ticket: Ticket;
  rol: string;
  onAceptar?: (id: string) => void;
  onRechazar?: (id: string) => void;
  onResolver?: (id: string) => void;
  onFeedback?: (id: string) => void;
}

const PRIORIDAD_BADGE: Record<string, string> = {
  critica: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  alta: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  media: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  baja: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
};

const ESTADO_BADGE: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  en_proceso: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  resuelto: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  cerrado: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
};

const ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
};

const PRIORIDAD_LABELS: Record<string, string> = {
  critica: '🔴 Crítica',
  alta: '🟠 Alta',
  media: '🔵 Media',
  baja: '⚪ Baja',
};

export default function TicketCard({
  ticket,
  rol,
  onAceptar,
  onRechazar,
  onResolver,
  onFeedback,
}: TicketCardProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string, fn?: (id: string) => void) => {
    if (!fn) return;
    setLoading(action);
    try {
      await fn(ticket.id);
    } finally {
      setLoading(null);
    }
  };

  const slaStartAt = (ticket as any).sla_start_at ?? null;

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
          #{ticket.id.slice(0, 8).toUpperCase()}
        </span>

        {/* Categoría */}
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800 capitalize">
          {ticket.categoria}
        </span>

        {/* Prioridad */}
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${PRIORIDAD_BADGE[ticket.prioridad] || ''}`}
        >
          {PRIORIDAD_LABELS[ticket.prioridad] || ticket.prioridad}
        </span>

        {/* Estado */}
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ml-auto ${ESTADO_BADGE[ticket.estado] || ''}`}
        >
          {ESTADO_LABELS[ticket.estado] || ticket.estado}
        </span>
      </div>

      {/* Body */}
      <div>
        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
          {ticket.descripcion}
        </p>

        {/* Solicitante (solo tecnico/admin) */}
        {(rol === 'tecnico' || rol === 'admin') && ticket.empleado_nombre && (
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>
              👤 <span className="font-medium text-slate-700 dark:text-slate-300">{ticket.empleado_nombre}</span>
            </span>
            {ticket.empleado_departamento && (
              <span>
                🏢 <span className="font-medium text-slate-700 dark:text-slate-300">{ticket.empleado_departamento}</span>
              </span>
            )}
            {ticket.codigo_empleado && (
              <span className="font-mono">
                ID: {ticket.codigo_empleado}
              </span>
            )}
          </div>
        )}

        {ticket.motivo_rechazo && (
          <div className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-700 dark:text-red-400">
              <span className="font-semibold">Motivo rechazo:</span> {ticket.motivo_rechazo}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
        <SlaBadge
          slaStartAt={slaStartAt}
          prioridad={ticket.prioridad}
          estado={ticket.estado}
        />

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {/* Técnico: Aceptar / Rechazar si pendiente */}
          {rol === 'tecnico' && ticket.estado === 'pendiente' && (
            <>
              {onAceptar && (
                <button
                  onClick={() => handleAction('aceptar', onAceptar)}
                  disabled={loading !== null}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#002D62] hover:bg-[#1D70B8] rounded-lg transition disabled:opacity-50"
                >
                  {loading === 'aceptar' ? '...' : '✔ Aceptar'}
                </button>
              )}
              {onRechazar && (
                <button
                  onClick={() => handleAction('rechazar', onRechazar)}
                  disabled={loading !== null}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
                >
                  {loading === 'rechazar' ? '...' : '✗ Rechazar'}
                </button>
              )}
            </>
          )}

          {/* Técnico: Resolver si en_proceso */}
          {rol === 'tecnico' && ticket.estado === 'en_proceso' && onResolver && (
            <button
              onClick={() => handleAction('resolver', onResolver)}
              disabled={loading !== null}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-50"
            >
              {loading === 'resolver' ? '...' : '✓ Resolver'}
            </button>
          )}

          {/* Empleado: Feedback si resuelto */}
          {rol === 'empleado' && ticket.estado === 'resuelto' && onFeedback && !ticket.calificacion && (
            <button
              onClick={() => handleAction('feedback', onFeedback)}
              disabled={loading !== null}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1D70B8] hover:bg-[#002D62] rounded-lg transition disabled:opacity-50"
            >
              ⭐ Calificar
            </button>
          )}

          {/* Calificación ya dada */}
          {ticket.calificacion && (
            <span className="text-xs text-amber-500 font-medium">
              {'★'.repeat(ticket.calificacion)}{'☆'.repeat(5 - ticket.calificacion)} ({ticket.calificacion}/5)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
