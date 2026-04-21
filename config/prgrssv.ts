import type { NegocioConfig } from '@/lib/config'

const config: NegocioConfig = {
  id: 'prgrssv',
  nombre: 'Prgrssv',
  nombreDisplay: { parte1: 'Prgrssv' },
  direccion: 'Zeballos 2239 6A · Rosario',
  horario: {
    inicioMin: 9 * 60,          // 09:00
    finMin: 19 * 60 + 30,       // 19:30 (último turno a las 19:00)
    intervaloMinutos: 30,
  },
  diasHabiles: [1, 2, 3, 4, 5], // Lunes a Viernes
  recursos: [
    { id: 1, nombre: 'Eugenio Dorrigo' },
  ],
  recursoNombre: 'Peluquero',
  recursoNombrePlural: 'Peluqueros',
  duracionMinutos: 30,
  adminPassword: 'guyj',
  emoji: '✂️',
  seleccionSimple: true,
  tema: { accent: '#eab308', accentHover: '#ca8a04', bg: '#000000' },
  features: { multiRecurso: false },
}

export default config
