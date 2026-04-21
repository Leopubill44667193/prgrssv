# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# sim-turnos — Sistema multi-negocio de reservas

**Estado:** En producción (sim-turnos.vercel.app)

Sistema de reservas online configurable por negocio. Un solo repo, una sola base de datos Supabase compartida, múltiples deployments en Vercel.

---

## Negocios activos

| ID | Negocio | Dirección | Recursos | Horario |
|----|---------|-----------|----------|---------|
| `sim-turnos` | OC.Hobbies.Racing | Av. 3 de Febrero 283, Rojas | 4 simuladores, 60 min | 15:00-02:00 todos los días |
| `prgrssv` | Prgrssv | Zeballos 2239 6A, Rosario | 1 peluquero, 30 min | 09:00-19:30 Lun-Vie |
| `lacancha` | La Cancha Padel | Av. 20 de Diciembre 130, Rojas | 5 canchas, 90 min | 09:00-00:00 todos los días |

---

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js (App Router) |
| UI | React 19 + Tailwind CSS v4 |
| Base de datos | Supabase (PostgreSQL) — una sola instancia compartida, aislada por `negocio_id` |
| Auth admin | Contraseña en config del negocio + sessionStorage |
| Notificaciones | Twilio WhatsApp |
| Deploy | Vercel |

---

## Comandos

```bash
npm run dev
rm -rf .next && npm run dev  # si hay problemas de caché
npm run lint
git add -p && git commit -m "..." && git push origin main && git push prgrssv main
```

El repo tiene dos remotes: `origin` (sim-turnos.vercel.app) y `prgrssv` (prgrssv.vercel.app). **Siempre pushear a ambos** para que los dos deployments de Vercel se actualicen.

No hay tests configurados y no se deben agregar salvo que se pida explícitamente.

---

## Agregar un negocio nuevo

1. Copiar `config/sim-turnos.ts` como base y renombrar
2. Completar los campos (ver sección NegocioConfig abajo)
3. Registrar en `config/index.ts`
4. Crear deployment en Vercel con las variables de entorno del nuevo negocio

**No hace falta crear una Supabase nueva.** La BD es compartida y los datos se aíslan por `negocio_id`.

---

## NegocioConfig — todos los campos

```ts
{
  id: string            // identificador único, debe coincidir con NEXT_PUBLIC_NEGOCIO_ID
  nombre: string        // nombre visible del negocio
  direccion: string     // dirección, se muestra en el header y footer
  horario: {
    inicioMin: number   // minutos desde medianoche. Ej: 9*60 = 540 (09:00)
    finMin: number      // minutos de cierre. Ej: 24*60 = 1440 (00:00). Soporta cruce de medianoche
    intervaloMinutos: number  // duración del slot en minutos (30, 60, 90, etc.)
  }
  diasHabiles?: number[]      // 0=Dom, 1=Lun ... 6=Sáb. undefined = todos los días
  recursos: { id: number; nombre: string }[]  // lista de recursos. El nombre es lo que se muestra
  recursoNombre: string       // singular: "Simulador", "Cancha", "Peluquero"
  recursoNombrePlural: string // plural: "Simuladores", "Canchas", "Peluqueros"
  duracionMinutos: number     // duración del turno en minutos
  adminPassword: string       // contraseña del panel admin
  emoji: string               // emoji del recurso. Se usa en favicon, botones y mensajes WhatsApp
  seleccionSimple?: boolean   // true = solo se elige 1 recurso por turno. false/undefined = multi-select
  bgColor?: string            // color de fondo CSS. Default: '#000000'
  accentColor?: string        // color de acento. Default: 'red'
}
```

**Sobre el nombre del recurso:** se muestra tal cual en la UI, mensajes de WhatsApp y admin. Si un recurso tiene característica especial, incluirla en el nombre (ej: `'Cancha 5 (Blindex)'`).

**Sobre features nuevas:** asumir que pueden ser opt-in por negocio vía config. Si una feature tiene sentido solo para algunos negocios, agregar un campo al tipo y que cada config lo active o no.

---

## Regla central: negocio_id en todos los queries

Todos los queries a Supabase deben filtrar por `.eq('negocio_id', negocio.id)`.
Todos los inserts deben incluir `negocio_id: negocio.id`.
Sin esto los datos se mezclan entre negocios.

---

## Esquema de base de datos (Supabase)

### `clientes`
| campo | tipo | notas |
|-------|------|-------|
| id | uuid PK | |
| negocio_id | text | aísla por negocio |
| nombre | text | |
| telefono | text | único por negocio |

**Constraint:** `UNIQUE (negocio_id, telefono)`

### `simuladores`
| campo | tipo |
|-------|------|
| id | int PK |
| nombre | text |

### `dias_bloqueados`
| campo | tipo | notas |
|-------|------|-------|
| negocio_id | text | |
| fecha | date | |
| motivo | text | nullable |

**PK:** `(negocio_id, fecha)`

### `horarios_bloqueados`
| campo | tipo | notas |
|-------|------|-------|
| negocio_id | text | |
| fecha | date | |
| hora | time | |

