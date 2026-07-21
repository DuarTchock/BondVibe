# Auditoría — matchmaking

Read-only sobre las callables/triggers de matching y firestore.rules (main). El P1 lo
verificó QA. Buena noticia: los caminos de ESCRITURA (likes/matches/intros/grupos) y el
secreto de "quién dio like a quién" están sólidos y son server-authoritative. La debilidad
está en la LECTURA.

## P1 — [QA VERIFICADO] Personality (Big-Five) + matchProfile de TODOS, legibles por cualquiera

`firestore.rules:112` → `match /users/{userId} { allow read: if isSignedIn(); }`. El doc de
usuario es **mundo-legible para cualquier logueado**. Y ahí viven los datos sensibles de
matching: `users/{uid}.personality` (scores Big-Five) y `users/{uid}.matchProfile`
(intereses, `lookingFor` = intención **romántica**/amistad/profesional, `pro.seek/offer`,
energía, bio) — escritos por `matchingService.js:213-228` / `:166`.

Exploit (confirmado): cualquier cuenta autenticada (sin opt-in de matchmaking, sin check-in,
sin Plus) hace `getDocs(collection('users'))` y lee `.personality` y `.matchProfile` de
**todos**. Anula el paywall de `discoverForYou`, la regla de "comunidad compartida", las
exclusiones y los bloqueos. Roza P0; lo mantengo en P1 solo porque nombre/foto son públicos
por diseño — la sobre-exposición es de los **scores crudos + la intención**.

El equipo blindó bien lo que se puede ESCRIBIR al doc (denylist de #42), pero nunca restringió
lo que se LEE de los demás. **Este es el root cause** que también amplifica el P2 de eventos
(deanonimizar asistentes resolviendo uid→nombre).

Fix: mover `personality` + `matchProfile` (y cualquier PII no-pública) a una subcolección
gated (`users/{uid}/match/profile`) legible solo bajo el gate de matchmaking, o quitarlos del
doc público y servirlos solo por la respuesta curada de `discoverForYou`. **Es un refactor con
cuidado** — muchas features leen el doc de usuario por nombre/foto; hay que separar público vs
gated, no solo cerrar la regla.

## P2 — `matchPool/{userId}` legible por cualquier participante "activo", sin acotar al target
`firestore.rules:897` valida solo al lector (`matchmakingActive`), no que tenga derecho a ESTE
target. Y `matchmaking.*` es self-writable → un atacante se marca "activo" y hace
`getDocs(query(matchPool, where('enabled','==',true)))` → cosecha displayName/photo/personality/
lookingFor/pro/interests/communities de todos. Fix: acotar la lectura a los uids que el server
curó para el caller (o `matchPool` solo Admin SDK + identidades por la callable).

## P3 (hardening)
- `createLikeAndMaybeMatch` (matching.js:261) checa el check-in del caller pero no el de `toUid`
  (mismatch con el comentario; no filtra ni notifica porque el match recíproco lo exige). Menor.
- Sin `email_verified` en las callables de matchmaking (like/intro/curated/join/discover), a
  diferencia de eventos. Alinear.

## Verificado SEGURO
Quién-dio-like (`likes/edges` server-only, sin notificación en one-way), forjar matches
(`matches`/`matchChats` client-read-only, server-write), match-intro (edges server-only, sin
contacto arbitrario), group-join (`candidates.includes(me)`, cap, chat gated), config/analytics
(`setMatchingConfig` host+premium; `getHostMatchAnalytics` solo counts por evento;
`advanceMatchingWindows`/`generateWeeklyCuratedSets`/`formMatchGroups` son onSchedule, sin
superficie client). `curatedSets`/`matchExclusions` owner-read-only.

---
PROMPT → plugin (ronda privacidad · PR aparte, NO merge):
[P1] Saca personality + matchProfile del doc mundo-legible users/{uid}: muévelos a
users/{uid}/match/profile (o campos gated) legibles solo bajo el gate de matchmaking; ajusta
matchingService/discover para leer de ahí. NO rompas las lecturas de nombre/foto que hacen otras
features. Test: un usuario NO puede leer el personality/matchProfile de otro sin el gate.
[P2] Acota matchPool read a uids curados para el caller (o hazlo Admin-SDK-only). NO merge: QA revisa.
