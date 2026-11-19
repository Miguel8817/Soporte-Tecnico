'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import '@/app/styles/auth/login.css';

export default function LoginUser() {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const datos = await authService.loginConCodigo(codigo);
      authService.guardarSesion(datos);

      const rol = datos.rol || datos.user?.rol;
      if (rol === 'admin') {
        router.push('/usuarios/administrador');
      } else if (rol === 'tecnico') {
        router.push('/usuarios/Tecnico');
      } else {
        router.push('/usuarios/usuario');
      }
    } catch (err: any) {
      setError(err.message || 'Código institucional no válido o servidor no disponible.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-container">
      {/* Elementos decorativos de fondo */}
      <div className="login-glow-1"></div>
      <div className="login-glow-2"></div>

      <div className="login-card">
        {/* Cabecera Institucional */}
        <div className="login-header">
          <div className="login-logo-wrapper">
            <Image
              src="/inabie-logo.png"
              alt="INABIE Logo Oficial"
              width={76}
              height={76}
              className="object-contain"
              priority
            />
          </div>
          <span className="login-badge-gob">
            Gobierno de la República Dominicana
          </span>
          <h1 className="login-title">
            Mesa de Ayuda TI
          </h1>
          <p className="login-subtitle">
            Instituto Nacional de Bienestar Estudiantil (INABIE)
          </p>
        </div>

        {error && (
          <div className="login-error-alert">
            <span className="text-base shrink-0">⚠️</span>
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={manejarEnvio} className="space-y-5">
          <div className="login-form-group">
            <label className="login-label">
              Código Institucional
            </label>
            <div className="login-input-container">
              <input
                type="text"
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="EMP-501 / TEC-101 / ADM-001"
                className="login-input"
                autoComplete="off"
                spellCheck="false"
              />
            </div>
            <p className="login-helper-text">
              Ingresa tu código asignado. El sistema cargará tu nombre, departamento y permisos automáticamente.
            </p>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="login-submit-btn"
          >
            {cargando ? 'Validando Credencial Institucional...' : 'Acceder al Sistema'}
          </button>
        </form>

        <div className="login-footer-text">
          Acceso seguro y auditado bajo políticas de seguridad gubernamentales de TI.
        </div>
      </div>
    </div>
  );
}
