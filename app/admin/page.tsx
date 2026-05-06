'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { negocio } from '@/config'
import { generarHorarios } from '@/lib/config'

type Turno = {
  id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  simulador_id: number
  created_at: string
  email_verificacion: string | null
  clientes: { nombre: string; telefono: string } | null
  simuladores: { nombre: string } | null
}

const HORARIOS = generarHorarios(negocio.horario.inicioMin, negocio.horario.finMin, negocio.horario.intervaloMinutos)
const RECURSOS = negocio.recursos

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

export default function Admin() {
  const [modo, setModo] = useState<'proximos' | 'todos' | 'dia'>('proximos')
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(false)
  const [fecha, setFecha] = useState(hoy())
  const [vista, setVista] = useState<'grilla' | 'tabla'>('grilla')
  const [diaBloqueado, setDiaBloqueado] = useState<{ motivo: string } | null>(null)
  const [mostrandoFormBloqueo, setMostrandoFormBloqueo] = useState(false)
  const [motivoInput, setMotivoInput] = useState('')
  const [horariosBloqueados, setHorariosBloqueados] = useState<Set<string>>(new Set())
  const [mostrarPasados, setMostrarPasados] = useState(false)

  useEffect(() => {
    fetchTurnos()
    if (modo === 'dia') { fetchBloqueo(); fetchHorariosBloqueados() }
    else { setDiaBloqueado(null); setHorariosBloqueados(new Set()) }
  }, [modo, fecha])

  const fetchTurnos = async () => {
    setLoading(true)
    let query = supabase
      .from('turnos')
      .select('id, fecha, hora_inicio, hora_fin, simulador_id, created_at, email_verificacion, clientes ( nombre, telefono ), simuladores ( nombre )')
      .eq('negocio_id', negocio.id)
    if (modo === 'dia') query = query.eq('fecha', fecha)
    else if (modo === 'proximos') query = query.gte('fecha', hoy())
    query = query.order('fecha', { ascending: true }).order('hora_inicio', { ascending: true })
    const { data, error } = await query
    if (!error && data) setTurnos(data as unknown as Turno[])
    setLoading(false)
  }

  const fetchHorariosBloqueados = async () => {
    const { data } = await supabase.from('horarios_bloqueados').select('hora').eq('fecha', fecha).eq('negocio_id', negocio.id)
    setHorariosBloqueados(new Set((data ?? []).map((d) => d.hora.slice(0, 5))))
  }

  const toggleHorario = async (hora: string) => {
    if (horariosBloqueados.has(hora)) {
      await supabase.from('horarios_bloqueados').delete().eq('fecha', fecha).eq('hora', hora).eq('negocio_id', negocio.id)
      setHorariosBloqueados((prev) => { const s = new Set(prev); s.delete(hora); return s })
    } else {
      await supabase.from('horarios_bloqueados').insert({ fecha, hora, negocio_id: negocio.id })
      setHorariosBloqueados((prev) => new Set([...prev, hora]))
    }
  }

  const fetchBloqueo = async () => {
    const { data } = await supabase
      .from('dias_bloqueados')
      .select('motivo')
      .eq('fecha', fecha)
      .eq('negocio_id', negocio.id)
      .single()
    setDiaBloqueado(data ?? null)
    setMostrandoFormBloqueo(false)
    setMotivoInput('')
  }

  const bloquearDia = async () => {
    const { error } = await supabase
      .from('dias_bloqueados')
      .upsert({ fecha, motivo: motivoInput.trim() || null, negocio_id: negocio.id }, { onConflict: 'negocio_id,fecha' })
    if (error) {
      alert('Error al bloquear: ' + error.message)
      return
    }
    fetchBloqueo()
  }

  const desbloquearDia = async () => {
    await supabase.from('dias_bloqueados').delete().eq('fecha', fecha).eq('negocio_id', negocio.id)
    setDiaBloqueado(null)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Eliminar este turno?')) return
    const { error } = await supabase.from('turnos').delete().eq('id', id)
    if (!error) setTurnos(turnos.filter((t) => t.id !== id))
  }

  function esPasado(fecha: string, hora: string) {
    return new Date(`${fecha}T${hora}`) < new Date()
  }

  const turnosFiltrados = modo === 'dia' && !mostrarPasados
    ? turnos.filter(t => !esPasado(t.fecha, t.hora_fin.slice(0, 5)))
    : turnos

  const horariosFiltrados = !mostrarPasados
    ? HORARIOS.filter(hora => !esPasado(fecha, hora))
    : HORARIOS

  const grillaMap: Record<string, Record<number, any>> = {}
  for (const t of turnos) {
    const h = t.hora_inicio.slice(0, 5)
    if (!grillaMap[h]) grillaMap[h] = {}
    grillaMap[h][t.simulador_id] = t
  }

  const fechaFormateada = new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  const subtitulo = modo === 'proximos'
    ? `Próximos turnos · ${turnosFiltrados.length} turnos`
    : modo === 'todos'
    ? `Todos los turnos · ${turnosFiltrados.length} turnos`
    : `${fechaFormateada} · ${turnosFiltrados.length} turnos`

  const navClass = (m: typeof modo) =>
    'px-4 py-2 uppercase tracking-widest transition text-xs ' +
    (modo === m ? 'bg-[var(--accent)] text-white' : 'text-gray-500 hover:text-white')

  return (
    <main className="min-h-screen bg-[var(--bg)] text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <p className="text-xs tracking-[0.4em] uppercase text-[var(--accent)] mb-1">Panel</p>
            <h1 className="text-3xl font-black uppercase">Admin</h1>
            <p className="text-gray-600 text-sm mt-1 capitalize">{subtitulo}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex border border-white/10 rounded-xl overflow-hidden text-xs">
              <button onClick={() => setModo('proximos')} className={navClass('proximos')}>Próximos</button>
              <button onClick={() => setModo('todos')} className={navClass('todos')}>Todos</button>
              <button onClick={() => setModo('dia')} className={navClass('dia')}>Por día</button>
            </div>
            {modo === 'dia' && (
              <>
                <button
                  onClick={() => setMostrarPasados(p => !p)}
                  className={'px-4 py-2 rounded-xl text-xs uppercase tracking-widest transition border ' + (mostrarPasados ? 'border-white/20 text-white bg-white/10' : 'border-white/10 text-gray-500 hover:text-white')}
                >
                  {mostrarPasados ? 'Ocultar historial' : 'Ver historial'}
                </button>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none text-sm focus:border-[var(--accent)]"
                />
                <div className="flex border border-white/10 rounded-xl overflow-hidden text-xs">
                  <button onClick={() => setVista('grilla')} className={'px-4 py-2 uppercase tracking-widest transition ' + (vista === 'grilla' ? 'bg-[var(--accent)] text-white' : 'text-gray-500 hover:text-white')}>Grilla</button>
                  <button onClick={() => setVista('tabla')} className={'px-4 py-2 uppercase tracking-widest transition ' + (vista === 'tabla' ? 'bg-[var(--accent)] text-white' : 'text-gray-500 hover:text-white')}>Tabla</button>
                </div>
              </>
            )}
            <button
              onClick={async () => { await fetch('/api/admin-login', { method: 'DELETE' }); window.location.href = '/admin-login' }}
              className="text-xs text-gray-600 hover:text-[var(--accent)] uppercase tracking-widest transition"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Control de bloqueo — solo modo día */}
        {modo === 'dia' && (
          <div className="mb-6">
            {diaBloqueado ? (
              <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-5 py-3">
                <div>
                  <span className="text-yellow-400 font-bold text-sm uppercase tracking-widest">Día bloqueado</span>
                  {diaBloqueado.motivo && <span className="text-yellow-600 text-sm ml-3">· {diaBloqueado.motivo}</span>}
                </div>
                <button onClick={desbloquearDia} className="text-xs uppercase tracking-widest text-yellow-600 hover:text-yellow-400 transition">
                  Desbloquear
                </button>
              </div>
            ) : mostrandoFormBloqueo ? (
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-5 py-3">
                <input
                  type="text"
                  value={motivoInput}
                  onChange={e => setMotivoInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && bloquearDia()}
                  placeholder="Motivo (opcional: Feriado, Mantenimiento...)"
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-700"
                  autoFocus
                />
                <button onClick={bloquearDia} className="text-xs uppercase tracking-widest text-yellow-400 hover:text-yellow-300 font-bold transition">Confirmar</button>
                <button onClick={() => { setMostrandoFormBloqueo(false); setMotivoInput('') }} className="text-xs uppercase tracking-widest text-gray-600 hover:text-gray-400 transition">Cancelar</button>
              </div>
            ) : (
              <button
                onClick={() => setMostrandoFormBloqueo(true)}
                className="text-xs uppercase tracking-widest text-gray-600 hover:text-yellow-500 transition border border-white/5 hover:border-yellow-500/30 rounded-xl px-5 py-3 w-full text-left"
              >
                + Bloquear este día
              </button>
            )}
          </div>
        )}

        {loading ? (
          <p className="text-gray-600 tracking-widest uppercase text-sm">Cargando...</p>
        ) : modo === 'dia' && vista === 'grilla' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="p-3 text-left text-xs uppercase tracking-widest text-gray-600 w-20">Hora</th>
                  {RECURSOS.map((r) => (
                    <th key={r.id} className="p-3 text-center text-xs uppercase tracking-widest text-gray-600">
                      {negocio.recursoNombre} {r.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horariosFiltrados.map((hora) => (
                  <tr key={hora} className="border-t border-white/5">
                    <td className="p-3 text-gray-600 text-xs font-mono">{hora}</td>
                    {RECURSOS.map((r) => {
                      const turno = grillaMap[hora]?.[r.id]
                      return (
                        <td key={r.id} className="p-2">
                          {diaBloqueado ? (
                            <div className="rounded-lg p-2 text-center border border-yellow-500/10 text-yellow-900 text-xs">bloq.</div>
                          ) : turno ? (
                            <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-lg p-2 text-center group relative">
                              <p className="text-xs font-bold text-[var(--accent)]/80 truncate">{turno.clientes?.nombre}</p>
                              <p className="text-xs text-gray-600">{turno.clientes?.telefono}</p>
                              <button
                                onClick={() => handleDelete(turno.id)}
                                className="absolute top-1 right-1 text-[var(--accent)]/50 hover:text-[var(--accent)]/80 text-xs opacity-0 group-hover:opacity-100 transition"
                              >✕</button>
                            </div>
                          ) : horariosBloqueados.has(hora) ? (
                            <button onClick={() => toggleHorario(hora)} className="w-full rounded-lg p-2 text-center border border-orange-500/20 text-orange-800 text-xs hover:border-orange-500/40 transition">
                              bloq. ✕
                            </button>
                          ) : (
                            <button onClick={() => toggleHorario(hora)} className="w-full rounded-lg p-2 text-center border border-white/5 text-gray-800 text-xs hover:border-white/20 hover:text-gray-600 transition">
                              libre
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : turnosFiltrados.length === 0 ? (
          <p className="text-gray-600">{modo === 'dia' ? 'No hay turnos para este día.' : 'No hay turnos.'}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {modo !== 'dia' && <th className="p-4 text-left text-xs uppercase tracking-widest text-gray-500">Fecha</th>}
                  <th className="p-4 text-left text-xs uppercase tracking-widest text-gray-500">{negocio.recursoNombre}</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest text-gray-500">Cliente</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest text-gray-500">Telefono</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest text-gray-500">Email</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest text-gray-500">Horario</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest text-gray-500">Reservado</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {turnosFiltrados.map((t) => (
                  <tr
                    key={t.id}
                    className={'border-b border-white/5 hover:bg-white/5 transition' + (modo === 'todos' && esPasado(t.fecha, t.hora_fin.slice(0, 5)) ? ' opacity-50' : '')}
                  >
                    {modo !== 'dia' && <td className="p-4 text-gray-400 text-xs">{new Date(t.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}</td>}
                    <td className="p-4 font-medium">{RECURSOS.find(r => r.id === t.simulador_id)?.nombre ?? t.simuladores?.nombre}</td>
                    <td className="p-4">{t.clientes?.nombre}</td>
                    <td className="p-4 text-gray-400">{t.clientes?.telefono}</td>
                    <td className="p-4 text-gray-400 text-xs">{t.email_verificacion ?? '—'}</td>
                    <td className="p-4">{t.hora_inicio?.slice(0, 5)} - {t.hora_fin?.slice(0, 5)}</td>
                    <td className="p-4 text-gray-600 text-xs">
                      {(() => { const d = new Date(t.created_at); d.setHours(d.getHours() - 3); return d.toLocaleString('es-AR', { hour12: false }) })()}
                    </td>
                    <td className="p-4">
                      <button onClick={() => handleDelete(t.id)} className="text-[var(--accent)] hover:text-[var(--accent)]/80 text-xs uppercase tracking-widest transition">Eliminar</button>
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
