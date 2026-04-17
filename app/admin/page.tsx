'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const HORARIOS = [
  '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00', '00:00', '01:00'
]
const SIMU_IDS = [1, 2, 3, 4]
const PASSWORD = 'racing2025'

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

export default function Admin() {
  const [autenticado, setAutenticado] = useState(false)
  const [inputPass, setInputPass] = useState('')
  const [passError, setPassError] = useState(false)
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(false)
  const [fecha, setFecha] = useState(hoy())
  const [vista, setVista] = useState<'grilla' | 'tabla'>('grilla')
  const [todasFechas, setTodasFechas] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('admin_ok') === '1') setAutenticado(true)
  }, [])

  useEffect(() => {
    if (!autenticado) return
    fetchTurnos()
  }, [autenticado, fecha, todasFechas])

  const fetchTurnos = async () => {
    setLoading(true)
    let query = supabase
      .from('turnos')
      .select('id, fecha, hora_inicio, hora_fin, simulador_id, created_at, clientes ( nombre, telefono ), simuladores ( nombre )')
    if (!todasFechas) query = query.eq('fecha', fecha)
    query = query.order('fecha', { ascending: true }).order('hora_inicio', { ascending: true })
    const { data, error } = await query
    if (!error && data) setTurnos(data)
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar este turno?')) return
    const { error } = await supabase.from('turnos').delete().eq('id', id)
    if (!error) {
      setTurnos(turnos.filter((t) => t.id !== id))
    }
  }

  function login() {
    if (inputPass === PASSWORD) {
      sessionStorage.setItem('admin_ok', '1')
      setAutenticado(true)
    } else {
      setPassError(true)
      setInputPass('')
    }
  }

  // Pantalla de login
  if (!autenticado) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <p className="text-xs tracking-[0.4em] uppercase text-red-500 mb-2 text-center">Panel</p>
          <h1 className="text-3xl font-black uppercase text-center mb-10">Admin</h1>
          <input
            type="password"
            placeholder="Contraseña"
            value={inputPass}
            onChange={(e) => { setInputPass(e.target.value); setPassError(false) }}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            className={'bg-white/5 border rounded-xl p-4 w-full text-white outline-none text-sm mb-3 ' + (passError ? 'border-red-500' : 'border-white/10 focus:border-red-500')}
          />
          {passError && <p className="text-red-500 text-xs mb-3 tracking-widest uppercase">Contraseña incorrecta</p>}
          <button onClick={login} className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl p-4 font-black uppercase tracking-widest transition text-sm">
            Entrar
          </button>
        </div>
      </main>
    )
  }

  // Grilla: filas = horarios, columnas = simuladores
  const grillaMap: Record<string, Record<number, any>> = {}
  for (const t of turnos) {
    const h = t.hora_inicio.slice(0, 5)
    if (!grillaMap[h]) grillaMap[h] = {}
    grillaMap[h][t.simulador_id] = t
  }

  const fechaFormateada = new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-xs tracking-[0.4em] uppercase text-red-500 mb-1">Panel</p>
            <h1 className="text-3xl font-black uppercase">Admin</h1>
            <p className="text-gray-600 text-sm mt-1 capitalize">{todasFechas ? 'Todas las fechas' : fechaFormateada} · {turnos.length} turnos</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setTodasFechas(!todasFechas)}
              className={'px-4 py-2 rounded-xl text-xs uppercase tracking-widest transition border ' + (todasFechas ? 'bg-red-500 border-red-500 text-white' : 'border-white/10 text-gray-500 hover:text-white')}
            >
              Todas
            </button>
            {!todasFechas && (
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none text-sm focus:border-red-500"
              />
            )}
            <div className="flex border border-white/10 rounded-xl overflow-hidden text-xs">
              <button
                onClick={() => setVista('grilla')}
                className={'px-4 py-2 uppercase tracking-widest transition ' + (vista === 'grilla' ? 'bg-red-500 text-white' : 'text-gray-500 hover:text-white')}
              >
                Grilla
              </button>
              <button
                onClick={() => setVista('tabla')}
                className={'px-4 py-2 uppercase tracking-widest transition ' + (vista === 'tabla' ? 'bg-red-500 text-white' : 'text-gray-500 hover:text-white')}
              >
                Tabla
              </button>
            </div>
            <button
              onClick={() => { sessionStorage.removeItem('admin_ok'); setAutenticado(false) }}
              className="text-xs text-gray-600 hover:text-red-500 uppercase tracking-widest transition"
            >
              Salir
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600 tracking-widest uppercase text-sm">Cargando...</p>
        ) : turnos.length === 0 && vista === 'tabla' ? (
          <p className="text-gray-600">No hay turnos para este día.</p>
        ) : vista === 'grilla' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="p-3 text-left text-xs uppercase tracking-widest text-gray-600 w-20">Hora</th>
                  {SIMU_IDS.map((id) => (
                    <th key={id} className="p-3 text-center text-xs uppercase tracking-widest text-gray-600">
                      Sim {id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HORARIOS.map((hora) => (
                  <tr key={hora} className="border-t border-white/5">
                    <td className="p-3 text-gray-600 text-xs font-mono">{hora}</td>
                    {SIMU_IDS.map((simId) => {
                      const turno = grillaMap[hora]?.[simId]
                      return (
                        <td key={simId} className="p-2">
                          {turno ? (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center group relative">
                              <p className="text-xs font-bold text-red-400 truncate">{turno.clientes?.nombre}</p>
                              <p className="text-xs text-gray-600">{turno.clientes?.telefono}</p>
                              <button
                                onClick={() => handleDelete(turno.id)}
                                className="absolute top-1 right-1 text-red-700 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="rounded-lg p-2 text-center border border-white/5 text-gray-800 text-xs">
                              libre
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {todasFechas && <th className="p-4 text-left text-xs uppercase tracking-widest text-gray-500">Fecha</th>}
                  <th className="p-4 text-left text-xs uppercase tracking-widest text-gray-500">Simulador</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest text-gray-500">Cliente</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest text-gray-500">Telefono</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest text-gray-500">Horario</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest text-gray-500">Reservado</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {turnos.map((t) => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    {todasFechas && <td className="p-4 text-gray-400 text-xs">{new Date(t.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}</td>}
                    <td className="p-4 font-medium">{t.simuladores?.nombre}</td>
                    <td className="p-4">{t.clientes?.nombre}</td>
                    <td className="p-4 text-gray-400">{t.clientes?.telefono}</td>
                    <td className="p-4">{t.hora_inicio?.slice(0, 5)} - {t.hora_fin?.slice(0, 5)}</td>
                    <td className="p-4 text-gray-600 text-xs">
                      {(() => { const d = new Date(t.created_at); d.setHours(d.getHours() - 3); return d.toLocaleString('es-AR', { hour12: false }) })()}
                    </td>
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
