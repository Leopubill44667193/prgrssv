import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <div className="border-b border-white/10 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-widest uppercase">
            <span className="text-red-500">OC.</span>Hobbies.Racing
          </h1>
          <p className="text-xs text-gray-600 tracking-wider uppercase mt-0.5">Av. 3 de Febrero 283 · Rosario</p>
        </div>
        <div className="text-xs text-gray-600 tracking-widest uppercase text-right">
          <div>15:00 - 02:00</div>
          <div>Todos los dias</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 py-20 text-center">
        <p className="text-xs tracking-[0.4em] uppercase text-red-500 mb-6">Reservas en linea</p>
        <h2 className="text-6xl md:text-7xl font-black uppercase tracking-tight leading-none mb-4">
          Reserva tu<br />
          <span className="text-red-500">turno</span>
        </h2>
        <p className="text-gray-600 text-sm tracking-wide mb-12">4 simuladores · Turnos de 60 min · Elegí tu butaca</p>
        <Link href="/reservar" className="bg-red-500 hover:bg-red-600 text-white rounded-2xl px-12 py-5 font-black uppercase tracking-widest transition text-sm">
          Reservar ahora
        </Link>
      </div>

      <div className="border-t border-white/5 px-8 py-6 text-center">
        <p className="text-xs text-gray-700 tracking-widest uppercase">OC.Hobbies.Racing · Rosario</p>
      </div>
    </main>
  )
}
