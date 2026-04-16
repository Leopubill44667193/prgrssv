'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const HORARIOS = [
  '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00', '00:00', '01:00'
]

export default function ReservarPage({ params }) {
  const router = useRouter()
  const [simuladorId, setSimuladorId] = useState('')
  const [fecha, setFecha] = useState('')
  const [horaSeleccionada, setHoraSeleccionada] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cargando, setCargando] = useState(false)
  const [horasOcupadas, setHorasOcupadas] = useState([])

  useEffect(() => {
    params.then((p) => setSimuladorId(p.id))
  }, [params])

  useEffect(() => {
    if (!fecha || !simuladorId) return
    const fetchHorasOcupadas = async () => {
      const { data } = await supabase
        .from('turnos')
        .select('hora_inicio')
        .eq('simulador_id', Number(simuladorId))
        .eq('fecha', fecha)
      if (data) setHorasOcupadas(data.map((t) => t.hora_inicio.slice(0, 5)))
    }
    fetchHorasOcupadas()
    setHoraSeleccionada('')
  }, [fecha, simuladorId])

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
    const { data: turnoCreado, error: errorTurno } = await supabase.from('turnos').insert({
      simulador_id: Number(simuladorId),
      cliente_id: clienteId,
      fecha,
      hora_inicio: horaSeleccionada,
      hora_fin: horaFin,
    }).select('cancel_token').single()
    if (errorTurno || !turnoCreado) { alert('Error al guardar el turno'); setCargando(false); return }
    router.push('/confirmado?token=' + turnoCreado.cancel_token)
  }

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
        <p className="text-xs tracking-[0.4em] uppercase text-red-500 mb-2">Reserva</p>
        <h2 className="text-4xl font-black uppercase mb-1">Simulador {simuladorId}</h2>
        <p className="text-gray-600 text-sm mb-10">Turnos de 60 min · 15:00 a 02:00</p>

        <div className="mb-8">
          <label className="block text-xs uppercase tracking-widest text-gray-500 mb-3">Fecha</label>
          <input type="date" className="bg-white/5 border border-white/10 rounded-xl p-4 w-full text-white focus:border-red-500 outline-none text-sm" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>

        {fecha && (
          <div className="mb-8">
            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-3">Horario disponible</label>
            <div className="grid grid-cols-4 gap-2">
              {HORARIOS.map((hora) => {
                const ocupado = horasOcupadas.includes(hora)
                const seleccionado = horaSeleccionada === hora
                return (
                  <button key={hora} onClick={() => !ocupado && setHoraSeleccionada(hora)} disabled={ocupado}
                    className={'rounded-xl py-3 text-center text-sm font-medium transition border ' +
                      (ocupado ? 'border-white/5 text-gray-700 cursor-not-allowed line-through ' : '') +
                      (seleccionado ? 'border-red-500 bg-red-500/10 text-red-400 ' : '') +
                      (!ocupado && !seleccionado ? 'border-white/10 hover:border-red-500 hover:text-red-400 text-gray-300' : '')}>
                    {hora}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {horaSeleccionada && (
          <div className="mb-8 border border-white/10 rounded-xl p-6">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-4">Tus datos</p>
            <div className="mb-4">
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Nombre</label>
              <input type="text" className="bg-white/5 border border-white/10 rounded-xl p-3 w-full text-white focus:border-red-500 outline-none text-sm" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan Perez" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Telefono</label>
              <input type="tel" className="bg-white/5 border border-white/10 rounded-xl p-3 w-full text-white focus:border-red-500 outline-none text-sm" value={telefono} onChange={(e) => setTelefono(e.target.value.replace(/[^0-9]/g, ''))} placeholder="11 1234-5678" />
            </div>
          </div>
        )}

        {nombre && telefono && (
          <button onClick={confirmarReserva} disabled={cargando} className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl p-4 font-black uppercase tracking-widest transition disabled:opacity-50 text-sm">
            {cargando ? 'Guardando...' : 'Confirmar reserva'}
          </button>
        )}
      </div>
    </main>
  )
}
