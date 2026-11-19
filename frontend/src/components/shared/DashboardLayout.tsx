'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { authService } from '@/services/authService';
import { interaccionService, Notificacion } from '@/services/interaccionService';
import '@/app/styles/Users/tecnico.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  rol: 'empleado' | 'tecnico' | 'admin';
  nombre?: string;
  codigo?: string;
  titulo?: string;
}

export default function DashboardLayout({
  children,
  rol,
  nombre,
  codigo,
  titulo = 'Sistema de Soporte Técnico'
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Panel de Notificaciones
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const cargarNotificaciones = async () => {
    try {
      const data = await interaccionService.obtenerNotificaciones();
      setNotificaciones(data);
    } catch (e) {
      // Silencioso
    }
  };

  useEffect(() => {
    cargarNotificaciones();
    const interval = setInterval(cargarNotificaciones, 10000);
    return () => clearInterval(interval);
  }, []);

  const noLeidas = notificaciones.filter((n) => !n.leido).length;

  const marcarLeida = async (id: string) => {
    await interaccionService.marcarLeida(id);
    cargarNotificaciones();
  };

  const marcarTodas = async () => {
    await interaccionService.marcarTodasLeidas();
    cargarNotificaciones();
  };

  // NAVEGACIÓN POR ROL:
  // Se quitó "Base de Conocimientos (FAQ)" del panel de Técnico como se solicitó en la imagen.
  const navItems = {
    empleado: [
      { label: 'Mis Tickets', href: '/usuarios/usuario', icon: '🎫' },
      { label: 'Crear Incidencia', href: '/usuarios/usuario/ticket', icon: '➕' },
      { label: 'Base de Conocimientos (FAQ)', href: '/usuarios/faq', icon: '📚' },
    ],
    tecnico: [
      { label: 'Bandeja SLA', href: '/usuarios/Tecnico', icon: '📋' },
    ],
    admin: [
      { label: 'Panel General', href: '/usuarios/administrador', icon: '📊' },
      { label: 'Base de Conocimientos (FAQ)', href: '/usuarios/faq', icon: '📚' },
    ],
  }[rol] || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-200">
      {/* Sidebar fijo institucional */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#002D62] text-white flex flex-col justify-between transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Header con el Logo Oficial de INABIE */}
          <div className="p-6 border-b border-blue-900/50">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white p-1 flex items-center justify-center shadow-md overflow-hidden shrink-0">
                <Image
                  src="/inabie-logo.png"
                  alt="INABIE Logo"
                  width={44}
                  height={44}
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight text-white leading-tight">INABIE</h1>
                <p className="text-[11px] text-blue-200 uppercase tracking-wider font-semibold">Mesa de Ayuda TI</p>
              </div>
            </div>

            {/* Badge de rol del usuario */}
            <div className="mt-4 pt-3 border-t border-blue-900/40 flex items-center justify-between">
              <div className="truncate pr-2">
                <span className="text-xs font-semibold text-white block truncate">{nombre || 'Usuario'}</span>
                <span className="text-[11px] font-mono text-blue-200 block">{codigo}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                rol === 'admin' ? 'bg-purple-500/20 text-purple-200 border border-purple-400/30' :
                rol === 'tecnico' ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30' :
                'bg-blue-400/20 text-blue-200 border border-blue-300/30'
              }`}>
                {rol}
              </span>
            </div>
          </div>

          {/* Menú de Navegación */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${
                    active
                      ? 'bg-[#1D70B8] text-white shadow-sm'
                      : 'text-blue-100 hover:bg-blue-900/40 hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer del Sidebar */}
        <div className="p-4 border-t border-blue-900/50 space-y-3">
          <button
            onClick={() => authService.cerrarSesion()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition cursor-pointer"
          >
            <span>🚪</span> Cerrar Sesión
          </button>
          <div className="text-center text-[10px] text-blue-300/70 font-mono">
            INABIE Soporte &bull; Actualización v1.1
          </div>
        </div>
      </aside>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Contenido Principal con Navbar Superior */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-[#1E293B] border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-colors">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 md:hidden hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Abrir Menú"
            >
              ☰
            </button>
            <h2 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">
              {titulo}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Campana de Notificaciones */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:scale-105 transition shadow-xs cursor-pointer"
                title="Notificaciones"
              >
                <span>🔔</span>
                {noLeidas > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-600 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center animate-bounce shadow-sm">
                    {noLeidas}
                  </span>
                )}
              </button>

              {/* Dropdown de Notificaciones */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 p-4 animate-in fade-in zoom-in-95">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Centro de Notificaciones</h4>
                    {noLeidas > 0 && (
                      <button
                        onClick={marcarTodas}
                        className="text-[11px] font-semibold text-[#1D70B8] hover:underline"
                      >
                        Marcar todas leídas
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {notificaciones.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">No tienes notificaciones por el momento.</p>
                    ) : (
                      notificaciones.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => marcarLeida(n.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                            !n.leido
                              ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900'
                              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-75'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="font-bold text-slate-800 dark:text-slate-100">{n.titulo}</span>
                            {!n.leido && <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1"></span>}
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">{n.mensaje}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Toggle Dark/Light Mode */}
            <button
              onClick={toggleTheme}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-amber-400 font-semibold text-xs hover:scale-105 transition shadow-xs flex items-center gap-2 cursor-pointer"
              title="Cambiar tema claro / oscuro"
            >
              <span>{isDark ? '☀️' : '🌙'}</span>
              <span className="hidden sm:inline">{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
