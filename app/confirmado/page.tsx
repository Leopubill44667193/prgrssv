'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function Confirmado() {
  const searchParams = useSearchParams()
  const tokens = (searchParams.get('tokens') ?? searchParams.get('token') ?? '').split(',').filter(Boolean)
  const fecha = searchParams.get('fecha') ?? ''
  const hora = searchParams.get('hora') ?? ''
  const simus = (searchParams.get('simus') ?? '').split(',').filter(Boolean)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const fechaFormateada = fecha
    ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    : ''

  const waTexto = encodeURIComponent(
    `Reserva OC.Hobbies.Racing\n📅 ${fechaFormateada}\n⏰ ${hora} hs\n🏎 Simulador${simus.length > 1 ? 'es' : ''} ${simus.join(', ')}\n\nLinks de cancelación:\n` +
    tokens.map((t, i) => `Sim ${simus[i] ?? i + 1}: ${origin}/cancelar/${t}`).join('\n')
  )

  return (
    <main className="min-h-screen bg-black text-white p-8 max-w-lg mx-auto mt-12">
      <div className="text-center mb-10">
        <div className="text-6xl mb-5">🏁</div>
        <h1 className="text-4xl font-black uppercase mb-2">
          {tokens.length === 1 ? 'Turno confirmado' : 'Turnos confirmados'}
        </h1>
        <p className="text-red-500 text-xs tracking-widest uppercase">OC.Hobbies.Racing · Av. 3 de Febrero 283</p>
      </div>

      {/* Resumen */}
      {fecha && hora && (
        <div className="border border-white/10 rounded-xl p-5 mb-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">Fecha</p>
            <p className="text-sm font-medium capitalize">{fechaFormateada}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">Horario</p>
            <p className="text-sm font-medium">{hora} hs</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">
              {simus.length === 1 ? 'Simulador' : 'Simuladores'}
            </p>
            <p className="text-sm font-medium">{simus.map((s) => `Sim ${s}`).join(' · ')}</p>
          </div>
        </div>
      )}

      {/* Links de cancelación */}
      <div className="border border-white/10 rounded-xl p-5 mb-4">
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">
          {tokens.length === 1 ? 'Link de cancelación' : 'Links de cancelación'}
        </p>
        <div className="space-y-3">
          {tokens.map((token, i) => {
            const cancelUrl = origin + '/cancelar/' + token
            return (
              <div key={token} className={tokens.length > 1 && i < tokens.length - 1 ? 'pb-3 border-b border-white/5' : ''}>
                {tokens.length > 1 && (
                  <p className="text-xs text-gray-700 mb-1 uppercase tracking-widest">Sim {simus[i] ?? i + 1}</p>
                )}
                <p className="break-all text-xs text-gray-500 mb-1">{cancelUrl}</p>
                <a href={cancelUrl} className="text-red-500 text-xs underline">Cancelar este turno</a>
              </div>
            )
          })}
        </div>
      </div>

      {/* WhatsApp */}
      <a
        href={`https://wa.me/?text=${waTexto}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full border border-green-600/40 hover:border-green-500 hover:bg-green-500/5 text-green-500 rounded-xl p-4 text-sm font-bold uppercase tracking-widest transition mb-4"
      >
        <span>Compartir por WhatsApp</span>
      </a>

      <a href="/" className="block text-center text-gray-600 text-sm underline">
        Volver al inicio
      </a>
    </main>
  )
}

export default function ConfirmadoPage() {
  return (
    <Suspense>
      <Confirmado />
    </Suspense>
  )
}
