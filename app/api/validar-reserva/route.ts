import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { configs } from '@/config'

const TELEFONO_AR = /^\d{10,11}$/
const SOLO_LETRAS = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]+$/
const VOCALES = /[aeiouáéíóúAEIOUÁÉÍÓÚ]/
const NOMBRE_BLACKLIST = new Set([
  'test', 'prueba', 'asd', 'asdf', 'xxx', 'admin', 'null', 'undefined',
  'nombre', 'user', 'cliente', 'nobody', 'fake', 'anonymous',
])
const PARTICULAS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'da', 'do', 'dos'])

function validarNombre(nombre: string): string | null {
  const partes = nombre.trim().split(/\s+/)
  if (partes.length < 2 || partes.length > 4)
    return 'Ingresá tu nombre y apellido (ej: Juan Pérez)'

  let partesReales = 0
  for (const parte of partes) {
    if (!SOLO_LETRAS.test(parte)) return 'El nombre ingresado no es válido'
    if (PARTICULAS.has(parte.toLowerCase())) continue
    partesReales++
    if (parte.length < 3 || parte.length > 15) return 'El nombre ingresado no es válido'
    if (!VOCALES.test(parte)) return 'El nombre ingresado no es válido'
    if (parte.split('').every(c => c.toLowerCase() === parte[0].toLowerCase())) return 'El nombre ingresado no es válido'
    if (NOMBRE_BLACKLIST.has(parte.toLowerCase())) return 'El nombre ingresado no es válido'
  }

  if (partesReales < 2) return 'Ingresá tu nombre y apellido (ej: Juan Pérez)'

  return null
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (
    !body ||
    typeof body.negocio_id !== 'string' ||
    typeof body.telefono !== 'string' ||
    typeof body.nombre !== 'string'
  ) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const { negocio_id, telefono, nombre } = body as { negocio_id: string; telefono: string; nombre: string }

  const errorNombre = validarNombre(nombre)
  if (errorNombre) {
    return NextResponse.json({ error: errorNombre }, { status: 400 })
  }

  if (!TELEFONO_AR.test(telefono)) {
    return NextResponse.json({ error: 'Teléfono inválido. Ingresá solo números, sin 0 ni 15, mínimo 10 dígitos.' }, { status: 400 })
  }

  const config = configs[negocio_id]
  if (!config) {
    return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 400 })
  }

  const limite = config.features?.limiteReservasPorIP
  if (limite !== undefined) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown'

    const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count, error: errorCount } = await supabase
      .from('reservas_por_ip')
      .select('id', { count: 'exact', head: true })
      .eq('negocio_id', negocio_id)
      .eq('ip', ip)
      .gte('created_at', desde)

    if (errorCount) {
      console.error('[validar-reserva] errorCount:', errorCount)
      return NextResponse.json({ error: 'Error al verificar el límite de reservas' }, { status: 500 })
    }

    if ((count ?? 0) >= limite) {
      return NextResponse.json(
        { error: 'Límite alcanzado, contactanos por WhatsApp' },
        { status: 429 }
      )
    }

    const { error: errorInsert } = await supabase
      .from('reservas_por_ip')
      .insert({ negocio_id, ip })

    if (errorInsert) {
      console.error('[validar-reserva] errorInsert:', errorInsert)
      return NextResponse.json({ error: 'Error al registrar la reserva' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
