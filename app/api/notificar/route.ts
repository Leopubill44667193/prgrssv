import { NextRequest, NextResponse } from 'next/server'

async function enviarTemplate(
  to: string,
  contentSid: string,
  contentVariables: Record<string, string>,
  sid: string,
  token: string,
  from: string,
) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
  const body = new URLSearchParams({
    To: to,
    From: from,
    ContentSid: contentSid,
    ContentVariables: JSON.stringify(contentVariables),
  })
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })
  if (!res.ok) {
    const data = await res.json()
    console.error('Twilio error', to, data)
  }
  return res.ok
}

export async function POST(req: NextRequest) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM
  const tosAdmin = [1, 2, 3, 4, 5]
    .map(i => process.env[`TWILIO_TO_${i}`])
    .filter((v): v is string => !!v && v.trim() !== '')

  if (!sid || !token || !from || tosAdmin.length === 0) {
    return NextResponse.json({ error: 'Twilio no configurado' }, { status: 500 })
  }

  const { tipo, fechaHora, turno, nombreCliente, telefonoCliente, direccion, linkCancelacion, linkNegocio } = await req.json()

  if (!tipo || !fechaHora || !turno || !nombreCliente || !telefonoCliente) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const sidAdmin = tipo === 'confirmacion'
    ? process.env.TWILIO_CONTENT_SID_CONFIRMACION_ADMIN
    : process.env.TWILIO_CONTENT_SID_CANCELACION_ADMIN

  const sidCliente = tipo === 'confirmacion'
    ? process.env.TWILIO_CONTENT_SID_CONFIRMACION_CLIENTE
    : process.env.TWILIO_CONTENT_SID_CANCELACION_CLIENTE

  if (!sidAdmin || !sidCliente) {
    return NextResponse.json({ error: 'Content SIDs no configurados' }, { status: 500 })
  }

  const varsAdmin: Record<string, string> = {
    '1': fechaHora,
    '2': turno,
    '3': nombreCliente,
    '4': telefonoCliente,
  }

  const varsCliente: Record<string, string> = tipo === 'confirmacion'
    ? { '1': fechaHora, '2': turno, '3': direccion ?? '', '4': linkCancelacion ?? '' }
    : { '1': fechaHora, '2': turno, '3': direccion ?? '', '4': linkNegocio ?? '' }

  const toCliente = `whatsapp:+549${telefonoCliente}`

  try {
    const promesas: Promise<boolean>[] = [
      enviarTemplate(toCliente, sidCliente, varsCliente, sid, token, from),
      ...tosAdmin.map(to => enviarTemplate(to, sidAdmin, varsAdmin, sid, token, from)),
    ]

    await Promise.all(promesas)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error de red' }, { status: 502 })
  }
}
