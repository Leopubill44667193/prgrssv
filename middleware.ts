import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

async function computeToken(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + ':admin-session-v1')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function middleware(req: NextRequest) {

  const adminPassword = process.env.ADMIN_PASSWORD
  const cookie = req.cookies.get('admin_session')?.value
  const loginUrl = new URL('/admin-login', req.url)

  if (!adminPassword || !cookie) return NextResponse.redirect(loginUrl)

  const expected = await computeToken(adminPassword)
  if (cookie !== expected) return NextResponse.redirect(loginUrl)

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
