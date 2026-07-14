#!/usr/bin/env node
/**
 * One-off: grant the Firebase Auth custom claim {admin:true} to every user
 * whose Firestore doc has role=='admin'. This bootstraps admin authority into
 * the ID token (see isAdmin() in firestore.rules + isAdminUid in
 * functions/lib/auth.js), after which promoteToAdmin/revokeAdmin keep claims
 * in sync.
 *
 * Usage:  node scripts/migrate-admin-claims.mjs [--project kinlo-app-dev]
 * Auth:   your gcloud user credentials (must be Owner/Editor on the project).
 *         gcloud auth print-access-token
 *
 * Idempotent: re-running only re-affirms the claim. Affected users must
 * refresh their ID token (re-open the app / sign out+in) for the claim to
 * appear in request.auth.token.admin.
 */
import { execSync } from "node:child_process";

const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : dflt;
};
const PROJECT = arg("project", "kinlo-app-dev");
const token = execSync("gcloud auth print-access-token").toString().trim();

const authHeaders = {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json",
  // identitytoolkit admin methods require a billing/quota project when the
  // caller authenticates with user credentials.
  "X-Goog-User-Project": PROJECT,
};

const FS_BASE =
  `https://firestore.googleapis.com/v1/projects/${PROJECT}` +
  `/databases/(default)/documents`;
const IDTK =
  `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT}` +
  `/accounts:update`;

async function findAdminUids() {
  const res = await fetch(`${FS_BASE}:runQuery`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "users" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "role" },
            op: "EQUAL",
            value: { stringValue: "admin" },
          },
        },
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`runQuery failed: ${res.status} ${await res.text()}`);
  }
  const rows = await res.json();
  return rows
    .filter((r) => r.document)
    .map((r) => r.document.name.split("/").pop());
}

async function setAdminClaim(uid) {
  const res = await fetch(IDTK, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      localId: uid,
      customAttributes: JSON.stringify({ admin: true }),
    }),
  });
  if (!res.ok) {
    throw new Error(`setClaim ${uid} failed: ${res.status} ${await res.text()}`);
  }
}

const uids = await findAdminUids();
console.log(`Found ${uids.length} admin user(s): ${uids.join(", ") || "(none)"}`);
for (const uid of uids) {
  await setAdminClaim(uid);
  console.log(`  ✅ ${uid} → {admin:true}`);
}
console.log("Done. Affected admins must refresh their ID token.");
