import Link from 'next/link'
import { negocio } from '@/config'
import { formatHora, formatDiasHabiles } from '@/lib/config'

function LandingPage() {
  const negocios = [
    {
      emoji: '🎾',
      nombre: 'La Cancha Padel',
      ubicacion: 'Rojas, Buenos Aires',
      url: 'https://lacancha.reservaturnos.com.ar',
    },
    {
      emoji: '🏎️',
      nombre: 'OC Hobbies Racing',
      ubicacion: 'Rojas, Buenos Aires',
      url: 'https://ochobbies.reservaturnos.com.ar',
    },
    {
      emoji: '✂️',
      nombre: 'Prgrssv',
      ubicacion: 'Rosario, Santa Fe',
      url: 'https://prgrssv.reservaturnos.com.ar',
    },
  ]

  return (
    <main className="min-h-screen bg-[var(--bg)] text-white flex flex-col">
      <div className="border-b border-white/10 px-8 py-5">
        <h1 className="text-xl font-black tracking-widest uppercase">
          <span className="text-[var(--accent)]">Reserva</span> Turnos
        </h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 py-20 text-center">
        <p className="text-xs tracking-[0.4em] uppercase text-[var(--accent)] mb-6 flex items-center justify-center gap-3">
          <span className="inline-block w-6 h-px bg-[var(--accent)]" />
          Sistema de reservas online
          <span className="inline-block w-6 h-px bg-[var(--accent)]" />
        </p>
        <h2 className="text-7xl md:text-8xl font-black uppercase tracking-tight leading-none mb-4">
          Reserva<br />
          <span className="text-[var(--accent)]">Turnos</span>
        </h2>
        <p className="text-gray-400 text-sm tracking-wide mb-16 max-w-md">
          Sistema de reservas online para negocios en Argentina
        </p>

        <div className="w-full max-w-lg mb-16">
          <p className="text-xs tracking-[0.3em] uppercase text-gray-500 mb-6">Negocios que usan Reserva Turnos</p>
          <div className="flex flex-col gap-3">
            {negocios.map((n) => (
              <a
                key={n.url}
                href={n.url}
                className="flex items-center gap-4 border border-white/10 rounded-xl px-5 py-4 hover:border-[var(--accent)]/50 hover:bg-white/5 transition text-left"
              >
                <span className="text-2xl">{n.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm tracking-wide">{n.nombre}</p>
                  <p className="text-xs text-gray-500">{n.ubicacion}</p>
                </div>
                <span className="text-[var(--accent)] text-xs tracking-widest uppercase">Reservar →</span>
              </a>
            ))}
          </div>
        </div>

        <div className="border border-white/10 rounded-2xl px-8 py-7 max-w-sm w-full text-center">
          <p className="text-sm font-bold mb-1">¿Querés sumar tu negocio?</p>
          <p className="text-xs text-gray-500 mb-5">Sumá tu negocio y empezá a recibir reservas online hoy.</p>
          <a
            href="https://wa.me/5492474470920"
            className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl px-8 py-3 font-black uppercase tracking-widest transition text-xs"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </div>

      <div className="border-t border-white/5 px-8 py-6 text-center">
        <p className="text-xs text-gray-700 tracking-widest uppercase">Reserva Turnos · Argentina</p>
      </div>
    </main>
  )
}

export default function Home() {
  if (negocio.id === 'landing') return <LandingPage />

  const horaInicio = formatHora(negocio.horario.inicioMin)
  const horaFin = formatHora(negocio.horario.finMin)

  return (
    <main className="min-h-screen bg-[var(--bg)] text-white flex flex-col">
      <div className="border-b border-white/10 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-widest uppercase">
            <span className="text-[var(--accent)]">{negocio.nombreDisplay?.parte1 ?? negocio.nombre.split('.')[0] + '.'}</span>
            {negocio.nombreDisplay ? negocio.nombreDisplay.parte2 : negocio.nombre.split('.').slice(1).join('.')}
          </h1>
          <p className="text-xs text-gray-600 tracking-wider uppercase mt-0.5">{negocio.direccion}</p>
        </div>
        <div className="text-xs text-gray-600 tracking-widest uppercase text-right">
          <div>{horaInicio} - {horaFin}</div>
          <div>{formatDiasHabiles(negocio.diasHabiles)}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 py-20 text-center">
        <p className="text-xs tracking-[0.4em] uppercase text-[var(--accent)] mb-6 flex items-center justify-center gap-3">
          <span className="inline-block w-6 h-px bg-[var(--accent)]" />
          Reservas en linea
          <span className="inline-block w-6 h-px bg-[var(--accent)]" />
        </p>
        <h2
          className="text-7xl md:text-8xl font-black uppercase tracking-tight leading-none mb-4"
          style={{
            fontFamily: "var(--font-title, inherit)",
            ...(negocio.fontTitle && { fontWeight: "normal", letterSpacing: "0.04em" }),
          }}
        >
          Reservá tu<br />
          <span className="text-[var(--accent)]">{negocio.recursoNombre.toLowerCase()}</span>
        </h2>
        <p className="text-gray-600 text-sm tracking-wide mb-12">
          {negocio.recursos.length} {negocio.recursoNombrePlural.toLowerCase()} · Turnos de {negocio.duracionMinutos} min · Reservá tu {negocio.recursoNombre.toLowerCase()}
        </p>
        <Link href="/reservar" className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-2xl px-12 py-5 font-black uppercase tracking-widest transition text-sm">
          Reservar ahora
        </Link>
        <Link href="/mis-turnos" className="mt-4 text-gray-600 hover:text-gray-400 text-xs tracking-widest uppercase underline transition">
          Ver mis turnos
        </Link>
      </div>

      <div className="border-t border-white/5 px-8 py-6 text-center">
        <p className="text-xs text-gray-700 tracking-widest uppercase">{negocio.nombre} · {negocio.direccion.split('·').pop()?.trim()}</p>
      </div>
    </main>
  )
}
