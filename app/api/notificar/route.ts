import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const phone = process.env.CALLMEBOT_PHONE
  const apikey = process.env.CALLMEBOT_APIKEY

  if (!phone || !apikey) {
    return NextResponse.json({ error: 'CallMeBot no configurado' }, { status: 500 })
  }

  const { mensaje } = await req.json()
  if (!mensaje) {
    return NextResponse.json({ error: 'Falta mensaje' }, { status: 400 })
  }

  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(mensaje)}&apikey=${apikey}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      return NextResponse.json({ error: 'CallMeBot error', status: res.status }, { status: 502 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Error de red' }, { status: 502 })
  }
}
