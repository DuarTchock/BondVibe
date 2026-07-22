/**
 * Integration tests for fix/roster-migration-client — the getEventCoAttendees
 * callable that lets a PARTICIPANT (not just the host) read the co-attendee list
 * once the roster is gated (#55 removed the public attendees array).
 *
 *   npm run test:payments
 *
 * Gate: the caller must be the host/co-host OR on the event roster. A stranger is
 * denied — the callable must not re-expose the roster the migration just gated.
 */
const test = require("node:test");
const assert = require("node:assert");
const admin = require("firebase-admin");

const PROJECT = process.env.GCLOUD_PROJECT || "kinlo-app-dev";
process.env.FIRESTORE_EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST =
  process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";

const FN = `http://127.0.0.1:5001/${PROJECT}/us-central1`;
const IDT = `http://127.0.0.1:${
  process.env.FIREBASE_AUTH_EMULATOR_HOST.split(":")[1]
}/identitytoolkit.googleapis.com/v1/accounts`;

if (!admin.apps.length) admin.initializeApp({projectId: PROJECT});
const db = admin.firestore();

let uniq = 0;
const nextId = () => `rc${Date.now()}_${uniq++}`;

const tokenFor = async (uid) => {
  const email = `${uid}@kinlo.test`;
  const password = "Test123456!";
  try {
    await admin.auth().createUser({uid, email, password, emailVerified: true});
  } catch (e) {
    await admin.auth().updateUser(uid, {email, password, emailVerified: true});
  }
  const r = await fetch(`${IDT}:signInWithPassword?key=fake`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({email, password, returnSecureToken: true}),
  }).then((x) => x.json());
  return r.idToken;
};

const call = (name, data, token) =>
  fetch(`${FN}/${name}`, {
    method: "POST",
    headers: {"Content-Type": "application/json",
      ...(token ? {Authorization: `Bearer ${token}`} : {})},
    body: JSON.stringify({data}),
  }).then(async (r) => ({status: r.status, body: await r.json().catch(() => ({}))}));

// One event, host + one active roster attendee (the migration scenario).
const seed = async () => {
  const eventId = `evt_${nextId()}`;
  const host = `host_${nextId()}`;
  const attendee = `att_${nextId()}`;
  await db.collection("events").doc(eventId).set({creatorId: host, title: "Yoga"});
  await db.collection("events").doc(eventId).collection("roster").doc(attendee)
    .set({uid: attendee, eventId, status: "active"});
  await db.collection("users").doc(attendee).set({fullName: "Ana", location: "Tulum"});
  return {eventId, host, attendee};
};

test("RC1 the host reads the co-attendee list (1 attendee on the roster)", async () => {
  const {eventId, host} = await seed();
  const res = await call("getEventCoAttendees", {eventId}, await tokenFor(host));
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.result.attendees.length, 1);
  assert.strictEqual(res.body.result.attendees[0].name, "Ana");
});

test("RC2 a fellow PARTICIPANT can read it too", async () => {
  const {eventId, attendee} = await seed();
  const res = await call("getEventCoAttendees", {eventId}, await tokenFor(attendee));
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.result.attendees.length, 1);
});

test("RC3 a NON-participant stranger is denied (roster stays gated)", async () => {
  const {eventId} = await seed();
  const stranger = await tokenFor(`stranger_${nextId()}`);
  const res = await call("getEventCoAttendees", {eventId}, stranger);
  assert.strictEqual(res.status, 403);
  assert.match(JSON.stringify(res.body), /not_a_participant/);
});
