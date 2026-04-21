import type { NegocioConfig } from '@/lib/config'

const config: NegocioConfig = {
  id: 'sim-turnos',
  nombre: 'OC.Hobbies.Racing',
  nombreDisplay: { parte1: 'OC.', parte2: 'Hobbies.Racing' },
  direccion: 'Av. 3 de Febrero 283 · Rojas',
  horario: {
    inicioMin: 15 * 60,       // 15:00
    finMin: 26 * 60,          // 02:00 del día siguiente
    intervaloMinutos: 60,
  },
  // diasHabiles no definido = todos los días
  recursos: [
    { id: 1, nombre: 'Simulador 1' },
    { id: 2, nombre: 'Simulador 2' },
    { id: 3, nombre: 'Simulador 3' },
    { id: 4, nombre: 'Simulador 4' },
  ],
  recursoNombre: 'Simulador',
  recursoNombrePlural: 'Simuladores',
  duracionMinutos: 60,
  adminPassword: 'racing2025',
  tema: { accent: '#ef4444', accentHover: '#dc2626', bg: '#000000' },
  features: { multiRecurso: true },
}

export default config
