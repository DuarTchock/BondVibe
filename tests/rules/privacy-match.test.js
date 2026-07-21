/**
 * Security-rules tests for fix/privacy-user-match-fields (privacy round 1).
 *
 *   [P1] personality + matchProfile moved OFF the world-readable users doc into
 *        users/{uid}/match/{doc}, gated: owner/admin, or a peer only while the
 *        owner is an active matchmaker. The main users doc denylists these fields
 *        so they can't be written back to the world-readable doc.
 *   [P2] matchPool/{uid} read narrowed to the caller's curated uids
 *        (curatedSets/{caller}.memberUids) instead of any active matchmaker.
 *
 * Run:  npm run test:rules
 */
const fs = require("fs");
const path = require("path");
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const { doc, setDoc, updateDoc, getDoc } = require("firebase/firestore");

const ROOT = path.join(__dirname, "..", "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const FS_EMU = { host: "127.0.0.1", port: 8080 };

// An active-matchmaking `matchmaking` map (satisfies matchmakingActive()).
const ACTIVE_MM = {
  consentAt: new Date("2026-01-01T00:00:00Z"),
  profileComplete: true,
  enabled: true,
};

let env;
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "kinlo-privacy-match",
    firestore: { rules: read("firestore.rules"), ...FS_EMU },
  });
});
afterAll(async () => env?.cleanup());
beforeEach(async () => env.clearFirestore());

const asUser = (uid, claims) => env.authenticatedContext(uid, claims).firestore();
const seed = (fn) => env.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));
const matchDoc = (db, uid) => doc(db, "users", uid, "match", "profile");

// ===========================================================================
// [P1] users/{uid}/match/{doc} — gated read/write
// ===========================================================================
describe("P1 · users/{uid}/match/profile — gated", () => {
  const PROFILE = { personality: { O: 5, C: 4, E: 3, A: 4, N: 2 }, matchProfile: { interests: ["x"] } };

  test("the owner reads their own match profile", async () => {
    await seed((db) => setDoc(matchDoc(db, "alice"), PROFILE));
    await assertSucceeds(getDoc(matchDoc(asUser("alice"), "alice")));
  });

  test("a peer CANNOT read another's match profile when the owner is NOT matchmaking-active", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "users", "bob"), { role: "user" }); // no matchmaking
      await setDoc(matchDoc(db, "bob"), PROFILE);
    });
    // This is the core leak the move closes: a stranger reading personality.
    await assertFails(getDoc(matchDoc(asUser("mallory"), "bob")));
  });

  test("a peer CAN read another's match profile when the owner IS matchmaking-active (the gate)", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "users", "carol"), { role: "user", matchmaking: ACTIVE_MM });
      await setDoc(matchDoc(db, "carol"), PROFILE);
    });
    await assertSucceeds(getDoc(matchDoc(asUser("someone"), "carol")));
  });

  test("an admin reads any match profile", async () => {
    await seed((db) => setDoc(matchDoc(db, "bob"), PROFILE));
    await assertSucceeds(getDoc(matchDoc(asUser("admin1", { admin: true }), "bob")));
  });

  test("the owner writes their own match profile; a peer cannot", async () => {
    await assertSucceeds(setDoc(matchDoc(asUser("alice"), "alice"), PROFILE));
    await assertFails(setDoc(matchDoc(asUser("mallory"), "alice"), PROFILE));
  });
});

// ===========================================================================
// [P1] main users doc — personality/matchProfile can't be written to it
// ===========================================================================
describe("P1 · users/{uid} main doc — personality/matchProfile denylisted", () => {
  test("update: writing personality to the world-readable doc is denied", async () => {
    await seed((db) => setDoc(doc(db, "users", "alice"), { role: "user", fullName: "A" }));
    const db = asUser("alice");
    await assertFails(updateDoc(doc(db, "users", "alice"), { personality: { O: 5 } }));
  });

  test("update: writing matchProfile to the world-readable doc is denied", async () => {
    await seed((db) => setDoc(doc(db, "users", "alice"), { role: "user" }));
    const db = asUser("alice");
    await assertFails(updateDoc(doc(db, "users", "alice"), { matchProfile: { interests: ["x"] } }));
  });

  test("create: a new account can't seed personality/matchProfile on the main doc", async () => {
    const db = asUser("alice");
    await assertFails(
      setDoc(doc(db, "users", "alice"), { role: "user", personality: { O: 5 } })
    );
  });

  test("NO OVER-BLOCK: an unrelated profile edit (fullName) still works", async () => {
    await seed((db) => setDoc(doc(db, "users", "alice"), { role: "user", fullName: "A" }));
    const db = asUser("alice");
    await assertSucceeds(updateDoc(doc(db, "users", "alice"), { fullName: "Alice B" }));
  });
});

// ===========================================================================
// [P2] matchPool/{uid} — read scoped to the caller's curated uids
// ===========================================================================
describe("P2 · matchPool read — curated-scoped", () => {
  const seedActiveCaller = (db, caller, memberUids) =>
    Promise.all([
      setDoc(doc(db, "users", caller), { role: "user", matchmaking: ACTIVE_MM }),
      setDoc(doc(db, "curatedSets", caller), { memberUids, weekOf: "2026-W01" }),
    ]);

  test("an active caller reads a pool doc that IS in their curated set", async () => {
    await seed(async (db) => {
      await seedActiveCaller(db, "alice", ["carol", "dave"]);
      await setDoc(doc(db, "matchPool", "carol"), { userId: "carol", enabled: true });
    });
    await assertSucceeds(getDoc(doc(asUser("alice"), "matchPool", "carol")));
  });

  test("an active caller CANNOT read a pool doc NOT in their curated set", async () => {
    await seed(async (db) => {
      await seedActiveCaller(db, "alice", ["carol"]);
      await setDoc(doc(db, "matchPool", "stranger"), { userId: "stranger", enabled: true });
    });
    await assertFails(getDoc(doc(asUser("alice"), "matchPool", "stranger")));
  });

  test("a NON-active caller cannot read any pool doc", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "users", "eve"), { role: "user" }); // not matchmaking-active
      await setDoc(doc(db, "curatedSets", "eve"), { memberUids: ["carol"] });
      await setDoc(doc(db, "matchPool", "carol"), { userId: "carol", enabled: true });
    });
    await assertFails(getDoc(doc(asUser("eve"), "matchPool", "carol")));
  });

  test("the owner reads their own pool doc", async () => {
    await seed((db) => setDoc(doc(db, "matchPool", "carol"), { userId: "carol", enabled: true }));
    await assertSucceeds(getDoc(doc(asUser("carol"), "matchPool", "carol")));
  });
});
