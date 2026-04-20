# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# sim-turnos — Sistema multi-negocio de reservas

**Estado:** En producción (sim-turnos.vercel.app)

Sistema de reservas online configurable por negocio. Cada cliente tiene su propio archivo de config, una instancia de Supabase, y un deployment en Vercel con su env var `NEXT_PUBLIC_NEGOCIO_ID`.

---

## Negocios activos

| ID | Negocio | Direccion | Recursos | Horario |
|----|---------|-----------|----------|---------|
| `sim-turnos` | OC.Hobbies.Racing | Av. 3 de Febrero 283, Rojas | 4 simuladores, 60 min | 15:00-02:00 todos los dias |
| `prgrssv` | Prgrssv | Zeballos 2239 6A, Rosario | 1 peluquero, 30 min | 09:00-19:30 Lun-Vie |

---

## Stack

| Capa | Tecnologia |
|------|------------|
| Framework | Next.js (App Router) |
| UI | React 19 + Tailwind CSS v4 |
| Base de datos | Supabase (PostgreSQL) — una instancia por negocio |
| Auth admin | Contrasena en config del negocio + sessionStorage |
| Notificaciones | Twilio WhatsApp Sandbox |
| Deploy | Vercel |

---

## Comandos

```bash
# Desarrollo (desde WSL)
cd /home/usuario/proyectos/sim-turnos
npm run dev

# Limpiar cache y reiniciar
rm -rf .next && npm run dev

# Lint
npm run lint

# Push a produccion
git add -p && git commit -m "..." && git push origin main
```

No hay tests configurados. Los errores de TypeScript y ESLint no bloquean el build (`next.config.ts` tiene `ignoreBuildErrors: true` y `ignoreDuringBuilds: true`).

---

## Esquema de base de datos (Supabase)

### `clientes`
| campo | tipo | notas |
|-------|------|-------|
| id | uuid PK | |
| nombre | text | |
| telefono | text | unico, se usa para deduplicar |

### `simuladores`
| campo | tipo |
|-------|------|
| id | int |
| nombre | text |

### `dias_bloqueados`
| campo | tipo | notas |
|-------|------|-------|
| fecha | date PK | |
| motivo | text | nullable (ej: "Feriado", "Mantenimiento") |

### `turnos`
| campo | tipo | notas |
|-------|------|-------|
| id | uuid PK | |
| simulador_id | int FK | |
| cliente_id | uuid FK | |
| fecha | date | |
| hora_inicio | time | |
| hora_fin | time | calculada en cliente |
| cancel_token | uuid | generado por Supabase, para cancelar sin login |
| created_at | timestamptz | |

**Constraint:** `UNIQUE (simulador_id, fecha, hora_inicio)` — evita doble reserva del mismo slot.

RLS deshabilitado (misma anon key que el resto).

---

## Rutas

| Ruta | Descripcion |
|------|-------------|
| `/` | Landing con boton Reservar ahora |
| `/reservar` | Flujo principal: fecha -> hora -> recursos -> datos -> confirmar |
| `/reservar/[id]` | Flujo alternativo: un recurso especifico, hasta 4 horas |
| `/confirmado` | Resumen con links de cancelacion por recurso + boton WhatsApp |
| `/cancelar/[token]` | Cancelacion self-service, sin login |
| `/cancelar` | Redirige a /mis-turnos |
| `/mis-turnos` | Buscar turnos propios por telefono |
| `/admin` | Panel con login por contrasena, grilla y tabla por fecha |
| `/api/notificar` | POST server-side -> Twilio WhatsApp (hasta 2 numeros) |

---

## Decisiones tecnicas importantes

### Multi-negocio
Cada negocio tiene un archivo en `config/` con tipo `NegocioConfig`. La config activa se selecciona por `NEXT_PUBLIC_NEGOCIO_ID` (default: `sim-turnos`). Un solo repo, multiples deployments en Vercel.

