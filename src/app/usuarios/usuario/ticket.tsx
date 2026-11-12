'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NuevoTicketPage() {
    const router = useRouter();
    const [categoria, setCategoria] = useState('hardware');
    const [prioridad, setPrioridad] = useState('media');
    const [descripcion, setDescripcion] = useState('');
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    const manejarCreacion = async (e: React.FormEvent) => {
        e.preventDefault();
        setCargando(true);
        setError('');

        const codigoEmpleado = localStorage.getItem('codigo_empleado');
        const token = localStorage.getItem('access');

        try {
            const respuesta = await fetch('http://localhost:8000/api/v1/tickets', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    codigo_empleado: codigoEmpleado,
                    categoria,
                    prioridad,
                    descripcion
                })
            });

            if (!respuesta.ok) throw new Error('No se pudo crear el ticket. Inténtalo de nuevo.');

            // Redirigir de vuelta al panel del empleado si todo sale bien
            router.push('/empleado');
        } catch (err: any) {
            setError(err.message || 'Error de conexión con el servidor.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
            <div className="max-w-xl w-full bg-white shadow rounded-lg p-8">

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-bold text-gray-800">Reportar Incidencia / Crear Ticket</h1>
                    <Link href="/empleado" className="text-sm text-blue-600 hover:underline">
                        ← Volver
                    </Link>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={manejarCreacion} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría del Problema</label>
                        <select
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="hardware">Hardware (Equipos)</option>
                            <option value="software">Software (Programas/Sistemas)</option>
                            <option value="redes">Redes e Internet</option>
                            <option value="impresoras">Impresoras y Periféricos</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                        <select
                            value={prioridad}
                            onChange={(e) => setPrioridad(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="baja">Baja</option>
                            <option value="media">Media</option>
                            <option value="alta">Alta</option>
                            <option value="critica">Crítica (Detiene operaciones)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción detallada del fallo</label>
                        <textarea
                            rows={4}
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Explica detalladamente qué sucede..."
                            required
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={cargando}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
                    >
                        {cargando ? 'Enviando solicitud...' : 'Enviar Ticket'}
                    </button>
                </form>

            </div>
        </div>
    );
}