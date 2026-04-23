import type { NegocioConfig } from '@/lib/config'

const config: NegocioConfig = {
  id: 'lacancha',
  nombre: 'La Cancha Padel',
  nombreDisplay: { parte1: 'La Cancha Padel' },
  direccion: 'Av. 20 de Diciembre 130 · Rojas',
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
  adminPassword: 'lacancha',
  emoji: '🎾',
  seleccionSimple: true,
  tema: { accent: '#22c55e', accentHover: '#16a34a', bg: '#0c1a10' },
  features: { multiRecurso: true },
  cancelacionMinHs: 3,
  whatsappNegocio: '5492474470920',
  fontTitle: 'Bebas Neue',
  bgTexture: 'grid',
}

export default config
