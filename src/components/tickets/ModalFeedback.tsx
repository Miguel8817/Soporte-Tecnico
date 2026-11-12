'use client';

import React, { useState } from 'react';

interface ModalFeedbackProps {
  isOpen: boolean;
  ticketId: string;
  onClose: () => void;
  onConfirm: (calificacion: number, comentario: string, solucionado: boolean) => Promise<void>;
}

export default function ModalFeedback({ isOpen, ticketId, onClose, onConfirm }: ModalFeedbackProps) {
  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState('');
  const [solucionado, setSolucionado] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    try {
      await onConfirm(calificacion, comentario, solucionado);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al enviar feedback.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Encuesta de Satisfacción</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Evalúa la atención técnica recibida para ayudarnos a mejorar el servicio interno de INABIE.
        </p>

        {error && (
          <div className="p-3 mb-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              ¿Tu incidencia técnica fue solucionada?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="solucionado"
                  checked={solucionado === true}
                  onChange={() => setSolucionado(true)}
                  className="text-[#1D70B8] focus:ring-[#1D70B8]"
                />
                Sí, quedó resuelto
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="solucionado"
                  checked={solucionado === false}
                  onChange={() => setSolucionado(false)}
                  className="text-rose-600 focus:ring-rose-500"
                />
                No (Reabrir caso)
              </label>
            </div>
            {!solucionado && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 font-medium">
                ⚠️ Al indicar que no se solucionó, el ticket volverá a estado pendiente y se notificará para una nueva intervención.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Calificación general:
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((estrella) => (
                <button
                  key={estrella}
                  type="button"
                  onClick={() => setCalificacion(estrella)}
                  className={`text-2xl transition hover:scale-125 ${
                    estrella <= calificacion ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="text-xs font-bold text-slate-500 ml-2">({calificacion} de 5)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Comentarios u observaciones (opcional):
            </label>
            <textarea
              rows={3}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="¿Qué tal fue la atención y el tiempo de respuesta?"
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
              Cerrar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="px-5 py-2 text-xs font-bold text-white bg-[#002D62] hover:bg-[#1D70B8] rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {cargando ? 'Enviando...' : 'Enviar Calificación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
