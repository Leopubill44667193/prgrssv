import type { NegocioConfig } from '@/lib/config'

const config: NegocioConfig = {
  id: 'sim-turnos',
  nombre: 'OC.Hobbies.Racing',
  direccion: 'Av. 3 de Febrero 283 · Rojas',
  horario: { inicio: 15, fin: 26 },  // 15:00 a 02:00 (26 = 24 + 2)
  recursos: [
    { id: 1, nombre: 'Simulador 1' },
    { id: 2, nombre: 'Simulador 2' },
    { id: 3, nombre: 'Simulador 3' },
    { id: 4, nombre: 'Simulador 4' },
  ],
  recursoNombre: 'Simulador',
  duracionMinutos: 60,
  adminPassword: 'racing2025',
}

export default config
