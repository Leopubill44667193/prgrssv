import { NextRequest, NextResponse } from 'next/server'

async function enviarWhatsApp(phone: string, apikey: string, mensaje: string) {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(mensaje)}&apikey=${apikey}`
  const res = await fetch(url)
  return res.ok
}

export async function POST(req: NextRequest) {
  const phone1 = process.env.CALLMEBOT_PHONE
  const apikey1 = process.env.CALLMEBOT_APIKEY
  const phone2 = process.env.CALLMEBOT_PHONE_2
  const apikey2 = process.env.CALLMEBOT_APIKEY_2

  if (!phone1 || !apikey1) {
    return NextResponse.json({ error: 'CallMeBot no configurado' }, { status: 500 })
  }

  const { mensaje } = await req.json()
  if (!mensaje) {
    return NextResponse.json({ error: 'Falta mensaje' }, { status: 400 })
  }

  try {
    const promesas = [enviarWhatsApp(phone1, apikey1, mensaje)]
    if (phone2 && apikey2) promesas.push(enviarWhatsApp(phone2, apikey2, mensaje))
    await Promise.all(promesas)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Error de red' }, { status: 502 })
  }
}
