'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { negocio } from '@/config'
import { generarHorarios, calcularUmbral, horaValida, esDiaHabil } from '@/lib/config'
import CalendarioInline from '@/components/CalendarioInline'

const HORARIOS = generarHorarios(negocio.horario.inicioMin, negocio.horario.finMin, negocio.horario.intervaloMinutos)
const RECURSOS = negocio.recursos
const UMBRAL = calcularUmbral(negocio.horario.finMin)


export default function ReservarPage() {
  const router = useRouter()
  const [fecha, setFecha] = useState('')
  const [horaSeleccionada, setHoraSeleccionada] = useState('')
  const [recursosSeleccionados, setRecursosSeleccionados] = useState<number[]>([])
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cargando, setCargando] = useState(false)
  const [ocupadosPorHora, setOcupadosPorHora] = useState<Record<string, number[]>>({})
  const [fechaBloqueada, setFechaBloqueada] = useState(false)
  const [diaNoHabil, setDiaNoHabil] = useState(false)
  const [horariosBloqueados, setHorariosBloqueados] = useState<string[]>([])

  useEffect(() => {
    if (!fecha) return
    const fetchDatos = async () => {
      if (!esDiaHabil(fecha, negocio.diasHabiles)) {
        setDiaNoHabil(true)
        setFechaBloqueada(false)
        return
      }
      setDiaNoHabil(false)
      const [{ data: turnosData }, { data: bloqueo }, { data: horBloq }] = await Promise.all([
        supabase.from('turnos').select('hora_inicio, simulador_id').eq('fecha', fecha).eq('negocio_id', negocio.id),
        supabase.from('dias_bloqueados').select('fecha').eq('fecha', fecha).eq('negocio_id', negocio.id).single(),
        supabase.from('horarios_bloqueados').select('hora').eq('fecha', fecha).eq('negocio_id', negocio.id),
      ])
      setFechaBloqueada(!!bloqueo)
      setHorariosBloqueados((horBloq ?? []).map((h) => h.hora.slice(0, 5)))
      const mapa: Record<string, number[]> = {}
      for (const t of turnosData ?? []) {
        const h = t.hora_inicio.slice(0, 5)
        if (!mapa[h]) mapa[h] = []
        mapa[h].push(t.simulador_id)
      }
      setOcupadosPorHora(mapa)
    }
    fetchDatos()
    setHoraSeleccionada('')
    setRecursosSeleccionados([])
  }, [fecha])

  function seleccionarHora(hora: string) {
    setHoraSeleccionada(hora)
    setRecursosSeleccionados([])
  }

  function toggleRecurso(id: number) {
    const ocupados = ocupadosPorHora[horaSeleccionada] ?? []
    if (ocupados.includes(id)) return
    setRecursosSeleccionados((prev) =>
      negocio.seleccionSimple
        ? prev.includes(id) ? [] : [id]
        : prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  async function confirmarReserva() {
    setCargando(true)
    let clienteId
    const { data: clienteExistente } = await supabase.from('clientes').select('id').eq('telefono', telefono).eq('negocio_id', negocio.id).single()
    if (clienteExistente) {
      clienteId = clienteExistente.id
      await supabase.from('clientes').update({ nombre }).eq('id', clienteId)
    } else {
      const { data: nuevoCliente, error } = await supabase.from('clientes').insert({ nombre, telefono, negocio_id: negocio.id }).select('id').single()
      if (error || !nuevoCliente) { alert('Error al guardar el cliente: ' + (error?.message ?? 'sin datos')); setCargando(false); return }
      clienteId = nuevoCliente.id
    }

    const [horas, minutos] = horaSeleccionada.split(':').map(Number)
    const totalMin = horas * 60 + minutos + negocio.duracionMinutos
    const horaFin = String(Math.floor(totalMin / 60) % 24).padStart(2, '0') + ':' + String(totalMin % 60).padStart(2, '0')

    const tokens: string[] = []
    for (const simId of recursosSeleccionados) {
      const { data: turnoCreado, error: errorTurno } = await supabase.from('turnos').insert({
        negocio_id: negocio.id,
        simulador_id: simId,
        cliente_id: clienteId,
        fecha,
        hora_inicio: horaSeleccionada,
        hora_fin: horaFin,
      }).select('cancel_token').single()
      if (errorTurno || !turnoCreado) { alert('Error al guardar turno en ' + negocio.recursoNombre + ' ' + simId); setCargando(false); return }
      tokens.push(turnoCreado.cancel_token)
    }

    await notificarReserva(nombre, telefono, fecha, horaSeleccionada, recursosSeleccionados)
    router.push(`/confirmado?tokens=${tokens.join(',')}&fecha=${fecha}&hora=${horaSeleccionada}&simus=${recursosSeleccionados.join(',')}`)
  }

  async function notificarReserva(nombre: string, telefono: string, fecha: string, hora: string, recursos: number[]) {
    const fechaFmt = new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    const recursoTexto = recursos.length === 1
      ? `${negocio.recursoNombre} ${recursos[0]}`
      : `${negocio.recursoNombrePlural} ${recursos.join(', ')}`
    const mensaje = `✅ Nueva reserva\n👤 ${nombre}\n📱 ${telefono}\n📅 ${fechaFmt}\n⏰ ${hora} hs\n${negocio.emoji ?? '🏎'} ${recursoTexto}`
    await fetch('/api/notificar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mensaje }) })
  }

  const ocupadosEnHora = horaSeleccionada ? (ocupadosPorHora[horaSeleccionada] ?? []) : []
  const disponiblesEnHora = (hora: string) => RECURSOS.length - (ocupadosPorHora[hora] ?? []).length

  return (
    <main className="min-h-screen bg-[var(--bg)] text-white">
      <div className="border-b border-white/10 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-widest uppercase">
            <span className="text-[var(--accent)]">{negocio.nombreDisplay?.parte1 ?? negocio.nombre.split('.')[0] + '.'}</span>
            {negocio.nombreDisplay ? negocio.nombreDisplay.parte2 : negocio.nombre.split('.').slice(1).join('.')}
          </h1>
          <p className="text-xs text-gray-600 tracking-wider uppercase mt-0.5">{negocio.direccion}</p>
        </div>
        <a href="/" className="text-xs text-gray-600 hover:text-[var(--accent)] tracking-widest uppercase transition">← Volver</a>
      </div>

      <div className="max-w-xl mx-auto px-8 py-12">
        <p className="text-xs tracking-[0.4em] uppercase text-[var(--accent)] mb-2">Nueva reserva</p>
        <h2 className="text-4xl font-black uppercase mb-10">Elegí tu turno</h2>

        {/* Fecha */}
        <div className="mb-8">
          <label className="block text-xs uppercase tracking-widest text-gray-500 mb-3">Fecha</label>
          <CalendarioInline
            value={fecha}
            onChange={setFecha}
            diasHabiles={negocio.diasHabiles}
          />
        </div>

        {/* Día no hábil */}
        {fecha && diaNoHabil && (
          <div className="mb-8 bg-white/5 border border-white/10 rounded-xl px-5 py-4">
            <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-1">No atendemos ese día</p>
            <p className="text-gray-600 text-xs">Elegí un día hábil.</p>
          </div>
        )}

        {/* Fecha bloqueada */}
        {fecha && !diaNoHabil && fechaBloqueada && (
          <div className="mb-8 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-5 py-4">
            <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-1">Día no disponible</p>
            <p className="text-yellow-700 text-xs">El local no abre este día. Elegí otra fecha.</p>
          </div>
        )}

        {/* Horario */}
        {fecha && !diaNoHabil && !fechaBloqueada && (
          <div className="mb-8">
            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-3">Horario</label>
            <div className="grid grid-cols-4 gap-2">
              {HORARIOS.map((hora) => {
                const disp = disponiblesEnHora(hora)
                const pasado = !horaValida(hora, fecha, UMBRAL, negocio.anticipacionMinHs)
                const bloqueado = horariosBloqueados.includes(hora)
                const lleno = disp === 0 || pasado || bloqueado
                const seleccionado = horaSeleccionada === hora
                return (
                  <button
                    key={hora}
                    onClick={() => !lleno && seleccionarHora(hora)}
                    disabled={lleno}
                    className={'rounded-xl py-3 px-2 text-center text-sm font-medium transition border flex flex-col items-center gap-1 ' +
                      (lleno ? 'border-white/5 text-gray-700 cursor-not-allowed ' : '') +
                      (seleccionado ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]/80 ' : '') +
                      (!lleno && !seleccionado ? 'border-white/10 hover:border-[var(--accent)] hover:text-[var(--accent)]/80 text-gray-300' : '')}
                  >
                    <span>{hora}</span>
                    <span className={'text-xs ' + (lleno ? 'text-gray-700' : seleccionado ? 'text-[var(--accent)]/50' : 'text-gray-600')}>
                      {pasado ? 'pasado' : bloqueado ? 'no disp.' : lleno ? 'lleno' : disp + (disp === 1 ? ' libre' : ' libres')}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Recursos */}
        {horaSeleccionada && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs uppercase tracking-widest text-gray-500">
                {negocio.recursoNombrePlural}
              </label>
              {recursosSeleccionados.length > 0 && (
                <button onClick={() => setRecursosSeleccionados([])} className="text-xs text-gray-600 hover:text-[var(--accent)]/80 transition uppercase tracking-widest">
                  Limpiar
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-3">
              {RECURSOS.map((r) => {
                const ocupado = ocupadosEnHora.includes(r.id)
                const seleccionado = recursosSeleccionados.includes(r.id)
                return (
                  <button
                    key={r.id}
                    onClick={() => toggleRecurso(r.id)}
                    disabled={ocupado}
                    className={'rounded-2xl py-6 text-center transition border flex flex-col items-center gap-2 ' +
                      (ocupado ? 'border-white/5 text-gray-700 cursor-not-allowed ' : '') +
                      (seleccionado ? 'border-[var(--accent)] bg-[var(--accent)]/10 ' : '') +
                      (!ocupado && !seleccionado ? 'border-white/10 hover:border-[var(--accent)] ' : '')}
                  >
                    <span className={'text-2xl ' + (ocupado ? 'grayscale opacity-30' : '')}>{negocio.emoji ?? '🏎'}</span>
                    <span className={'text-xs font-bold tracking-widest uppercase ' +
                      (ocupado ? 'text-gray-700' : seleccionado ? 'text-[var(--accent)]/80' : 'text-gray-400')}>
                      {r.nombre}
                    </span>
                    <span className={'text-xs ' + (ocupado ? 'text-gray-700' : seleccionado ? 'text-[var(--accent)]/50' : 'text-gray-600')}>
                      {ocupado ? 'ocupado' : seleccionado ? 'elegido' : 'libre'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Datos */}
        {recursosSeleccionados.length > 0 && (
          <div className="mb-8 border border-white/10 rounded-xl p-6">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-4">Tus datos</p>
            <div className="mb-4">
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Nombre</label>
              <input type="text" className="bg-white/5 border border-white/10 rounded-xl p-3 w-full text-white focus:border-[var(--accent)] outline-none text-sm" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan Perez" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Telefono</label>
              <input type="tel" className="bg-white/5 border border-white/10 rounded-xl p-3 w-full text-white focus:border-[var(--accent)] outline-none text-sm" value={telefono} onChange={(e) => setTelefono(e.target.value.replace(/[^0-9]/g, ''))} placeholder="11 1234-5678" />
            </div>
          </div>
        )}

        {/* Confirmar */}
        {nombre && telefono && recursosSeleccionados.length > 0 && (
          <button
            onClick={confirmarReserva}
            disabled={cargando}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl p-4 font-black uppercase tracking-widest transition disabled:opacity-50 text-sm"
          >
            {cargando
              ? 'Guardando...'
              : `Confirmar · ${horaSeleccionada} · ${recursosSeleccionados.length === 1 ? negocio.recursoNombre + ' ' + recursosSeleccionados[0] : recursosSeleccionados.length + ' ' + negocio.recursoNombrePlural.toLowerCase()}`}
          </button>
        )}
      </div>
    </main>
  )
}
