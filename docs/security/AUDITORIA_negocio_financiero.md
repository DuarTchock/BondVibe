# Auditoría — negocio financiero (expenses / CSV / momentum)

Read-only sobre firestore.rules, storage.rules y las funciones/servicios de expenses,
finanzas, CSV y momentum (main). No urgente (sin P0). El P1 lo verificó QA leyendo las reglas.

## P1 — [QA VERIFICADO] Recibos de gastos en Storage: fuga cross-owner tras transferencia

`storage.rules:81-85`:
```
match /businesses/{bizId}/expenses/{fileName} {
  allow read:  if isSignedIn() && request.auth.uid == bizId;
  allow write: if isSignedIn() && request.auth.uid == bizId && isImageUnder(10MB);
}
```
Autoriza por `request.auth.uid == bizId` (el uid del creador ORIGINAL en la ruta), **no por el
`ownerUid` vigente**. Pero `approveOwnerTransfer` cambia `businesses/{bizId}.ownerUid` al nuevo
dueño y degrada al anterior — y Firestore ya usa `ownerUid`. La regla de Storage quedó desalineada.

Exploit (confirmado): A (bizId=A) transfiere el negocio a B. Ahora:
- **Confidencialidad:** A (uid==bizId) SIGUE pudiendo leer/descargar `businesses/A/expenses/*`
  — todos los recibos (montos, proveedor, datos bancarios) — aunque Firestore ya le niega los docs.
- **Integridad:** A conserva `write` — puede sobrescribir o plantar recibos.
- **Disponibilidad:** el nuevo dueño B y el staff de finanzas (uid≠bizId) **nunca** pueden leer
  ni subir recibos — solo el creador original pasa la regla.

Fix: autorizar por propiedad vigente leyendo Firestore desde Storage —
`allow read, write: if firestore.get(/databases/(default)/documents/businesses/$(bizId)).data.ownerUid == request.auth.uid`
(y si se quiere, permitir staff de finanzas activo con un `firestore.exists` de su doc de staff).

## P2 — [ya en DISENO_security_pass_negocio.md, el audit lo CONFIRMA + amplía]
El gate de finanzas `bizStaffRole(bizId) != "reception"` es una **denylist de un solo string**:
además de manager/instructor (ya loggeado), **cualquier rol custom** que el dueño cree con otro
nombre (ej. "front_desk", "trainee") — esperando que sea no-financiero como reception — igual
pasa la compuerta y obtiene finanzas. Fix (mismo que el doc): allowlist explícito / checar
`perms.finance` real.

## P3 (hardening / funcional)
- `isImageUnder` (storage.rules:83) rechaza **PDF** — el formato de recibo/factura más común no
  se puede adjuntar. Brecha funcional (no seguridad). Fix: permitir application/pdf acotado.
- Export CSV sin escape RFC-4180 (`businessAnalyticsService.js:265`, `BusinessExpensesScreen.js:103`
  `r.join(",")`). Hoy los campos son numéricos + category/method que teclea el host (inyección
  auto-dirigida, bajo riesgo). Si algún día entra texto del miembro al export → inyección CSV/
  fórmula en el Excel del host. Fix: entrecomillar + neutralizar `= + - @` iniciales.

## Verificado SEGURO
Firestore expenses/payments/goals/momentum: acotados a `ownerUid` o staff-no-reception del bizId
exacto; **no hay regla collection-group** → sin fuga cross-business. CSV/export: no existe Cloud
Function de export; los helpers cliente usan `getMyBizId()` y subcolecciones directas (no
collectionGroup) → no alcanzan otro negocio. Ledger `businesses/{bizId}/payments`: solo escritura
cliente (entrada manual por diseño), ninguna function escribe ahí. Crons (reminders/session/
momentum): derivan `bizId` de la ruta real del doc → sin alcance cross-business. `sendBusinessMessage`
exige `bizId===uid`; `requestBusinessSession` valida membresía.

---
PROMPT → plugin (cuando se decida el pase · PR aparte, NO merge):
Arregla el P1 (recibos de gastos) en storage.rules: cambia el gate de businesses/{bizId}/expenses
de `request.auth.uid == bizId` a autorizar por el ownerUid vigente vía firestore.get
(businesses/{bizId}.ownerUid == request.auth.uid), tanto read como write; conserva el límite de
tamaño. Considera permitir también staff de finanzas activo. Test: tras una transferencia, el
dueño anterior NO lee/escribe los recibos y el nuevo dueño SÍ. NO merge: QA revisa.
