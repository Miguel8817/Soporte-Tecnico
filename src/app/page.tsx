'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const sesion = authService.obtenerSesion();
    if (!sesion) {
      router.push('/login');
      return;
    }
    if (sesion.rol === 'admin') {
      router.push('/usuarios/administrador');
    } else if (sesion.rol === 'tecnico') {
      router.push('/usuarios/Tecnico');
    } else {
      router.push('/usuarios/usuario');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">
      Cargando Sistema de Soporte INABIE...
    </div>
  );
}
