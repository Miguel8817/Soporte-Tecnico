'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { authService } from '@/services/authService';
import { interaccionService, FaqItem } from '@/services/interaccionService';

export default function FaqPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [cargando, setCargando] = useState(true);
  const [abiertoId, setAbiertoId] = useState<string | null>(null);

  useEffect(() => {
    const sesion = authService.obtenerSesion();
    if (!sesion) {
      router.push('/login');
      return;
    }
    setUsuario(sesion);
    cargarFaqs();
  }, [router]);

  const cargarFaqs = async () => {
    try {
      setCargando(true);
      const data = await interaccionService.obtenerFaqs();
      setFaqs(data);
    } finally {
      setCargando(false);
    }
  };

  const faqsFiltrados = faqs.filter((f) => {
    const b = busqueda.toLowerCase();
    const matchBusqueda =
      f.titulo.toLowerCase().includes(b) ||
      f.resumen.toLowerCase().includes(b) ||
      f.contenido.toLowerCase().includes(b);
    const matchCat = categoria === 'todas' || f.categoria === categoria;
    return matchBusqueda && matchCat;
  });

  return (
    <DashboardLayout
      rol={usuario?.rol || 'empleado'}
      nombre={usuario?.nombre}
      codigo={usuario?.codigo}
      titulo="Base de Conocimientos & Preguntas Frecuentes"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Banner Institucional Informativo */}
        <div className="bg-gradient-to-r from-[#002D62] to-[#1D70B8] rounded-2xl p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-white/20 tracking-wider mb-3 inline-block">
              Autogestión Rápida &bull; INABIE TI
            </span>
            <h1 className="text-2xl font-black tracking-tight mb-2">
              Resuelve problemas comunes antes de abrir un ticket
            </h1>
            <p className="text-xs text-blue-100 leading-relaxed">
              Consulta nuestras guías oficiales para configurar impresoras departamentales, correo electrónico corporativo, certificados Wi-Fi y periféricos.
            </p>
          </div>
          <div className="absolute right-6 -bottom-6 text-9xl opacity-10 select-none">
            📚
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar guía: impresora, outlook, wifi..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-[#1D70B8] focus:outline-hidden"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['todas', 'impresoras', 'software', 'redes', 'hardware'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoria(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
                  categoria === cat
                    ? 'bg-[#002D62] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Listado de Artículos FAQ Acordeón */}
        {cargando ? (
          <div className="text-center py-20 text-slate-400 text-xs font-semibold">Cargando guías y tutoriales...</div>
        ) : faqsFiltrados.length === 0 ? (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <span className="text-4xl block mb-2">🔍</span>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">No encontramos una guía exacta</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">Si tu problema no aparece aquí, reporta una nueva incidencia técnica.</p>
            <button
              onClick={() => router.push('/usuarios/usuario/ticket')}
              className="px-4 py-2 bg-[#002D62] text-white text-xs font-bold rounded-xl"
            >
              Crear Ticket de Soporte
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {faqsFiltrados.map((faq) => {
              const estaAbierto = abiertoId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition"
                >
                  <button
                    onClick={() => setAbiertoId(estaAbierto ? null : faq.id)}
                    className="w-full p-5 text-left flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-blue-100 dark:bg-blue-950/50 text-[#1D70B8]">
                          {faq.categoria}
                        </span>
                        <span className="text-[10px] text-slate-400">Visto {faq.visitas} veces</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{faq.titulo}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{faq.resumen}</p>
                    </div>
                    <span className="text-lg font-bold text-slate-400 transform transition-transform duration-200 ml-4">
                      {estaAbierto ? '▲' : '▼'}
                    </span>
                  </button>

                  {estaAbierto && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                      {faq.contenido}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