### NegocioConfig — campos clave (`lib/config.ts`)
- `horario.inicioMin` / `finMin` — minutos desde medianoche (ej: 15*60=900). Soporta cruce de medianoche (finMin < inicioMin).
- `horario.intervaloMinutos` — 30 o 60
- `diasHabiles` — array de dias (0=Dom...6=Sab), `undefined` = todos los dias
- `recursoNombre` / `recursoNombrePlural` — singular y plural del recurso (ej: "Simulador"/"Simuladores")
- `adminPassword` — contrasena en plaintext (deuda tecnica: visible en el bundle JS)

### Helpers de horario (`lib/config.ts`)
- `generarHorarios()` — crea array de slots desde apertura/cierre
- `formatHora()` — convierte minutos desde medianoche a HH:MM, maneja horarios del dia siguiente
- `horaValida()` — bloquea slots pasados en el dia actual, maneja cruce de medianoche
- `esDiaHabil()` — verifica si la fecha cae en los dias habiles del negocio
- `calcularUmbral()` — detecta si el horario cruza la medianoche

### Notificaciones server-side (Twilio)
Las credenciales de Twilio viven en variables de entorno del servidor. La llamada se hace desde `app/api/notificar/route.ts` con `Promise.all` para enviar a los dos numeros en paralelo. Nunca se exponen al browser.

Twilio sandbox: cada numero receptor debe mandar `join <palabra>` al +14155238886 una sola vez.

### cancel_token en lugar de auth
Cada turno tiene un `cancel_token` UUID generado por Supabase. Permite cancelar sin cuenta ni login. Los links de cancelacion se muestran en `/confirmado` y se envian por WhatsApp.

### Deduplicacion de clientes por telefono
Antes de insertar un turno se busca si ya existe un cliente con ese telefono. Si existe se reutiliza el id **y se actualiza el nombre** con el valor ingresado en el formulario. La query usa `.single()` que devuelve 406 si no encuentra fila — esto es normal y el codigo lo maneja.

### Supabase client tolerante a build time
`lib/supabase.js` usa fallback `|| placeholder` en las vars para evitar crash durante el prerender de Next.js en Vercel.

### Timezone
`created_at` en el admin resta 3 hs hardcodeado (UTC-3). No hay manejo explicito de timezone.

---

## Variables de entorno

```bash
# Negocio (cual config cargar)
NEXT_PUBLIC_NEGOCIO_ID=sim-turnos   # o prgrssv, etc.

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Twilio WhatsApp (server-side, sin NEXT_PUBLIC_)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM=whatsapp:+14155238886
TWILIO_TO_1=whatsapp:+549XXXXXXXXXX   # numero principal (ej: dueno del negocio)
TWILIO_TO_2=whatsapp:+549XXXXXXXXXX   # numero secundario (opcional)
```

---

## Agregar un negocio nuevo

1. Crear `config/nuevo-negocio.ts` con tipo `NegocioConfig`
2. Registrarlo en `config/index.ts`
3. Crear proyecto en Supabase con el mismo schema
4. Crear deployment en Vercel con `NEXT_PUBLIC_NEGOCIO_ID=nuevo-negocio` y las demas vars

---

## Deuda tecnica

- **Auth admin real** — la contrasena esta en el bundle del cliente (visible en JS)
- **RLS en Supabase** — la anon key tiene acceso total a todas las tablas
- **Limite por cliente** — un mismo telefono puede reservar todos los recursos
- **Timezone explicita** — `created_at` en admin resta 3 hs hardcodeado (UTC-3)
- **Pagina 404 personalizada**
- **Base de datos compartida** — hoy cada negocio necesita su propia instancia de Supabase (limite 2 gratis). Antes del cliente 3 conviene migrar a una BD unica con columna `negocio_id`
- **Twilio produccion** — hoy usa sandbox (requiere join previo). Para clientes reales hay que aprobar WhatsApp Business Account en Twilio

---

## Activacion Twilio sandbox (por numero nuevo)

1. Desde el telefono, mandar por WhatsApp al `+1 415 523 8886`: `join <palabra-del-sandbox>`
2. La palabra se encuentra en Twilio -> Messaging -> Try it out -> Send a WhatsApp message
3. El numero queda habilitado para recibir mensajes del sandbox indefinidamente
