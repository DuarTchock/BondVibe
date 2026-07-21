# Auditoría — social (muro / DMs / notificaciones)

Read-only sobre firestore.rules, storage.rules y los handlers/servicios de wall/DMs/
grupos/notificaciones (main). No urgente (sin P0). El P1 lo verificó QA leyendo las reglas.

## P1 — [QA VERIFICADO] Envenenamiento de hilo DM: espiar los mensajes futuros de otro

`firestore.rules` (create de `/dms/{threadId}`, ~779): exige solo `users` es lista de 2 con
el caller dentro — **nunca valida que `threadId` derive del par `users`**. El `threadId` es
`sort(A,B)` (determinista/adivinable) y el cliente reusa el doc si ya existe.

Exploit (confirmado): el atacante E crea `dms/{sort(A,B)}` con `users:[E,A]` (E dentro,
size 2 → pasa). Cuando A abre el chat con B, su cliente calcula el mismo `threadId`,
encuentra el doc envenenado y lo reusa. A escribe → los mensajes caen en un hilo donde E
es participante → **E lee los mensajes privados de A** (que A creía dirigidos a B) y puede
inyectar como E. B queda excluido silenciosamente.

Fix: en el `create` atar `threadId` al par: `request.resource.data.users[0] < users[1]` y
`threadId == users[0] + "_" + users[1]`. Así un doc cuyo id no derive de `users` se rechaza.

## P2 — Posts de comunidad "privada" legibles por cualquiera
`firestore.rules:701` `allow read: if isSignedIn()` para TODOS los posts. El doc de la
comunidad es members-only, pero la LECTURA de `posts` no filtra por `communityId`, y los
`communityId` son descubribles en CTAs públicas → un no-miembro hace `getCommunityPosts(X)`
y recibe todo el muro privado. Fix: separar muros de comunidad a `hostGroups/{id}/posts`
(regla de membresía existente), o gatear la lectura por `isCommunityMember`.

## P2 — `createNotification`: destinatario arbitrario + texto libre
`functions/index.js:368`. Fija bien `fromUserId` (no spoofeable), pero `userId` es cualquier
víctima y solo 2 `type` están en denylist; `title`/`message`/`titleKey`/`bodyKey` son libres
→ un atacante reproduce copy de confianza ("Verified Host!") con otro `type`, a cualquier
usuario, sin rate-limit (spam/phishing). Fix: allowlist de `type` permitidos al cliente,
gatear los `titleKey`/`bodyKey` sensibles, rate-limit por emisor.

## P2 — Ninguna escritura social exige `email_verified`
Solo `events` (create) lo exige. DMs, posts, comments, follows, group messages: no. Una
cuenta con email sin verificar puede escribir en toda la superficie más abusable. Fix:
añadir `email_verified == true` a esos `create` (evaluar UX de onboarding).

## P3 (hardening, del reporte del auditor)
- DM `update` sin field-lock: un participante puede meter un 3ro al array `users` (lee el
  histórico). Fix: `onlyUpdating(['lastMessage','lastSenderId','updatedAt','lastReadAt'])`.
- Auto-follow (`followeeId==followerId`) infla el propio contador. Fix: prohibirlo en la regla.
- Moments `expiresAt` lo fija el cliente → se anula la efemeridad de 24h. Fix: acotar en regla.
- `recordPostEvent` sin dedupe → inflar views/ctaClicks de cualquier post. Fix: dedupe/rate-limit.
- `joinGroupByCode` sin `email_verified`/rate-limit; código con `Math.random`. Fix: los tres.

## Verificado SEGURO
Forja directa de notificaciones (create: if false), spoofing de autor/emisor (senderId/authorId
anclados a auth.uid en todas las superficies), inflar likeCount/commentCount (solo triggers
Admin SDK), likes 1×usuario, membresía de grupo (no-miembros no leen/postean), event chat y DMs
existentes (solo participantes), storage social (namespaced por uid, sin SVG, con límites).

---
PROMPT → plugin (cuando se decida el pase social · PR aparte, NO merge):
Arregla el P1 (envenenamiento de hilo DM) en firestore.rules: en el create de /dms/{threadId}
exige users[0] < users[1] y threadId == users[0]+"_"+users[1] (atar el id al par). Test: E no
puede crear dms/{sort(A,B)} con users [E,A]. Opcional en el mismo PR: field-lock del update de
/dms (onlyUpdating lastMessage/lastSenderId/updatedAt/lastReadAt) y prohibir auto-follow. NO
merge: QA revisa.
