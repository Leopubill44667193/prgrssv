'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function Confirmado() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const cancelUrl = window.location.origin + '/cancelar/' + token

  return (
    <main className="min-h-screen bg-black text-white p-8 max-w-lg mx-auto text-center mt-20">
      <div className="text-6xl mb-6">🏁</div>
      <h1 className="text-4xl font-black uppercase mb-2">Turno confirmado</h1>
      <p className="text-red-500 text-sm tracking-widest uppercase mb-8">OC.Hobbies.Racing · Av. 3 de Febrero 283</p>
      <div className="border border-white/10 rounded-xl p-4 mb-6 text-left">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Link de cancelacion</p>
        <p className="break-all text-sm text-gray-400">{cancelUrl}</p>
      </div>
      <a href={cancelUrl} className="text-red-500 text-sm underline block mb-4">
        Cancelar mi turno
      </a>
      <a href="/" className="text-gray-600 text-sm underline">
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
