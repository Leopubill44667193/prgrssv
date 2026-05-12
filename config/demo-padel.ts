import type { NegocioConfig } from '@/lib/config'

const config: NegocioConfig = {
  id: 'demo-padel',
  nombre: 'Club Demo Pádel',
  nombreDisplay: { parte1: 'Club Demo', parte2: ' Pádel' },
  direccion: 'Av. Siempreviva 742, Rosario',
  horario: {
    inicioMin: 9 * 60,
    finMin: 24 * 60,
    intervaloMinutos: 90,
  },
  recursos: [
    { id: 1, nombre: 'Cancha 1' },
    { id: 2, nombre: 'Cancha 2' },
    { id: 3, nombre: 'Cancha 3' },
    { id: 4, nombre: 'Cancha 4 (Blindex)' },
  ],
  recursoNombre: 'Cancha',
  recursoNombrePlural: 'Canchas',
  duracionMinutos: 90,
  adminPassword: 'demo',
  emoji: '🎾',
  seleccionSimple: true,
  tema: { accent: '#16a34a', accentHover: '#15803d', bg: '#0a0a0a' },
  cancelacionMinHs: 2,
}

export default config
