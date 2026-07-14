#!/usr/bin/env node
/**
 * F2 Phase B — STRIP the exact location from PUBLIC event docs (after soak).
 *
 * Removes `location`, `locationCoords`, `venueAddress`, `placeId` from
 * events/{id}. The exact detail then lives ONLY in events/{id}/private/location
 * (participant-gated by rules), realizing the F2 security goal.
 *
 * ⚠️ DESTRUCTIVE + BUILD-COUPLED. An OLD app build (without EventLocationBlock)
 * reads event.location directly, so after this strip those builds show an EMPTY
 * location with no way to reveal it. Run ONLY once the native build carrying the
 * F2 reveal UI is in users' hands. The rule: reveal UI first, strip after.
 *
 * GUARDS — ALL must pass before anything is written:
 *   1. BUILD guard: writing requires BOTH `--apply` AND `--build-shipped`. The
 *      script cannot detect whether the reveal build is actually live for users,
 *      so `--build-shipped` is YOUR explicit assertion that it is. Without it,
 *      the script refuses to strip (even with --apply).
 *   2. DATA guard (per event): only strips a GATED event (has area/approxCoords)
 *      whose private/location doc already holds the exact detail (exactCoords OR
 *      address). Un-migrated events (no gating fields) and events whose private
 *      doc is missing/empty are SKIPPED — so no attendee ever loses the address.
 *
 * Usage:   node scripts/migrate-event-location-strip.mjs [--project kinlo-app-dev] [--apply --build-shipped]
 * Default: DRY RUN (prints the plan, writes nothing).
 * Auth:    gcloud user credentials (Owner/Editor). REST bypasses rules.
 *          gcloud auth print-access-token
 * Idempotent: an event with no public exact fields left is skipped.
 */
import { execSync } from "node:child_process";

const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : dflt;
};
const PROJECT = arg("project", "kinlo-app-dev");
const APPLY = process.argv.includes("--apply");
const BUILD_SHIPPED = process.argv.includes("--build-shipped");
const token = execSync("gcloud auth print-access-token").toString().trim();

const headers = {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json",
  "X-Goog-User-Project": PROJECT,
};
const FS_BASE =
  `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

const segmentsOf = (name) => name.split("/documents/")[1].split("/");
const hasMap = (fld) => fld != null && fld.mapValue != null;
const hasStr = (fld) => fld != null && typeof fld.stringValue === "string" && fld.stringValue.trim() !== "";

async function runQuery(structuredQuery) {
  const res = await fetch(`${FS_BASE}:runQuery`, {
    method: "POST", headers, body: JSON.stringify({ structuredQuery }),
  });
  if (!res.ok) throw new Error(`runQuery failed: ${res.status} ${await res.text()}`);
  return (await res.json()).filter((r) => r.document).map((r) => r.document);
}
async function getDoc(path) {
  const res = await fetch(`${FS_BASE}/${path}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`get ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}
// Delete fields: list them in updateMask but omit them from the body.
async function deleteFields(path, fieldPaths) {
  const mask = fieldPaths.map((p) => `updateMask.fieldPaths=${encodeURIComponent(p)}`).join("&");
  const res = await fetch(`${FS_BASE}/${path}?${mask}`, {
    method: "PATCH", headers, body: JSON.stringify({ fields: {} }),
  });
  if (!res.ok) throw new Error(`strip ${path} failed: ${res.status} ${await res.text()}`);
}

const STRIP_FIELDS = ["location", "locationCoords", "venueAddress", "placeId"];

console.log(`\n🔒 F2 Phase B — strip exact location from PUBLIC docs — project ${PROJECT} ${APPLY ? "(APPLY)" : "(dry run)"}\n`);
const events = await runQuery({ from: [{ collectionId: "events" }] });
console.log(`Found ${events.length} event(s).`);

const plan = [];
let skipUngated = 0;   // no area/approxCoords → un-migrated; stripping would blank it
let skipNoPrivate = 0; // private/location missing or has no exact → unsafe to strip
let skipNothing = 0;   // already has no public exact fields

for (const ev of events) {
  const f = ev.fields || {};
  const eid = segmentsOf(ev.name)[1];

  const gated = hasStr(f.area) || hasMap(f.approxCoords);
  if (!gated) { skipUngated++; continue; }

  const present = STRIP_FIELDS.filter((k) => f[k] != null);
  if (present.length === 0) { skipNothing++; continue; }

  // DATA guard: the exact detail MUST already live in the private doc.
  const priv = await getDoc(`events/${eid}/private/location`);
  const pf = priv?.fields || {};
  const privateHasExact = hasMap(pf.exactCoords) || hasStr(pf.address);
  if (!privateHasExact) { skipNoPrivate++; continue; }

  plan.push({ eid, present });
}

console.log(`\nPlan:`);
console.log(`  • ${plan.length} event(s) will have [${STRIP_FIELDS.join(", ")}] removed from the public doc`);
console.log(`  • ${skipUngated} skipped — un-migrated (no area/approxCoords): run migrate-event-location.mjs --apply first`);
console.log(`  • ${skipNoPrivate} skipped — private/location missing the exact detail (UNSAFE to strip)`);
console.log(`  • ${skipNothing} skipped — already stripped\n`);
for (const p of plan.slice(0, 40)) console.log(`    ${p.eid}: strip [${p.present.join(", ")}]`);
if (plan.length > 40) console.log(`    …and ${plan.length - 40} more`);

if (!APPLY) {
  console.log(`\n(dry run — nothing written. To strip: --apply --build-shipped.)\n`);
  process.exit(0);
}

// BUILD guard — the last line of defense against the reveal/migration skew.
if (!BUILD_SHIPPED) {
  console.error(
    `\n⛔ REFUSING to strip. Phase B removes the exact location from public docs — ` +
    `old app builds without the F2 reveal UI (EventLocationBlock) would then show an ` +
    `EMPTY location with no way to reveal it.\n\n` +
    `   Only proceed once the native build carrying EventLocationBlock is in users' ` +
    `hands (TestFlight/store). Then assert it explicitly:\n\n` +
    `     node scripts/migrate-event-location-strip.mjs --apply --build-shipped\n`,
  );
  process.exit(1);
}

console.log(`\n⚠️  --build-shipped asserted. Stripping exact location from ${plan.length} public doc(s)…`);
let done = 0;
for (const p of plan) {
  await deleteFields(`events/${p.eid}`, p.present);
  done++;
}
console.log(`  ✅ Stripped ${done} event(s). Exact location now lives only in events/{id}/private/location.\n`);
