# Pase de seguridad — negocio (P2 finanzas + P3 owner-transfer)

Hallazgos de la auditoría de negocio, **verificados por QA leyendo el código de `main`**.
NO urgentes (el P1 ya se cerró en #47; aquí no hay P0/P1 nuevo). Son cambios de reglas /
ownership → **pase deliberado, QA revisa, PR aparte** del backend de payouts.

## P2 — [VERIFICADO] El gate de finanzas no respeta los permisos del rol

`firestore.rules` (payments / expenses / goals):
```
allow read, write: if isBizOwnerUid(bizId) ||
                      (isBizStaff(bizId) && bizStaffRole(bizId) != "reception");
```
Concede finanzas a **cualquier staff que no sea exactamente `"reception"`**. Pero en
`DEFAULT_ROLES` (src/constants/businessRoles.js): `manager` tiene `finance:false`,
`instructor` **no** tiene finance, `reception` **no** tiene finance — **solo `owner`
tiene `finance:true`**. O sea: un **manager o instructor puede leer/escribir
`payments`/`expenses`/`goals` DIRECTO por el SDK de Firestore**, pese a que sus permisos
de rol dicen que no. El route guard del cliente (`roleAllows(perms,'finance')`) los oculta
en la UI, pero las reglas los dejan pasar → bypass. (El comentario de la regla hasta dice
"owner + instructor only", que ya contradice los perms.)

Severidad: **P2** — insider semi-confiable (staff manager/instructor), no atacante externo.

Fix — la regla debe checar el `perms.finance` REAL del rol, no `!= "reception"`. Dos opciones:
- **(a)** `get()` al doc del rol: `businesses/{bizId}/roles/{roleId}.perms.finance == true`.
  Preciso; 1 `get` extra por acceso (los built-ins ya se siembran como docs de rol al crear
  el negocio, así que existen). Manejar el caso de doc de rol faltante (default deny).
- **(b)** denormalizar `canFinance` (bool) en el doc de `staff`, seteado desde `perms.finance`
  al invitar / cambiar rol; la regla checa `staff.canFinance == true` (1 get, barato).
  Requiere backfill de staff existentes + mantenerlo en sync.

Reco: **(a)** para no arrastrar sync. **CUIDADO: es cambio de reglas** — un allow-list mal
puesto rompe acceso legítimo. Test con cada rol (owner sí · manager no · instructor no ·
reception no · custom con finance:true sí). Si se quiere, aplicar el mismo patrón a las demás
áreas gate-adas por rol (consistencia total) — fuera del scope mínimo de P2.

## P3 — [VERIFICADO] Owner-transfer sin integridad transaccional (hardening, bajo impacto)

- **`requestOwnerTransfer`** (index.js:~4207): el check "un pending por negocio" es
  read-query → `add` **sin transacción** (TOCTOU). Dos llamadas concurrentes del mismo dueño
  pueden crear dos `ownerTransfers` pendientes. Owner-gated, impacto bajo. Fix: id determinista
  `ownerTransfers/{bizId}` o `runTransaction`.
- **`approveOwnerTransfer`** (index.js:~4270): admin-gated (sólido). Pero usa
  `tr.fromUid`/`tr.toUid` capturados al pedir, **sin `runTransaction` y sin revalidar que
  `business.ownerUid` siga siendo `tr.fromUid`** al aprobar. Con transferencias encadenadas
  podría demotar a quien ya no es dueño o promover con datos viejos. Acotado por admin-gate +
  "un pending". Fix: aprobar dentro de `db.runTransaction`, releyendo `business.ownerUid` y
  confirmando `== tr.fromUid` antes de mover ownership.
- (opcional) `email_verified` en `requestOwnerTransfer`, por consistencia con #47.

Ninguno bloquea lanzamiento. Orden: **P2 antes que P3** (P2 es acceso real a finanzas).
