import type { NegocioConfig } from '@/lib/config'
import simTurnos from './sim-turnos'
import prgrssv from './prgrssv'

// Agregá nuevos negocios acá
const configs: Record<string, NegocioConfig> = {
  'sim-turnos': simTurnos,
  'prgrssv': prgrssv,
}

const id = process.env.NEXT_PUBLIC_NEGOCIO_ID ?? 'sim-turnos'

export const negocio: NegocioConfig = configs[id] ?? simTurnos
