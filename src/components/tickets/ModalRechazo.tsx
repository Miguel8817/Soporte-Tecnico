'use client';

import React, { useState } from 'react';

interface ModalRechazoProps {
  isOpen: boolean;
  ticketId: string;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<void>;
}

export default function ModalRechazo({ isOpen, ticketId, onClose, onConfirm }: ModalRechazoProps) {
  const [motivo, setMotivo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (motivo.trim().length < 5) {
      setError('Por favor detalle un motivo justificado (mínimo 5 caracteres).');
      return;
    }
    setCargando(true);
    setError('');
    try {
      await onConfirm(motivo);
      setMotivo('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al rechazar el ticket.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 mb-2 text-rose-600 dark:text-rose-400">
          <span className="text-2xl">⚠️</span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Rechazar y Reasignar Ticket</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Al rechazar este ticket, se eliminará inmediatamente de tu bandeja y se reasignará automáticamente a otro técnico disponible. El administrador recibirá una notificación con tu justificación.
        </p>

        {error && (
          <div className="p-3 mb-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Motivo obligatorio de rechazo:
            </label>
            <textarea
              required
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ejemplo: No corresponde al área de redes / requiere herramientas especiales de hardware..."
              className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-[#1D70B8] focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={cargando}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {cargando ? 'Procesando...' : 'Confirmar Rechazo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
