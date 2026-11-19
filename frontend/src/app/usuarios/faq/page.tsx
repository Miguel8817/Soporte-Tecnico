'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { authService } from '@/services/authService';
import { interaccionService, FaqItem } from '@/services/interaccionService';
import '@/app/styles/Users/faq.css';

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
        {/* Banner Institucional con Tipografía y Espaciado Mejorado */}
        <div className="faq-hero-card">
          <div className="relative z-10 max-w-2xl">
            <span className="faq-hero-badge">
              Centro de Ayuda y Autogestión TI &bull; INABIE
            </span>
            <h1 className="faq-hero-title">
              Base de Conocimientos Oficial
            </h1>
            <p className="faq-hero-desc">
              Consulta soluciones técnicas certificadas paso a paso para resolver incidencias de impresoras, correo institucional, redes Wi-Fi, VPN y periféricos sin demoras.
            </p>
          </div>
          <div className="absolute right-6 -bottom-6 text-9xl opacity-10 select-none pointer-events-none">
            📚
          </div>
        </div>

        {/* Filtros y Buscador Dinámico */}
        <div className="faq-filter-container">
          <div className="faq-search-wrapper">
            <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por tema: impresora, contraseña, outlook, wifi, vpn..."
              className="faq-search-input"
            />
          </div>

          <div className="faq-categories-tabs">
            {['todas', 'impresoras', 'software', 'redes', 'hardware'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoria(cat)}
                className={`faq-cat-btn ${categoria === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Listado de Guías en Acordeón */}
        {cargando ? (
          <div className="text-center py-20 text-slate-400 text-xs font-bold tracking-wider uppercase">
            Cargando guías y tutoriales oficiales...
          </div>
        ) : faqsFiltrados.length === 0 ? (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
            <span className="text-4xl block mb-2">🔍</span>
            <h3 className="font-bold text-slate-800 dark:text-white text-base">No encontramos una guía exacta</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Si tu problema persiste o requiere asistencia especializada, reporta una nueva incidencia técnica.
            </p>
            <button
              onClick={() => router.push('/usuarios/usuario/ticket')}
              className="px-5 py-2.5 bg-[#002D62] hover:bg-[#1D70B8] text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              Crear Ticket de Soporte
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {faqsFiltrados.map((faq) => {
              const estaAbierto = abiertoId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="faq-accordion-item"
                >
                  <button
                    onClick={() => setAbiertoId(estaAbierto ? null : faq.id)}
                    className="faq-accordion-trigger"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="faq-badge-category">
                          {faq.categoria}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">&bull; {faq.visitas} consultas</span>
                      </div>
                      <h3 className="faq-item-title">{faq.titulo}</h3>
                      <p className="faq-item-summary">{faq.resumen}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-400 ml-4 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 shrink-0">
                      {estaAbierto ? '▲' : '▼'}
                    </span>
                  </button>

                  {estaAbierto && (
                    <div className="faq-accordion-content">
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
