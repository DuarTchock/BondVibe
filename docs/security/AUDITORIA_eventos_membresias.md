# Auditoría — eventos / RSVP + membresías-créditos

Read-only sobre joinEvent, setEventLocation, redeem/undo/release de créditos,
redeemBusinessGuestCode y sus reglas (main). El P1 lo verificó QA. Nota general: no hay App
Check ni rate-limit en NINGUNA Cloud Function — amplifica el P1.

## P1 — [QA VERIFICADO] Guest codes brute-forceables → hijack de miembro + PII + pase de check-in

`redeemBusinessGuestCode` (index.js:2269) + generador (`businessMembersService.js:77-88`,
alfabeto `:65`). El código es `PREFIJO-XXXX`: prefijo = nombre del negocio (derivable), secreto
real = **4 chars** de un alfabeto de 31 (`31^4 = 923,521`), con **`Math.random()`** (no cripto).
La callable **no exige `email_verified`**, no tiene rate-limit ni App Check, y busca por
`collectionGroup("members").where("inviteCode","==",code)` (basta acertar CUALQUIER código vivo
del negocio → esfuerzo ~923521/M).

Exploit (confirmado): brute-force de `MIGYM-XXXX` con cuentas desechables. Al acertar un
registro con `linkedUid==null`, la función pone `linkedUid=atacante` y devuelve
`{bizId, memberId, businessName, memberName}` — ya filtra el **nombre real**. Y como ahora
`linkedUid==uid`, la regla de `members` (`firestore.rules:1040`) le deja **leer el doc completo**:
teléfono, email, créditos, notas del CRM, y el `qrPassId` (pase de check-in).

Fix: entropía ≥8-10 chars con `crypto.randomBytes`; rate-limit por uid/IP (doc transaccional de
intentos); exigir `email_verified`.

## P2 — Lista de asistentes (PII) de CUALQUIER evento (incl. "privados") legible por cualquiera
`firestore.rules:205` (`events/{id}` read: if isSignedIn()) + `attendees[]` vive en ese doc
abierto. `listedPublicly:false` solo lo saca de Discover, NO es control de acceso. Cualquiera
que adivine el `eventId` lee el roster de uids, y con la regla abierta de `users` (:112) los
resuelve a nombre/foto → deanonimiza quién asiste a una reunión privada. (P1 si la membresía de
eventos no-listados se considera confidencial.) Fix: mover el roster a
`events/{id}/attendees/{uid}` legible solo por participantes; en el doc público solo `participantCount`.

## P2 — `joinEvent` sin `email_verified`
`index.js:2376` no lo checa, aunque `reserveMembershipCredit` (:1261) y el create de evento sí.
Una cuenta sin verificar hace RSVP a un evento gratis → entra a `attendees[]` → pasa a
`isEventParticipant` → **lee el doc privado de ubicación exacta** (`events/{id}/private/location`),
el chat y el roster. La protección de email queda saltada para eventos gratis. Fix: mismo guard
que reserveMembershipCredit.

## P3 (hardening)
- `releaseMembershipReservation` (index.js:1655) lee la reserva y valida estado FUERA de la
  transacción; en carrera puede pisar `redeemed→released` o descontar el crédito 2 veces. Daña al
  usuario, no da crédito gratis. Fix: mover lectura+guard dentro de runTransaction (como redeem/undo).
- `joinEvent` (index.js:2394) usa `new Date(e.date)` → si `date` es Timestamp, `Invalid Date` →
  el guard "evento ya pasó" se salta → RSVP a eventos pasados. Fix: usar `eventStartDate(e)`.
- Sin invariante server `acceptsMembership ⇒ price>0` (index.js:2391); hoy la UI lo cubre, pero
  un host que guarde `acceptsMembership:true, price:0` dejaría entrar gratis sin gastar crédito.

## Verificado SEGURO
`redeemMembershipCredit`/`undoMembershipRedemption` transaccionales, idempotentes por guard de
estado y **host-only** (sin doble gasto, sin ganancia en redeem→undo→redeem, sin auto-undo).
IDOR de saldos/reservas: `memberships`/`membershipReservations`/`membershipRedemptions`
read-acotado y write:if false. `setEventLocation` host/co-host (creatorId no-spoofable, doc
privado write:if false). Capacidad/pago en joinEvent: transaccional con waitlist FIFO, precio>0
rechazado, cancelados rechazados. Guest code replay: idempotente + no roba registros ya vinculados.

---
PROMPT → plugin (ronda privacidad · PR aparte, NO merge):
[P1] redeemBusinessGuestCode (index.js:2269) + generateGuestCode: sube la entropía del sufijo a
≥8 chars con crypto.randomBytes, agrega rate-limit por uid (doc guestCodeAttempts transaccional)
y exige email_verified. [P2] joinEvent: agrega el guard email_verified (igual que
reserveMembershipCredit:1261). [P2] mueve attendees a events/{id}/attendees/{uid} (solo
participantes) o al menos gatea la lectura del roster. Tests. NO merge: QA revisa.
