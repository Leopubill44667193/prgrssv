'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function CancelarPage({ params }: { params: Promise<{ token: string }> }) {
  const [estado, setEstado] = useState<'cargando' | 'confirmando' | 'cancelado' | 'error'>('cargando')
  const [token, setToken] = useState<string>('')

  useEffect(() => {
    params.then((p) => {
      setToken(p.token)
      setEstado('confirmando')
    })
  }, [params])

  async function cancelarTurno() {
    setEstado('cargando')
    const { data: turno } = await supabase
      .from('turnos')
      .select('fecha, hora_inicio, simulador_id, clientes ( nombre, telefono )')
      .eq('cancel_token', token)
      .single()
    const { error } = await supabase.from('turnos').delete().eq('cancel_token', token)
    if (error) { setEstado('error'); return }
    setEstado('cancelado')
    if (turno) {
      const fechaFmt = new Date(turno.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
      const cliente = (turno as any).clientes
      const clienteInfo = cliente ? `
👤 ${cliente.nombre}
📱 ${cliente.telefono}` : ''
      const mensaje = `❌ Turno cancelado
📅 ${fechaFmt}
⏰ ${turno.hora_inicio.slice(0, 5)} hs
🏎 Simulador ${turno.simulador_id}${clienteInfo}`
      await fetch('/api/notificar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mensaje }) })
    }
  }

  if (estado === 'cargando') return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-gray-500 tracking-widest uppercase text-sm">Cargando...</p>
    </main>
  )

  if (estado === 'cancelado') return (
    <main className="min-h-screen bg-black text-white p-8 max-w-lg mx-auto text-center mt-20">
      <div className="text-6xl mb-6">✓</div>
      <h1 className="text-4xl font-black uppercase mb-4">Turno cancelado</h1>
      <p className="text-gray-500 mb-8">Tu turno fue cancelado correctamente.</p>
      <a href="/" className="text-red-500 underline text-sm">Volver al inicio</a>
    </main>
  )

  if (estado === 'error') return (
    <main className="min-h-screen bg-black text-white p-8 max-w-lg mx-auto text-center mt-20">
      <div className="text-6xl mb-6">✗</div>
      <h1 className="text-4xl font-black uppercase mb-4">Error</h1>
      <p className="text-gray-500">No pudimos cancelar el turno. Es posible que ya haya sido cancelado.</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-black text-white p-8 max-w-lg mx-auto text-center mt-20">
      <div className="text-6xl mb-6">⚠️</div>
      <h1 className="text-4xl font-black uppercase mb-4">Cancelar turno</h1>
      <p className="text-gray-500 mb-8">Esta accion no se puede deshacer.</p>
      <button onClick={cancelarTurno} className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest transition mb-4 block w-full">
        Si, cancelar
      </button>
      <a href="/" className="text-gray-600 underline text-sm">No, volver al inicio</a>
    </main>
  )
}