**Constraint:** `UNIQUE (negocio_id, fecha, hora)`

### `turnos`
| campo | tipo | notas |
|-------|------|-------|
| id | uuid PK | |
| negocio_id | text | aísla por negocio |
| simulador_id | int FK | |
| cliente_id | uuid FK | |
| fecha | date | |
| hora_inicio | time | |
| hora_fin | time | se guarda en el insert, calculada con negocio.duracionMinutos |
| cancel_token | uuid | generado por Supabase, para cancelar sin login |
| created_at | timestamptz | |

**Constraint:** `UNIQUE (negocio_id, simulador_id, fecha, hora_inicio)`

**Sobre hora_fin:** se guarda en el momento de la reserva usando `negocio.duracionMinutos`. Si en el futuro se cambia la duración del negocio, los turnos viejos conservan la hora_fin original — eso es intencional.

RLS deshabilitado (misma anon key para todos).

---

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Landing con botón Reservar ahora |
| `/reservar` | Flujo principal: fecha → hora → recursos → datos → confirmar |
| `/reservar/[id]` | Flujo alternativo: un recurso específico, hasta 4 horas |
| `/confirmado` | Resumen con links de cancelación por recurso + botón WhatsApp |
| `/cancelar/[token]` | Cancelación self-service, sin login |
| `/cancelar` | Redirige a /mis-turnos |
| `/mis-turnos` | Buscar turnos propios por teléfono |
| `/admin` | Panel con login por contraseña, grilla y tabla por fecha |
| `/api/notificar` | POST server-side → Twilio WhatsApp (hasta 2 números) |

---

## Decisiones técnicas importantes

### Multi-negocio
Cada negocio tiene un archivo en `config/` con tipo `NegocioConfig`. La config activa se selecciona por `NEXT_PUBLIC_NEGOCIO_ID` (default: `sim-turnos`). Un solo repo, múltiples deployments en Vercel, una sola BD Supabase.

### Helpers de horario (`lib/config.ts`)
- `generarHorarios()` — crea array de slots desde apertura/cierre
- `formatHora()` — convierte minutos desde medianoche a HH:MM, maneja horarios del día siguiente
- `horaValida()` — bloquea slots pasados del día actual, maneja cruce de medianoche
- `esDiaHabil()` — verifica si la fecha cae en los días hábiles del negocio
- `calcularUmbral()` — detecta si el horario cruza la medianoche

### Notificaciones server-side (Twilio)
Las credenciales de Twilio viven en variables de entorno del servidor. La llamada se hace desde `app/api/notificar/route.ts` con `Promise.all` para enviar a los dos números en paralelo. Nunca se exponen al browser.

### cancel_token en lugar de auth
Cada turno tiene un `cancel_token` UUID generado por Supabase. Permite cancelar sin cuenta ni login. Los links de cancelación se muestran en `/confirmado` y se envían por WhatsApp.

### Deduplicación de clientes por teléfono
Antes de insertar un turno se busca si ya existe un cliente con ese teléfono y negocio_id. Si existe se reutiliza el id y se actualiza el nombre. La query usa `.single()` que devuelve 406 si no encuentra fila — esto es normal y el código lo maneja.

### Supabase client tolerante a build time
`lib/supabase.js` usa fallback `|| placeholder` en las vars para evitar crash durante el prerender de Next.js en Vercel.

### Timezone
`created_at` en el admin resta 3 hs hardcodeado (UTC-3). No hay manejo explícito de timezone.

---

## Variables de entorno

```bash
# Negocio (cuál config cargar)
NEXT_PUBLIC_NEGOCIO_ID=sim-turnos   # o prgrssv, lacancha, etc.

# Supabase (misma instancia para todos los negocios)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Twilio WhatsApp (server-side, sin NEXT_PUBLIC_)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM=whatsapp:+14155238886
TWILIO_TO_1=whatsapp:+549XXXXXXXXXX   # número principal
TWILIO_TO_2=whatsapp:+549XXXXXXXXXX   # número secundario (opcional)
```

---

## Deuda técnica

- **Auth admin real** — la contraseña está en el bundle del cliente (visible en JS)
- **RLS en Supabase** — la anon key tiene acceso total a todas las tablas
- **Límite por cliente** — un mismo teléfono puede reservar todos los recursos
- **Timezone explícita** — `created_at` en admin resta 3 hs hardcodeado (UTC-3)
- **Página 404 personalizada**
- **Bug admin (baja prioridad)** — al borrar un turno desde la vista tabla cambia a vista grilla
- **Twilio producción** — WhatsApp Business pendiente aprobación Meta

---

## Activación Twilio sandbox (por número nuevo)

1. Desde el teléfono, mandar por WhatsApp al `+1 415 523 8886`: `join <palabra-del-sandbox>`
2. La palabra se encuentra en Twilio → Messaging → Try it out → Send a WhatsApp message
3. El número queda habilitado para recibir mensajes del sandbox indefinidamente
