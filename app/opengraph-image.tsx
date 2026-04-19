import { ImageResponse } from 'next/og'
import { negocio } from '@/config'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        background: '#0a0a0a',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
      }}
    >
      <div style={{ fontSize: 100 }}>🏎️</div>
      <div style={{ fontSize: 64, fontWeight: 700, color: '#ffffff', letterSpacing: -2 }}>
        {negocio.nombre}
      </div>
      <div style={{ fontSize: 32, color: '#888888' }}>
        Reservá tu turno online
      </div>
      <div style={{ fontSize: 24, color: '#555555', marginTop: 8 }}>
        {negocio.direccion}
      </div>
    </div>,
    { ...size }
  )
}
