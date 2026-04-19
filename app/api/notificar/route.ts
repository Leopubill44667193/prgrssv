import { NextRequest, NextResponse } from 'next/server'

async function enviarWhatsApp(to: string, mensaje: string, sid: string, token: string, from: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
  const body = new URLSearchParams({ To: to, From: from, Body: mensaje })
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })
  return res.ok
}

export async function POST(req: NextRequest) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM
  const to1 = process.env.TWILIO_TO_1
  const to2 = process.env.TWILIO_TO_2

  if (!sid || !token || !from || !to1) {
    return NextResponse.json({ error: 'Twilio no configurado' }, { status: 500 })
  }

  const { mensaje } = await req.json()
  if (!mensaje) {
    return NextResponse.json({ error: 'Falta mensaje' }, { status: 400 })
  }

  try {
    const promesas = [enviarWhatsApp(to1, mensaje, sid, token, from)]
    if (to2) promesas.push(enviarWhatsApp(to2, mensaje, sid, token, from))
    await Promise.all(promesas)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Error de red' }, { status: 502 })
  }
}
