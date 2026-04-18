export type NegocioConfig = {
  id: string
  nombre: string           // "OC.Hobbies.Racing"
  direccion: string        // "Av. 3 de Febrero 283 · Rojas"
  horario: {
    inicio: number         // hora en 24h, ej: 15
    fin: number            // puede superar 24 si cruza medianoche, ej: 26 = 02:00
  }
  recursos: { id: number; nombre: string }[]
  recursoNombre: string    // singular: "Simulador", "Cancha", "Máquina"
  duracionMinutos: number
  adminPassword: string
}

/** Genera el array de horarios a partir del rango del negocio.
 *  ej: inicio=15, fin=26 → ['15:00', ..., '23:00', '00:00', '01:00'] */
export function generarHorarios(inicio: number, fin: number): string[] {
  const horarios: string[] = []
  for (let h = inicio; h < fin; h++) {
    horarios.push(String(h % 24).padStart(2, '0') + ':00')
  }
  return horarios
}

/** Formatea una hora numérica como string.
 *  ej: 15 → "15:00", 26 → "02:00" */
export function formatHora(h: number): string {
  return String(h % 24).padStart(2, '0') + ':00'
}

/** Umbral para la lógica de horas post-medianoche.
 *  Si fin > 24, hay horas que cruzan la medianoche (ej: 00:00, 01:00).
 *  El umbral es cuántas horas se pasan de las 00:00 + 1. */
export function calcularUmbral(fin: number): number {
  return fin > 24 ? fin - 24 + 1 : 0
}

/** Determina si un slot de hora es válido para reservar en la fecha dada.
 *  Bloquea horarios ya pasados del día actual, respetando el cruce de medianoche. */
export function horaValida(hora: string, fecha: string, umbral: number): boolean {
  if (fecha !== new Date().toLocaleDateString('en-CA')) return true
  const horaActual = new Date().getHours()
  const h = parseInt(hora)
  if (umbral === 0) return h > horaActual
  if (horaActual < umbral) return h >= umbral || h > horaActual
  return h < umbral || h > horaActual
}
