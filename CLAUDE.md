# sim-turnos — Sistema multi-negocio de reservas

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

## Estructura de archivos

```
app/
  page.tsx                    # Landing
  layout.tsx                  # Root layout + metadata dinamica desde config
  globals.css
  reservar/
    page.tsx                  # Flujo principal: fecha + hora + recursos + datos
    [id]/page.tsx             # Flujo alternativo: un recurso especifico, multi-hora
  confirmado/
    page.tsx                  # Resumen post-reserva + links de cancelacion
  cancelar/
    page.tsx                  # Redirige a /mis-turnos
    [token]/page.tsx          # Cancelacion self-service por token
  mis-turnos/
    page.tsx                  # Busqueda de turnos por telefono
  admin/
    page.tsx                  # Panel interno con grilla/tabla + bloqueo de dias
  api/
    notificar/route.ts        # POST server-side -> Twilio WhatsApp (hasta 2 numeros)
config/
  index.ts                    # Selecciona config activa por NEXT_PUBLIC_NEGOCIO_ID
  sim-turnos.ts               # Config de OC.Hobbies.Racing
  prgrssv.ts                  # Config de Prgrssv
lib/
  config.ts                   # Tipo NegocioConfig + helpers (generarHorarios, horaValida, etc.)
  supabase.js                 # Cliente Supabase (anon key)
```

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

RLS deshabilitado (misma anon key que el resto).

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

---

## Lo que esta funcionando

- [x] Landing page con metadata dinamica
- [x] Flujo de reserva grupal (`/reservar`): fecha, hora y multiples recursos en un paso
- [x] Flujo de reserva individual (`/reservar/[id]`): un recurso, hasta 4 horas
- [x] Deduplicacion de clientes por telefono
- [x] Pagina de confirmacion con resumen completo
- [x] Links de cancelacion individuales por recurso (uno por turno)
- [x] Boton Compartir por WhatsApp con todos los datos de la reserva
- [x] Cancelacion self-service por token unico sin login
- [x] Notificacion WhatsApp al confirmar una reserva (hasta 2 numeros via Twilio)
- [x] Notificacion WhatsApp al cancelar un turno (hasta 2 numeros via Twilio)
- [x] Panel admin: login por contrasena, vista grilla y vista tabla
- [x] Eliminar turno desde el admin
- [x] Selector de fecha en el admin + vista "Todos" (todos los turnos)
- [x] Bloqueo de dias desde el admin con motivo opcional
- [x] Validacion de fecha minima (no se pueden reservar fechas pasadas)
- [x] Bloqueo de horarios pasados dentro del dia actual
- [x] Constraint UNIQUE en Supabase sobre (simulador_id, fecha, hora_inicio)
- [x] Sistema multi-negocio: config por archivo + env var NEXT_PUBLIC_NEGOCIO_ID
- [x] Soporte de intervalos de 30 y 60 minutos
- [x] Dias habiles configurables por negocio
- [x] `/mis-turnos`: buscar y cancelar turnos propios por telefono
- [x] Metadata del sitio dinamica desde config del negocio

---

## Lo que falta / deuda tecnica

- [ ] **Auth admin real** — la contrasena esta en el bundle del cliente (visible en JS)
- [ ] **RLS en Supabase** — la anon key tiene acceso total a todas las tablas
- [ ] **Limite por cliente** — un mismo telefono puede reservar todos los recursos
- [ ] **Timezone explicita** — `created_at` en admin resta 3 hs hardcodeado (UTC-3)
- [ ] **Pagina 404 personalizada**
- [ ] **Base de datos compartida** — hoy cada negocio necesita su propia instancia de Supabase (limite 2 gratis). Antes del cliente 3 conviene migrar a una BD unica con columna negocio_id
- [ ] **Twilio produccion** — hoy usa sandbox (requiere join previo). Para clientes reales hay que aprobar WhatsApp Business Account en Twilio

---

## Decisiones tecnicas importantes

### Multi-negocio
Cada negocio tiene un archivo en `config/` con tipo `NegocioConfig`. La config activa se selecciona por `NEXT_PUBLIC_NEGOCIO_ID` (default: `sim-turnos`). Un solo repo, multiples deployments en Vercel.

### NegocioConfig — campos clave
- `horario.inicioMin` / `finMin` — minutos desde medianoche (ej: 15*60=900)
- `horario.intervaloMinutos` — 30 o 60
- `diasHabiles` — array de dias (0=Dom...6=Sab), undefined = todos los dias
- `recursoNombre` / `recursoNombrePlural` — singular y plural del recurso

### Notificaciones server-side (Twilio)
Las credenciales de Twilio viven en variables de entorno del servidor. La llamada se hace desde `app/api/notificar/route.ts` con `Promise.all` para enviar a los dos numeros en paralelo. Nunca se exponen al browser.

Twilio sandbox: cada numero receptor debe mandar `join <palabra>` al +14155238886 una sola vez.

### cancel_token en lugar de auth
Cada turno tiene un `cancel_token` UUID generado por Supabase. Permite cancelar sin cuenta ni login.

### Deduplicacion de clientes por telefono
Antes de insertar un turno se busca si ya existe un cliente con ese telefono. Si existe se reutiliza el id. La query usa `.single()` que devuelve 406 si no encuentra fila — esto es normal y el codigo lo maneja.

### Supabase client tolerante a build time
`lib/supabase.js` usa fallback `|| placeholder` en las vars para evitar crash durante el prerender de Next.js en Vercel.

### TypeScript con errores ignorados en build
`next.config.ts` tiene `typescript: { ignoreBuildErrors: true }` y `eslint: { ignoreDuringBuilds: true }`.

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

## Comandos

```bash
# Desarrollo (desde WSL)
cd /home/usuario/proyectos/sim-turnos
npm run dev

# Limpiar cache y reiniciar
rm -rf .next && npm run dev

# Push a produccion
git add -p && git commit -m "..." && git push origin main
```

---

## Activacion Twilio sandbox (por numero nuevo)

1. Desde el telefono, mandar por WhatsApp al `+1 415 523 8886`: `join <palabra-del-sandbox>`
2. La palabra se encuentra en Twilio -> Messaging -> Try it out -> Send a WhatsApp message
3. El numero queda habilitado para recibir mensajes del sandbox indefinidamente
