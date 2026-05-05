'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { negocio } from '@/config'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [cargando, setCargando] = useState(false)
  const router = useRouter()

  async function login() {
    setCargando(true)
    setError(false)
    const res = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      setError(true)
      setPassword('')
      setCargando(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-white flex items-center justify-center px-8">
      <div className="w-full max-w-sm">
        <p className="text-xs tracking-[0.4em] uppercase text-[var(--accent)] mb-2 text-center">Panel</p>
        <h1 className="text-3xl font-black uppercase text-center mb-10">{negocio.nombre}</h1>
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false) }}
          onKeyDown={(e) => e.key === 'Enter' && !cargando && login()}
          className={'bg-white/5 border rounded-xl p-4 w-full text-white outline-none text-sm mb-3 ' + (error ? 'border-[var(--accent)]' : 'border-white/10 focus:border-[var(--accent)]')}
          autoFocus
        />
        {error && <p className="text-[var(--accent)] text-xs mb-3 tracking-widest uppercase">Contraseña incorrecta</p>}
        <button
          onClick={login}
          disabled={cargando}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl p-4 font-black uppercase tracking-widest transition text-sm disabled:opacity-50"
        >
          {cargando ? 'Verificando...' : 'Entrar'}
        </button>
      </div>
    </main>
  )
}
