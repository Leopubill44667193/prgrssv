# DEPLOY.md

Guía de deploy para el sistema de reservas sim-turnos.

---

## Flujo normal (cambios chicos)

```bash
# 1. Hacés los cambios en local y los verificás
NEXT_PUBLIC_NEGOCIO_ID=sim-turnos npm run dev

# 2. Corré el script de humo
bash scripts/check.sh

# 3. Si dice "12 / 12 rutas OK", commiteás y pusheás
git add -p
git commit -m "descripción del cambio"
git push origin main && git push prgrssv main
```

Vercel despliega automáticamente al detectar el push. En ~1 minuto está en producción.

---

## Flujo para cambios grandes

Si el cambio toca lógica compartida (flujo de reserva, helpers de horario, admin) o agrega una feature nueva:

```bash
# 1. Creás una feature branch
git checkout -b feature/nombre-del-cambio

# 2. Hacés los cambios, commiteás
git add -p && git commit -m "..."

# 3. Pusheás la branch
git push origin feature/nombre-del-cambio

# 4. Vercel genera una URL preview automáticamente
#    Revisás que los tres negocios se vean bien en esa URL

# 5. Si está ok, mergeás a main
git checkout main
git merge feature/nombre-del-cambio
git push origin main && git push prgrssv main

# 6. Borrás la feature branch
git branch -d feature/nombre-del-cambio
git push origin --delete feature/nombre-del-cambio
```

---

## Checklist antes de pushear a main

- [ ] `bash scripts/check.sh` → 12 / 12 OK
- [ ] Probé en local el negocio que toqué
- [ ] Si agregué un campo a `NegocioConfig`, está definido en los tres configs

---

## Variables de entorno por negocio (Vercel)

Cada deployment en Vercel tiene su propio `NEXT_PUBLIC_NEGOCIO_ID`. Si agregás una variable nueva, acordate de agregarla en **todos** los deployments:

| Deployment | `NEXT_PUBLIC_NEGOCIO_ID` |
|------------|--------------------------|
| sim-turnos.vercel.app | `sim-turnos` |
| prgrssv.vercel.app | `prgrssv` |
| lacancha.vercel.app | `lacancha` |
