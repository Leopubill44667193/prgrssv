'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const HORARIOS = [
  '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00', '00:00', '01:00'
]

const SIMULADORES = [1, 2, 3, 4]

export default function ReservarPage() {
  const router = useRouter()
  const [fecha, setFecha] = useState('')
  const [horaSeleccionada, setHoraSeleccionada] = useState('')
  const [simusSeleccionados, setSimusSeleccionados] = useState<number[]>([])
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cargando, setCargando] = useState(false)
  const [ocupadosPorHora, setOcupadosPorHora] = useState<Record<string, number[]>>({})

  useEffect(() => {
    if (!fecha) return
    const fetchOcupados = async () => {
      const { data } = await supabase
        .from('turnos')
        .select('hora_inicio, simulador_id')
        .eq('fecha', fecha)
      const mapa: Record<string, number[]> = {}
      for (const t of data ?? []) {
        const h = t.hora_inicio.slice(0, 5)
        if (!mapa[h]) mapa[h] = []
        mapa[h].push(t.simulador_id)
      }
      setOcupadosPorHora(mapa)
    }
    fetchOcupados()
    setHoraSeleccionada('')
    setSimusSeleccionados([])
  }, [fecha])

  function seleccionarHora(hora: string) {
    setHoraSeleccionada(hora)
    setSimusSeleccionados([])
  }

  function toggleSim(id: number) {
    const ocupados = ocupadosPorHora[horaSeleccionada] ?? []
    if (ocupados.includes(id)) return
    setSimusSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  async function confirmarReserva() {
    setCargando(true)
    let clienteId
    const { data: clienteExistente } = await supabase.from('clientes').select('id').eq('telefono', telefono).single()
    if (clienteExistente) {
      clienteId = clienteExistente.id
    } else {
      const { data: nuevoCliente, error } = await supabase.from('clientes').insert({ nombre, telefono }).select('id').single()
      if (error || !nuevoCliente) { alert('Error al guardar el cliente'); setCargando(false); return }
      clienteId = nuevoCliente.id
    }

    const [horas, minutos] = horaSeleccionada.split(':').map(Number)
    const horaFin = String((horas + 1) % 24).padStart(2, '0') + ':' + String(minutos).padStart(2, '0')

    const tokens: string[] = []
    for (const simId of simusSeleccionados) {
      const { data: turnoCreado, error: errorTurno } = await supabase.from('turnos').insert({
        simulador_id: simId,
        cliente_id: clienteId,
        fecha,
        hora_inicio: horaSeleccionada,
        hora_fin: horaFin,
      }).select('cancel_token').single()
      if (errorTurno || !turnoCreado) { alert('Error al guardar turno en simulador ' + simId); setCargando(false); return }
      tokens.push(turnoCreado.cancel_token)
    }

    router.push(`/confirmado?tokens=${tokens.join(',')}&fecha=${fecha}&hora=${horaSeleccionada}&simus=${simusSeleccionados.join(',')}`)
  }

  const ocupadosEnHora = horaSeleccionada ? (ocupadosPorHora[horaSeleccionada] ?? []) : []
  const disponiblesEnHora = (hora: string) => SIMULADORES.length - (ocupadosPorHora[hora] ?? []).length

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-widest uppercase">
            <span className="text-red-500">OC.</span>Hobbies.Racing
          </h1>
          <p className="text-xs text-gray-600 tracking-wider uppercase mt-0.5">Av. 3 de Febrero 283 · Rosario</p>
        </div>
        <a href="/" className="text-xs text-gray-600 hover:text-red-500 tracking-widest uppercase transition">← Volver</a>
      </div>

      <div className="max-w-xl mx-auto px-8 py-12">
        <p className="text-xs tracking-[0.4em] uppercase text-red-500 mb-2">Nueva reserva</p>
        <h2 className="text-4xl font-black uppercase mb-10">Elegí tu turno</h2>

        {/* Fecha */}
        <div className="mb-8">
          <label className="block text-xs uppercase tracking-widest text-gray-500 mb-3">Fecha</label>
          <input
            type="date"
            className="bg-white/5 border border-white/10 rounded-xl p-4 w-full text-white focus:border-red-500 outline-none text-sm"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        {/* Horario */}
        {fecha && (
          <div className="mb-8">
            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-3">Horario</label>
            <div className="grid grid-cols-4 gap-2">
              {HORARIOS.map((hora) => {
                const disp = disponiblesEnHora(hora)
                const lleno = disp === 0
                const seleccionado = horaSeleccionada === hora
                return (
                  <button
                    key={hora}
                    onClick={() => !lleno && seleccionarHora(hora)}
                    disabled={lleno}
                    className={'rounded-xl py-3 px-2 text-center text-sm font-medium transition border flex flex-col items-center gap-1 ' +
                      (lleno ? 'border-white/5 text-gray-700 cursor-not-allowed ' : '') +
                      (seleccionado ? 'border-red-500 bg-red-500/10 text-red-400 ' : '') +
                      (!lleno && !seleccionado ? 'border-white/10 hover:border-red-500 hover:text-red-400 text-gray-300' : '')}
                  >
                    <span>{hora}</span>
                    <span className={'text-xs ' + (lleno ? 'text-gray-700' : seleccionado ? 'text-red-500/50' : 'text-gray-600')}>
                      {lleno ? 'lleno' : disp + (disp === 1 ? ' libre' : ' libres')}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Butacas */}
        {horaSeleccionada && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs uppercase tracking-widest text-gray-500">Butacas</label>
              {simusSeleccionados.length > 0 && (
                <button onClick={() => setSimusSeleccionados([])} className="text-xs text-gray-600 hover:text-red-400 transition uppercase tracking-widest">
                  Limpiar
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-3">
              {SIMULADORES.map((id) => {
                const ocupado = ocupadosEnHora.includes(id)
                const seleccionado = simusSeleccionados.includes(id)
                return (
                  <button
                    key={id}
                    onClick={() => toggleSim(id)}
                    disabled={ocupado}
                    className={'rounded-2xl py-6 text-center transition border flex flex-col items-center gap-2 ' +
                      (ocupado ? 'border-white/5 text-gray-700 cursor-not-allowed ' : '') +
                      (seleccionado ? 'border-red-500 bg-red-500/10 ' : '') +
                      (!ocupado && !seleccionado ? 'border-white/10 hover:border-red-500 ' : '')}
                  >
                    <span className={'text-2xl ' + (ocupado ? 'grayscale opacity-30' : '')}>🏎</span>
                    <span className={'text-xs font-bold tracking-widest uppercase ' +
                      (ocupado ? 'text-gray-700' : seleccionado ? 'text-red-400' : 'text-gray-400')}>
                      Sim {id}
                    </span>
                    <span className={'text-xs ' + (ocupado ? 'text-gray-700' : seleccionado ? 'text-red-500/50' : 'text-gray-600')}>
                      {ocupado ? 'ocupado' : seleccionado ? 'elegido' : 'libre'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Datos */}
        {simusSeleccionados.length > 0 && (
          <div className="mb-8 border border-white/10 rounded-xl p-6">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-4">Tus datos</p>
            <div className="mb-4">
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Nombre</label>
              <input
                type="text"
                className="bg-white/5 border border-white/10 rounded-xl p-3 w-full text-white focus:border-red-500 outline-none text-sm"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Juan Perez"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Telefono</label>
              <input
                type="tel"
                className="bg-white/5 border border-white/10 rounded-xl p-3 w-full text-white focus:border-red-500 outline-none text-sm"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="11 1234-5678"
              />
            </div>
          </div>
        )}

        {/* Confirmar */}
        {nombre && telefono && simusSeleccionados.length > 0 && (
          <button
            onClick={confirmarReserva}
            disabled={cargando}
            className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl p-4 font-black uppercase tracking-widest transition disabled:opacity-50 text-sm"
          >
            {cargando
              ? 'Guardando...'
              : `Confirmar · ${horaSeleccionada} · ${simusSeleccionados.length === 1 ? 'Sim ' + simusSeleccionados[0] : simusSeleccionados.length + ' simuladores'}`}
          </button>
        )}
      </div>
    </main>
  )
}
