'use client';

import React from 'react';

interface NavbarProps {
  titulo: string;
  nombre?: string;
  onToggleSidebar: () => void;
  isDarkMode: boolean;
  onToggleDark: () => void;
}

export default function Navbar({
  titulo,
  nombre,
  onToggleSidebar,
  isDarkMode,
  onToggleDark,
}: NavbarProps) {
  return (
    <header className="h-[60px] flex items-center justify-between px-4 md:px-6 bg-white dark:bg-[#1E293B] shadow-sm border-b border-slate-200 dark:border-slate-700 z-20">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          onClick={onToggleSidebar}
          aria-label="Abrir menú"
        >
          <span className="text-xl">☰</span>
        </button>
        <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          {titulo}
        </h1>
      </div>

      {/* Right: name + dark toggle */}
      <div className="flex items-center gap-3">
        {nombre && (
          <span className="hidden sm:block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {nombre}
          </span>
        )}
        <button
          onClick={onToggleDark}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition text-lg"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
