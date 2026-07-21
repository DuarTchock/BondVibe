# Kinlo — Backlog de seguridad consolidado (5 auditorías)

Índice único de todo lo encontrado. El detalle + los prompts de fix están en los docs por
superficie (`AUDITORIA_*.md`, `DISENO_security_pass_negocio.md`). Nada de esto es P0 ni bloquea
lanzar hoy, pero los P1 sí deberían cerrarse antes de producción.

## ✅ Cerrado
- **P1 secuestro de invitación de staff** (email_verified) → #47 mergeado + desplegado.

## 🔧 En progreso
- **Round 2** (PR del plugin, sin merge): storage expenses P1 · DM threadId P1 · auto-follow P3.

## 🔴 P1 pendientes
| # | Qué | Superficie | Fix | Riesgo del fix |
|---|-----|-----------|-----|----------------|
| A | `users` doc mundo-legible → fuga de personality/matchProfile (intención romántica, Big-Five) **y** deanonimizar asistentes de eventos | matchmaking + eventos | mover campos sensibles a subcolección gated | **Refactor con cuidado** (muchas features leen users) |
| B | Guest codes 4-char (923K, Math.random, sin rate-limit/email_verified) → hijack de miembro + PII + pase | eventos/negocio | crypto entropy + rate-limit + email_verified | Bajo |

**A es el root cause** que amplifica varios P2. Es el de mayor impacto de privacidad.

## 🟠 P2 pendientes
- Gate de finanzas `≠ reception` (manager/instructor obtienen finanzas pese a sus perms) — negocio.
- Posts de comunidad privada legibles por cualquiera — social.
- `createNotification` destinatario + texto libres (phishing/spam) — social.
- `joinEvent` sin email_verified → salta la protección de ubicación privada — eventos.
- `matchPool` self-activatable → cosecha masiva de perfiles — matchmaking.
- email_verified ausente en escrituras sociales y callables de matchmaking.

## 🟡 P3 pendientes (hardening)
- owner-transfer sin transacción — negocio.
- releaseMembershipReservation sin transacción (doble descuento) — membresías.
- joinEvent guard de fecha roto con Timestamp (RSVP a eventos pasados) — eventos.
- recordPostEvent sin dedupe · moments expiresAt cliente · joinGroupByCode entropía — social.
- CSV sin escape RFC-4180 · recibos PDF rechazados (funcional) — negocio.
- createLikeAndMaybeMatch no checa check-in del target (mismatch) — matchmaking.

## 📋 Rondas propuestas (para no hacer 15 PRs sueltos)
- **Round 2** — 2 P1 de reglas + auto-follow. *(en progreso)*
- **Round 3 · Privacidad/PII** — P1-A (users doc), P1-B (guest code), y todos los `email_verified`
  faltantes (joinEvent, escrituras sociales, callables de matchmaking) + roster de asistentes.
  *Es la ronda de mayor impacto: cierra los 2 P1 nuevos y la fuga de datos de usuario.*
- **Round 4 · Access-control** — finance gate (perms.finance), createNotification (allowlist+ratelimit),
  owner-transfer + releaseMembershipReservation (transacciones), joinEvent Timestamp guard, P3s restantes.

## Docs de detalle
`AUDITORIA_negocio_ownership_staff.md` · `AUDITORIA_social.md` ·
`AUDITORIA_negocio_financiero.md` · `AUDITORIA_matchmaking.md` ·
`AUDITORIA_eventos_membresias.md` · `DISENO_security_pass_negocio.md`
