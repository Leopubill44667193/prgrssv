import Link from 'next/link'

const simuladores = [
  { id: 1, nombre: 'Simulador 1' },
  { id: 2, nombre: 'Simulador 2' },
  { id: 3, nombre: 'Simulador 3' },
  { id: 4, nombre: 'Simulador 4' },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
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
      <div className="px-8 pt-20 pb-12 text-center">
        <p className="text-xs tracking-[0.4em] uppercase text-red-500 mb-4">En linea</p>
        <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tight leading-none">
          Reserva tu<br />
          <span className="text-red-500">turno</span>
        </h2>
        <p className="text-gray-600 mt-5 text-sm tracking-wide">4 simuladores · Turnos de 60 min</p>
      </div>
      <div className="px-8 pb-20 grid grid-cols-2 gap-3 max-w-2xl mx-auto">
        {simuladores.map((sim) => (
          <Link key={sim.id} href={`/reservar/${sim.id}`} className="group border border-white/10 rounded-2xl p-6 hover:border-red-500 hover:bg-red-500/5 transition-all duration-200">
            <div className="text-4xl font-black text-white/10 group-hover:text-red-500/30 transition-colors mb-4 leading-none">
              0{sim.id}
            </div>
            <h3 className="text-sm font-bold tracking-widest uppercase group-hover:text-red-400 transition-colors">
              {sim.nombre}
            </h3>
            <p className="text-xs text-gray-600 mt-1 group-hover:text-gray-500 transition-colors">
              Ver disponibilidad
            </p>
          </Link>
        ))}
      </div>
      <div className="border-t border-white/5 px-8 py-6 text-center">
        <p className="text-xs text-gray-700 tracking-widest uppercase">OC.Hobbies.Racing · Rosario</p>
      </div>
    </main>
  )
}
