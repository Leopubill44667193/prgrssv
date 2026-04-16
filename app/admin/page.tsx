'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Admin() {
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTurnos = async () => {
    const { data, error } = await supabase
      .from('turnos')
      .select('id, fecha, hora_inicio, hora_fin, created_at, clientes ( nombre, telefono ), simuladores ( nombre )')
      .order('fecha', { ascending: true })
    if (!error && data) setTurnos(data)
    setLoading(false)
  }

  useEffect(() => { fetchTurnos() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar este turno?')) return
    const { error } = await supabase.from('turnos').delete().eq('id', id)
    if (!error) setTurnos(turnos.filter((t) => t.id !== id))
  }

  if (loading) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-gray-500 tracking-widest uppercase text-sm">Cargando...</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-xs tracking-[0.4em] uppercase text-red-500 mb-1">Panel</p>
          <h1 className="text-3xl font-black uppercase">Admin</h1>
          <p className="text-gray-600 text-sm mt-1">OC.Hobbies.Racing · {turnos.length} turnos</p>
        </div>

        {turnos.length === 0 ? (
          <p className="text-gray-600">No hay turnos todavia.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-4 text-left text-xs uppercase tracking-widest text-gray-500">Simulador</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest text-gray-500">Cliente</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest text-gray-500">Telefono</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest text-gray-500">Fecha</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest text-gray-500">Horario</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest text-gray-500">Reservado</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest text-gray-500"></th>
                </tr>
              </thead>
              <tbody>
                {turnos.map((t) => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="p-4 font-medium">{t.simuladores?.nombre}</td>
                    <td className="p-4">{t.clientes?.nombre}</td>
                    <td className="p-4 text-gray-400">{t.clientes?.telefono}</td>
                    <td className="p-4">{t.fecha}</td>
                    <td className="p-4">{t.hora_inicio?.slice(0,5)} - {t.hora_fin?.slice(0,5)}</td>
                    <td className="p-4 text-gray-600 text-xs">{(() => { const d = new Date(t.created_at); d.setHours(d.getHours() - 3); return d.toLocaleString('es-AR', { hour12: false }) })()}</td>
                    <td className="p-4">
                      <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-400 text-xs uppercase tracking-widest transition">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
