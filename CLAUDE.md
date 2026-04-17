# sim-turnos — OC.Hobbies.Racing

Sistema de reservas online para un local de simuladores de conduccion en Rojas.
**Negocio:** 4 simuladores, turnos de 60 min, horario 15:00-02:00, todos los dias.
**Direccion:** Av. 3 de Febrero 283, Rojas.

---

## Stack

| Capa | Tecnologia |
|------|------------|
| Framework | Next.js 16.2 (App Router) |
| UI | React 19 + Tailwind CSS v4 |
| Base de datos | Supabase (PostgreSQL) |
| Auth admin | Contrasena hardcodeada en cliente + sessionStorage |
| Notificaciones | CallMeBot (WhatsApp API gratuita) |
| Deploy | Vercel (sim-turnos.vercel.app) |

---

## Estructura de archivos

```
app/
  page.tsx                    # Landing
  layout.tsx                  # Root layout (fuente Geist)
  globals.css
  reservar/
    page.tsx                  # Flujo principal: fecha + hora + simuladores
    [id]/page.tsx             # Flujo alternativo: un simulador, multi-hora
  confirmado/
    page.tsx                  # Resumen post-reserva + links de cancelacion
  cancelar/
    [token]/page.tsx          # Cancelacion self-service por token
  admin/
    page.tsx                  # Panel interno con grilla/tabla
  api/
    notificar/route.ts        # POST server-side -> CallMeBot (hasta 2 numeros)
lib/
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
| id | int (1-4) |
| nombre | text |

### `turnos`
| campo | tipo | notas |
|-------|------|-------|
| id | uuid PK | |
| simulador_id | int FK | |
| cliente_id | uuid FK | |
| fecha | date | |
| hora_inicio | time | |
| hora_fin | time | calculada en cliente: (h+1)%24 |
| cancel_token | uuid | generado por Supabase, para cancelar sin login |
| created_at | timestamptz | |

**Constraint:** `UNIQUE (simulador_id, fecha, hora_inicio)` — evita doble reserva del mismo slot.

---

## Rutas

| Ruta | Descripcion |
|------|-------------|
| `/` | Landing con boton Reservar ahora |
| `/reservar` | Flujo principal: fecha -> hora -> simuladores -> datos -> confirmar |
| `/reservar/[id]` | Flujo alternativo: un simulador especifico, hasta 4 horas |
| `/confirmado` | Resumen con links de cancelacion por simulador + boton WhatsApp |
| `/cancelar/[token]` | Cancelacion self-service, sin login |
| `/admin` | Panel con login por contrasena, grilla y tabla por fecha |

---

## Lo que esta funcionando

- [x] Landing page
- [x] Flujo de reserva grupal (`/reservar`): fecha, hora y multiples simuladores en un paso
- [x] Flujo de reserva individual (`/reservar/[id]`): un simulador, hasta 4 horas
- [x] Deduplicacion de clientes por telefono
- [x] Pagina de confirmacion con resumen completo (fecha, hora, simuladores)
- [x] Links de cancelacion individuales por simulador (uno por turno)
- [x] Boton Compartir por WhatsApp con todos los datos de la reserva
- [x] Cancelacion self-service por token unico sin login
- [x] Notificacion WhatsApp al confirmar una reserva (hasta 2 numeros via CallMeBot)
- [x] Notificacion WhatsApp al cancelar un turno (hasta 2 numeros via CallMeBot)
- [x] Panel admin: login por contrasena, vista grilla y vista tabla
- [x] Eliminar turno desde el admin
- [x] Selector de fecha en el admin
- [x] Validacion de fecha minima (no se pueden reservar fechas pasadas)
- [x] Bloqueo de horarios pasados dentro del dia actual
- [x] Constraint UNIQUE en Supabase sobre (simulador_id, fecha, hora_inicio)
- [x] `/reservar/[id]` pasa fecha y hora correctamente a `/confirmado`

---

## Lo que falta / deuda tecnica

- [ ] **Metadata del sitio** — `layout.tsx` tiene el titulo por defecto "Create Next App"
- [ ] **Auth admin real** — la contrasena esta hardcodeada en el bundle del cliente (visible en el JS)
- [ ] **RLS en Supabase** — la anon key tiene acceso total a todas las tablas
- [ ] **Bloqueo de fechas/horarios** — no hay forma de cerrar dias o rangos desde el admin
- [ ] **Limite por cliente** — un mismo telefono puede reservar todos los simuladores
- [ ] **Timezone explicita** — `created_at` en admin resta 3 hs hardcodeado (UTC-3)
- [ ] **Pagina 404 personalizada**
- [ ] **Latencia de CallMeBot** — el plan gratuito puede tardar 1-2 min en entregar el mensaje

---

## Decisiones tecnicas importantes

### Notificaciones server-side (no cliente)
Las credenciales de CallMeBot viven en variables de entorno del servidor (`CALLMEBOT_PHONE`, `CALLMEBOT_APIKEY`, y opcionalmente `CALLMEBOT_PHONE_2`, `CALLMEBOT_APIKEY_2`). La llamada se hace desde `app/api/notificar/route.ts` con `Promise.all` para enviar a los dos numeros en paralelo. Nunca se exponen al browser.

### cancel_token en lugar de auth
Cada turno tiene un `cancel_token` UUID generado por Supabase. Permite cancelar sin cuenta ni login. El token se muestra en `/confirmado` y se puede compartir por WhatsApp.

### Deduplicacion de clientes por telefono
Antes de insertar un turno se busca si ya existe un cliente con ese telefono. Si existe se reutiliza el id.

### Calculo de hora_fin en cliente
`hora_fin = (hora_inicio + 1) % 24` se calcula en el front antes de insertar. Maneja el cruce de medianoche correctamente.

### Validacion de horarios pasados
`horaValida(hora, fecha)` compara hora del slot vs hora actual del browser. Maneja el cruce de medianoche: horas 0-2 son "post-medianoche" y se tratan distinto segun si el browser esta antes o despues de las 3am.

### TypeScript con errores ignorados en build
`next.config.ts` tiene `typescript: { ignoreBuildErrors: true }` y `eslint: { ignoreDuringBuilds: true }`. Ideal revertir cuando el proyecto madure.

### Admin sin RLS
El panel admin usa la misma anon key que el cliente publico. Para produccion real habria que implementar RLS en Supabase o mover las operaciones admin a API routes con una service key.

---

## Variables de entorno

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# CallMeBot WhatsApp (server-side, sin NEXT_PUBLIC_)
CALLMEBOT_PHONE=549XXXXXXXXXX      # numero principal
CALLMEBOT_APIKEY=XXXXXX
CALLMEBOT_PHONE_2=549XXXXXXXXXX    # numero secundario (opcional)
CALLMEBOT_APIKEY_2=XXXXXX
```

**En Vercel:** Settings -> Environment Variables. Las 4 variables estan configuradas en produccion.

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

## Activacion de CallMeBot (por numero nuevo)

1. Guardar `+34 694 29 84 96` en contactos del telefono
2. Mandar `I allow callmebot to send me messages` por WhatsApp a ese contacto
3. El bot responde con la apikey en ~1 minuto
4. Cargar `CALLMEBOT_PHONE` y `CALLMEBOT_APIKEY` en `.env.local` y en Vercel
5. Cada numero de WhatsApp necesita su propia activacion y apikey
