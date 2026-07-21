# Auditoría — flujos de negocio (ownership / staff)

Alcance: `inviteBusinessStaff`, `claimStaffInvites`, `respondToStaffInvite`,
`requestOwnerTransfer`, `approveOwnerTransfer`, `requestBusinessSession`
(functions/index.js @ main 33ed2cc) + reglas `businesses/**`, `staffInvites`,
`ownerTransfers` (firestore.rules).

Veredicto: **no hay P0 de takeover directo** (el vector `ownerUid` está bien
cerrado por field-lock en reglas). El hallazgo accionable es un **P1 verificado
por QA**: secuestro de invitación por falta de `email_verified`. Le siguen un P2
(gate de finanzas fail-open) y afinamientos P3 en owner-transfer.

---

## P1 — [QA VERIFICADO] Secuestro de invitación de staff (falta `email_verified`)

`claimStaffInvites` (index.js:4005; email en **:4008**, escritura staff **:4037-4046**)
deriva la identidad del invitado de `request.auth.token.email` **sin verificar
`email_verified`**, y reclama cualquier `staffInvites` pending con ese email.
`respondToStaffInvite` (:4083) e `inviteBusinessStaff` (:3890) tampoco lo exigen.

Exploit (confirmado leyendo el código):
1. El dueño de B invita `alice@ej.com` (sin cuenta) → se crea
   `staffInvites/{B}_{alice@ej.com}` con `status:"pending"` (**:3990**).
2. El atacante registra en Firebase Auth una cuenta email/password con
   `alice@ej.com` (Firebase **no** valida propiedad del buzón; `email_verified`
   queda `false`, pero el ID token se emite).
3. Atacante llama `claimStaffInvites` → `businesses/B/staff/{atacante}` con
   `status:"invited"`.
4. Atacante llama `respondToStaffInvite({bizId:B, accept:true})` → `status:"active"`.

Gana: acceso staff al negocio ajeno B — `members` (PII/CRM, créditos), `bookings`,
`classes`, `attendance`, `automations` (mensajear a los clientes del negocio),
`momentum`; y finanzas si el rol no es exactamente `"reception"` (ver P2).

Por qué P1 y no P0: requiere un invite pendiente a un email aún sin cuenta y que el
atacante conozca/adivine ese email. El paso de "consentimiento" (BUG 32.1) no
protege aquí porque el atacante controla la cuenta falsa que consiente.

Fix: exigir `request.auth.token.email_verified === true` al inicio de
`claimStaffInvites`, `respondToStaffInvite` e `inviteBusinessStaff` (mismo patrón
que `reserveVehicle`:3443 / `reserveServiceBooking`:3700). → **Plugin, PR-A.**

---

## P2 — [reportado, pendiente verificar] Gate de finanzas fail-open + rol sin allow-list

firestore.rules:1087-1088/1093-1094/1099-1100 (helper `bizStaffRole` :995-997) conceden
`payments`/`expenses`/`goals` a **cualquier rol ≠ `"reception"`** — deny-by-exception,
no allow-list. `inviteBusinessStaff` (:3896) acepta `role` libre del cliente sin validar.
Un typo, un rol desconocido, o el rol del invite secuestrado (P1) obtiene finanzas.

Fix (dos partes): (a) validar `role` contra el set permitido real en las callables
— additivo, va en PR-A; (b) cambiar el gate de reglas a allow-list explícito
(`bizStaffRole in ['owner','manager','instructor',…]`) — **cambio de reglas con
riesgo de romper acceso si el set queda mal → pase aparte, QA revisa despierto.**

---

## P3 — [reportado] Afinamientos en owner-transfer (bajo impacto, admin/owner-gated)

- `approveOwnerTransfer` (:4213): admin-gated (sólido), pero sin `runTransaction` y **no
  revalida que `fromUid` siga siendo `business.ownerUid`** al aprobar. Fix: aprobar dentro
  de transacción releyendo `ownerUid`.
- `requestOwnerTransfer` (:4146): check "un pending por negocio" con TOCTOU (sin transacción)
  → dos requests concurrentes pueden crear dos pendings. Fix: doc de id determinista
  `ownerTransfers/{bizId}` o transacción.
- firestore.rules:1028: el dueño puede escribir staff `status:"active"` directo, saltando el
  consentimiento (BUG 32.1). Consentimiento/confianza, no privesc. Fix opcional: permitir sólo
  `"invited"` desde cliente.

→ **Follow-up QA, no en el PR overnight.**

---

## Revisado y SEGURO (sin acción)

- Takeover de `ownerUid` por escritura directa: **bloqueado** — firestore.rules:1015-1018
  field-lockea `['ownerUid','verified','insured']` (fix de #42).
- Staff auto-escalando su rol: **bloqueado** — escritura de `staff/{uid}` es owner-only (:1028).
- IDOR en `inviteBusinessStaff`: no posible — `bizId = uid`, sólo opera sobre el propio negocio.
- `approveOwnerTransfer` por no-admin / auto-aprobación: no — `isAdminUid` (claim + fallback no
  auto-elevable); consentimiento del dueño capturado en `requestOwnerTransfer` (owner-only).
- Escritura directa a `staffInvites`/`ownerTransfers`: **denegada** (`allow create,update,delete: if false`).
- `requestBusinessSession`: valida membresía; no toca ownership/staff.
