import type { NegocioConfig } from '@/lib/config'

const config: NegocioConfig = {
  id: 'landing',
  nombre: 'ReservaTurnos',
  nombreDisplay: { parte1: 'Reserva', parte2: 'Turnos' },
  direccion: 'Argentina',
  horario: { inicioMin: 0, finMin: 24 * 60, intervaloMinutos: 60 },
  recursos: [{ id: 1, nombre: 'Recurso' }],
  recursoNombre: 'Turno',
  recursoNombrePlural: 'Turnos',
  duracionMinutos: 60,
  adminPassword: 'landing',
  emoji: '📅',
  tema: { accent: '#22c55e', accentHover: '#16a34a', bg: '#0c1a10' },
}

export default config
