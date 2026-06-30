/**
 * E2E proof: a host archiving (or deleting) a membership plan must NOT affect a
 * user who already bought it and still has valid credits. Runs against the LIVE
 * project. Memberships are server-only, so seeding one needs an Admin token —
 * this script reads it from `gcloud auth print-access-token`.
 *
 * Usage:  node scripts/e2e-membership.js
 *
 * Skips (exit 0) if no gcloud admin token is available. Exits non-zero on a
 * real assertion failure.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const app = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "app.json"), "utf8"));
const API_KEY = app.expo.extra.EXPO_PUBLIC_FIREBASE_API_KEY;
const PROJECT = app.expo.extra.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const IDT = "https://identitytoolkit.googleapis.com/v1/accounts";
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const FN = `https://us-central1-${PROJECT}.cloudfunctions.net`;

let GT;
try {
  GT = execSync("gcloud auth print-access-token", { stdio: ["ignore", "pipe", "ignore"] })
    .toString()
    .trim();
} catch {
  console.log("⚠️  No gcloud admin token — skipping membership E2E (needs `gcloud auth login`).");
  process.exit(0);
}

const adm = { Authorization: `Bearer ${GT}`, "Content-Type": "application/json" };
const s = (v) => ({ stringValue: v });
const i = (v) => ({ integerValue: v });
const b = (v) => ({ booleanValue: v });
const ts = (v) => ({ timestampValue: v });

let pass = 0, fail = 0;
const chk = (name, got, want) => {
  got === want ? (pass++, console.log(`  ✓ ${name}`)) : (fail++, console.log(`  ✗ ${name} → got ${got}, want ${want}`));
};
const mk = async () => {
  const r = await fetch(`${IDT}:signUp?key=${API_KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `mem_${Date.now()}_${Math.random().toString(36).slice(2)}@bv-test.com`, password: "Test123456!", returnSecureToken: true }),
  }).then((r) => r.json());
  return { uid: r.localId, h: { Authorization: `Bearer ${r.idToken}`, "Content-Type": "application/json" } };
};
const reserve = (evId, h) =>
  fetch(`${FN}/reserveMembershipCredit`, { method: "POST", headers: h, body: JSON.stringify({ data: { eventId: evId } }) }).then(async (r) => (await r.json()));
const del = (p) => fetch(`${FS}/${p}`, { method: "DELETE", headers: adm });

(async () => {
  console.log(`Membership E2E against ${PROJECT}\n========================================`);
  console.log("Plan archival vs. existing credits");

  const host = await mk(), member = await mk(), noMember = await mk();
  const planId = `pp_${Date.now()}`, evId = `ev_${Date.now()}`, memId = `mm_${Date.now()}`;
  const future = new Date(Date.now() + 30 * 864e5).toISOString();

  await fetch(`${FS}/membershipPlans?documentId=${planId}`, { method: "POST", headers: host.h, body: JSON.stringify({ fields: {
    hostId: s(host.uid), name: s("Class Pack 3"), type: s("credits"), credits: i(3), active: b(true),
  } }) });
  // Server-only: seed the member's purchased membership with the Admin token.
  await fetch(`${FS}/memberships?documentId=${memId}`, { method: "POST", headers: adm, body: JSON.stringify({ fields: {
    userId: s(member.uid), hostId: s(host.uid), planId: s(planId), planName: s("Class Pack 3"),
    type: s("credits"), creditsRemaining: i(3), status: s("active"), expiresAt: ts(future),
  } }) });
  await fetch(`${FS}/events?documentId=${evId}`, { method: "POST", headers: host.h, body: JSON.stringify({ fields: {
    creatorId: s(host.uid), title: s("Yoga"), status: s("active"), price: i(0), date: ts(future),
  } }) });

  // Host ARCHIVES the plan while the member still has 3 credits.
  const arch = await fetch(`${FS}/membershipPlans/${planId}?updateMask.fieldPaths=active`, { method: "PATCH", headers: host.h, body: JSON.stringify({ fields: { active: b(false) } }) });
  chk("host archives the plan", arch.status, 200);

  // The member can STILL use a credit after archival.
  const r1 = await reserve(evId, member.h);
  chk("member with credits can still reserve after archival", r1.result?.success, true);

  // A user without a membership is correctly blocked.
  const r2 = await reserve(evId, noMember.h);
  chk("user without a membership is blocked", /No active membership/.test(r2.error?.message || ""), true);

  for (const p of [`membershipPlans/${planId}`, `memberships/${memId}`, `events/${evId}`]) await del(p);

  console.log(`\n========================================\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
