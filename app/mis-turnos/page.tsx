'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Turno = {
  id: string
  cancel_token: string
  fecha: string
  hora_inicio: string
  simulador_id: number
}

export default function MisTurnosPage() {
  const [telefono, setTelefono] = useState('')
  const [nombre, setNombre] = useState<string | null>(null)
  const [turnos, setTurnos] = useState<Turno[] | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [noEncontrado, setNoEncontrado] = useState(false)

  async function buscar() {
    setBuscando(true)
    setNoEncontrado(false)
    setTurnos(null)
    setNombre(null)

    const { data: cliente } = await supabase
      .from('clientes')
      .select('id, nombre')
      .eq('telefono', telefono)
      .single()

    if (!cliente) {
      setNoEncontrado(true)
      setBuscando(false)
      return
    }

    setNombre(cliente.nombre)

    const hoy = new Date().toISOString().split('T')[0]

    const { data } = await supabase
      .from('turnos')
      .select('id, cancel_token, fecha, hora_inicio, simulador_id')
      .eq('cliente_id', cliente.id)
      .gte('fecha', hoy)
      .order('fecha')
      .order('hora_inicio')

    setTurnos(data && data.length > 0 ? data : [])
    setBuscando(false)
  }

  function formatearFecha(fecha: string) {
    return new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long'
    })
  }

  return (
    <main className="min-h-screen bg-black text-white p-8 max-w-lg mx-auto">
      <div className="mt-12 mb-10">
        <p className="text-xs tracking-[0.4em] uppercase text-red-500 mb-3">OC.Hobbies.Racing</p>
        <h1 className="text-4xl font-black uppercase tracking-tight">Mis<br /><span className="text-red-500">turnos</span></h1>
      </div>

      <div className="mb-8">
        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Tu numero de telefono</label>
        <div className="flex gap-2">
          <input
            type="tel"
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && telefono && !buscando && buscar()}
            placeholder="Ej: 2475123456"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:outline-none focus:border-red-500"
          />
          <button
            onClick={buscar}
            disabled={buscando || !telefono}
            className="bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest transition text-sm"
          >
            {buscando ? '...' : 'Buscar'}
          </button>
        </div>
      </div>

      {noEncontrado && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm mb-6">No encontramos reservas con ese telefono.</p>
          <Link
            href="/reservar"
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest transition text-sm"
          >
            Reservar ahora
          </Link>
        </div>
      )}

      {nombre && turnos !== null && turnos.length === 0 && (
        <div className="text-center py-8">
          <p className="text-white font-bold mb-1">Hola, {nombre}</p>
          <p className="text-gray-500 text-sm mb-6">No tenes turnos proximos.</p>
          <Link
            href="/reservar"
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest transition text-sm"
          >
            Reservar ahora
          </Link>
        </div>
      )}

      {nombre && turnos && turnos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-widest text-gray-500">Tus proximas reservas</p>
            <p className="text-sm font-bold text-white">Hola, {nombre}</p>
          </div>
          {turnos.map(t => (
            <div key={t.id} className="border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="font-bold capitalize">{formatearFecha(t.fecha)}</p>
                <p className="text-gray-400 text-sm">{t.hora_inicio.slice(0, 5)} hs · Simulador {t.simulador_id}</p>
              </div>
              <Link
                href={`/cancelar/${t.cancel_token}`}
                className="bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 text-red-400 hover:text-red-300 px-4 py-2 rounded-xl text-xs uppercase tracking-widest font-bold transition"
              >
                Cancelar
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <Link href="/" className="text-gray-700 hover:text-gray-500 text-xs tracking-widest uppercase underline transition">
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}
