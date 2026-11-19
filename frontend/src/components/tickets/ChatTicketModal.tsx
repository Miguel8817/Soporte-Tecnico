'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { interaccionService, MensajeChat } from '@/services/interaccionService';

interface ChatTicketModalProps {
  isOpen: boolean;
  ticketId: string;
  usuarioCodigo: string;
  onClose: () => void;
}

export default function ChatTicketModal({ isOpen, ticketId, usuarioCodigo, onClose }: ChatTicketModalProps) {
  const { mostrarToast, confirmarAccion } = useToast();
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Estados para edición
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [textoEdicion, setTextoEdicion] = useState('');

  const cargarMensajes = async () => {
    try {
      const data = await interaccionService.obtenerMensajes(ticketId);
      setMensajes(data);
    } catch (e) {
      // Silencioso
    }
  };

  useEffect(() => {
    if (isOpen) {
      cargarMensajes();
      const interval = setInterval(cargarMensajes, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen, ticketId]);

  if (!isOpen) return null;

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim()) return;
    try {
      setEnviando(true);
      await interaccionService.enviarMensaje(ticketId, texto.trim());
      setTexto('');
      cargarMensajes();
    } catch (err: any) {
      mostrarToast(err.message || 'Error al enviar mensaje', 'error', 'Error en Chat');
    } finally {
      setEnviando(false);
    }
  };

  const handleIniciarEdicion = (m: MensajeChat) => {
    setEditandoId(m.id);
    setTextoEdicion(m.mensaje);
  };

  const handleGuardarEdicion = async (mensajeId: string) => {
    if (!textoEdicion.trim()) return;
    try {
      await interaccionService.editarMensaje(ticketId, mensajeId, textoEdicion.trim());
      setEditandoId(null);
      setTextoEdicion('');
      cargarMensajes();
      mostrarToast('Mensaje actualizado correctamente', 'success', 'Mensaje Editado');
    } catch (err: any) {
      mostrarToast(err.message || 'Error editando mensaje', 'error', 'Error en Chat');
    }
  };

  const handleEliminarMensaje = async (mensajeId: string) => {
    confirmarAccion({
      titulo: 'Eliminar Mensaje',
      mensaje: '¿Deseas eliminar este mensaje del ticket? La acción quedará registrada en el historial de auditoría.',
      tipoBoton: 'danger',
      textoConfirmar: 'Eliminar Mensaje',
      onConfirm: async () => {
        try {
          await interaccionService.eliminarMensaje(ticketId, mensajeId);
          mostrarToast('Mensaje eliminado del chat', 'info', 'Mensaje Eliminado');
          cargarMensajes();
        } catch (err: any) {
          mostrarToast(err.message || 'Error eliminando mensaje', 'error', 'Error en Chat');
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 flex flex-col h-[550px]">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>💬</span> Chat Directo &bull; Ticket #{ticketId.slice(0, 8)}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Canal con auditoría y edición/eliminación de mensajes en tiempo real.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
          {mensajes.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <span className="text-3xl block mb-2">💬</span>
              No hay mensajes aún en este ticket. Envía una consulta o actualización.
            </div>
          ) : (
            mensajes.map((m) => {
              const esMio = m.remitente_codigo === usuarioCodigo;
              const estaEditando = editandoId === m.id;

              return (
                <div key={m.id} className={`flex flex-col ${esMio ? 'items-end' : 'items-start'} group`}>
                  <div className="flex items-center gap-2 mb-0.5 px-1">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {m.remitente_nombre} ({m.rol})
                    </span>
                    {m.editado && (
                      <span className="text-[9px] text-amber-500 font-medium italic">(editado)</span>
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs relative ${
                      esMio
                        ? 'bg-[#002D62] text-white rounded-tr-none'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {estaEditando ? (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={textoEdicion}
                          onChange={(e) => setTextoEdicion(e.target.value)}
                          className="w-full p-2 text-xs bg-white text-slate-900 rounded-lg border border-slate-300 focus:outline-hidden"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditandoId(null)}
                            className="px-2 py-0.5 text-[10px] bg-slate-300 text-slate-700 rounded-md"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGuardarEdicion(m.id)}
                            className="px-2 py-0.5 text-[10px] bg-emerald-600 text-white font-bold rounded-md"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="leading-relaxed whitespace-pre-wrap">{m.mensaje}</p>
                        <div className="flex items-center justify-between gap-3 mt-1 pt-1 border-t border-white/10 dark:border-slate-700">
                          <span className="text-[9px] opacity-70">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {/* Acciones para mensajes propios */}
                          {esMio && (
                            <div className="flex items-center gap-1.5 opacity-90 hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => handleIniciarEdicion(m)}
                                className="text-[10px] hover:underline opacity-80 hover:opacity-100 cursor-pointer"
                                title="Editar mensaje"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEliminarMensaje(m.id)}
                                className="text-[10px] hover:underline text-rose-300 hover:text-rose-100 cursor-pointer"
                                title="Eliminar mensaje"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleEnviar} className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            required
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe un mensaje o aclaración..."
            className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-[#1D70B8] focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={enviando}
            className="px-4 py-2.5 bg-[#002D62] hover:bg-[#1D70B8] text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            {enviando ? '...' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
}
