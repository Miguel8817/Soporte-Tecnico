'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ToastTipo = 'success' | 'error' | 'warning' | 'info';

export interface ToastMensaje {
  id: string;
  tipo: ToastTipo;
  titulo?: string;
  mensaje: string;
}

export interface ConfirmDialogState {
  isOpen: boolean;
  titulo: string;
  mensaje: string;
  tipoBoton?: 'danger' | 'primary' | 'warning';
  textoConfirmar?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ToastContextProps {
  mostrarToast: (mensaje: string, tipo?: ToastTipo, titulo?: string) => void;
  confirmarAccion: (opciones: {
    titulo: string;
    mensaje: string;
    tipoBoton?: 'danger' | 'primary' | 'warning';
    textoConfirmar?: string;
    onConfirm: () => void;
  }) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMensaje[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    titulo: '',
    mensaje: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const mostrarToast = (mensaje: string, tipo: ToastTipo = 'info', titulo?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const nuevoToast: ToastMensaje = { id, tipo, mensaje, titulo };

    setToasts((prev) => [...prev, nuevoToast]);

    // Desaparece automáticamente a los 4.5 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const cerrarToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const confirmarAccion = ({
    titulo,
    mensaje,
    tipoBoton = 'primary',
    textoConfirmar = 'Confirmar',
    onConfirm,
  }: {
    titulo: string;
    mensaje: string;
    tipoBoton?: 'danger' | 'primary' | 'warning';
    textoConfirmar?: string;
    onConfirm: () => void;
  }) => {
    setConfirmDialog({
      isOpen: true,
      titulo,
      mensaje,
      tipoBoton,
      textoConfirmar,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <ToastContext.Provider value={{ mostrarToast, confirmarAccion }}>
      {children}

      {/* Contenedor Flotante de Toasts */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md transform transition-all duration-300 animate-in slide-in-from-bottom-5 ${
              t.tipo === 'success'
                ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                : t.tipo === 'error'
                ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                : t.tipo === 'warning'
                ? 'bg-amber-50/95 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                : 'bg-blue-50/95 dark:bg-blue-950/90 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'
            }`}
          >
            <span className="text-lg shrink-0 mt-0.5">
              {t.tipo === 'success' && '✅'}
              {t.tipo === 'error' && '⚠️'}
              {t.tipo === 'warning' && '⚡'}
              {t.tipo === 'info' && 'ℹ️'}
            </span>
            <div className="flex-1 text-xs">
              {t.titulo && <h5 className="font-extrabold mb-0.5 text-sm">{t.titulo}</h5>}
              <p className="leading-relaxed opacity-95">{t.mensaje}</p>
            </div>
            <button
              onClick={() => cerrarToast(t.id)}
              className="text-xs opacity-60 hover:opacity-100 p-1 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Modal de Confirmación Moderno */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95">
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <span>{confirmDialog.tipoBoton === 'danger' ? '⚠️' : '❓'}</span>
              {confirmDialog.titulo}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              {confirmDialog.mensaje}
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={confirmDialog.onCancel}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer ${
                  confirmDialog.tipoBoton === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : confirmDialog.tipoBoton === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-[#002D62] hover:bg-[#1D70B8]'
                }`}
              >
                {confirmDialog.textoConfirmar || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser utilizado dentro de un ToastProvider');
  }
  return context;
}

