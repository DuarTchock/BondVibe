/**
 * Event roster helper (fix/privacy-event-roster).
 *
 * The attendee roster moved OFF the world-readable events/{id}.attendees array
 * (anyone could read + de-anonymize it) INTO a gated subcollection
 * events/{id}/roster/{uid}, with capacity tracked by an integer participantCount
 * on the event doc. This module is the SINGLE source of truth for every money /
 * capacity write, so oversell + waitlist semantics live in exactly one place.
 *
 * Roster doc:  { uid, eventId, status: 'active'|'waitlist', joinedAt }
 *   - `uid` (field, not just doc id) → collectionGroup('roster').where('uid','==',me).
 *   - `status` → active counts toward capacity; waitlist does NOT.
 *   - `joinedAt` → FIFO order for waitlist promotion.
 * participantCount = number of ACTIVE roster docs (the oversell source of truth).
 *
 * All writes are Admin SDK (rules make the subcollection server-only), so these
 * bypass rules by design.
 */
const {FieldValue} = require("firebase-admin/firestore");

const eventRef = (db, eventId) => db.collection("events").doc(eventId);
const rosterRef = (db, eventId, uid) =>
  eventRef(db, eventId).collection("roster").doc(uid);
const rosterCol = (db, eventId) => eventRef(db, eventId).collection("roster");

const maxOf = (e) => e.maxAttendees || e.maxPeople || 0;

/**
 * Join `uid` to the roster INSIDE a caller's transaction, honoring capacity.
 * The caller MUST have already tx.get(eventRef) (Firestore requires all reads
 * before writes) and pass its data as `eventData`; this does one more read (the
 * roster doc) which is still in the read phase as long as the caller hasn't
 * written yet.
 *
 * @param {FirebaseFirestore.Transaction} tx the caller's transaction
 * @param {FirebaseFirestore.Firestore} db admin Firestore
 * @param {string} eventId the event
 * @param {object} eventData the event doc data (already read by the caller)
 * @param {string} uid the joiner
 * @return {Promise<'active'|'waitlist'|'already'>} placement
 */
async function joinRosterTx(tx, db, eventId, eventData, uid) {
  const rRef = rosterRef(db, eventId, uid);
  const existing = await tx.get(rRef);
  if (existing.exists) return "already";
  const max = maxOf(eventData);
  const count = eventData.participantCount || 0;
  const status = max && count >= max ? "waitlist" : "active";
  tx.set(rRef, {
    uid,
    eventId,
    status,
    joinedAt: FieldValue.serverTimestamp(),
  });
  if (status === "active") {
    tx.update(eventRef(db, eventId), {
      participantCount: FieldValue.increment(1),
    });
  }
  return status;
}

/**
 * Remove `uid` from the roster INSIDE a caller's transaction. Decrements
 * participantCount only if the doc was ACTIVE (waitlist docs never counted). The
 * caller must have read the roster doc already OR pass wasActive explicitly; here
 * we read it ourselves (read phase). Returns whether a spot was freed.
 *
 * @param {FirebaseFirestore.Transaction} tx the caller's transaction
 * @param {FirebaseFirestore.Firestore} db admin Firestore
 * @param {string} eventId the event
 * @param {string} uid the leaver
 * @return {Promise<{removed:boolean, freedSpot:boolean}>} outcome
 */
async function leaveRosterTx(tx, db, eventId, uid) {
  const rRef = rosterRef(db, eventId, uid);
  const snap = await tx.get(rRef);
  if (!snap.exists) return {removed: false, freedSpot: false};
  const wasActive = snap.data().status === "active";
  tx.delete(rRef);
  if (wasActive) {
    tx.update(eventRef(db, eventId), {
      participantCount: FieldValue.increment(-1),
    });
  }
  return {removed: true, freedSpot: wasActive};
}

/**
 * Promote the oldest waitlisted roster doc to active IF there is capacity — the
 * FIFO waitlist promotion, run from the roster trigger after an active leaver.
 * Its own transaction: re-reads capacity + the head of the waitlist so concurrent
 * leaves can't over-promote. Returns the promoted uid or null.
 *
 * @param {FirebaseFirestore.Firestore} db admin Firestore
 * @param {string} eventId the event
 * @return {Promise<string|null>} the promoted uid, or null if none/no room
 */
async function promoteOldestWaitlist(db, eventId) {
  // Read the single oldest waitlist doc OUTSIDE the tx to get a candidate, then
  // re-validate inside the tx (capacity + still-waitlisted) before promoting.
  const head = await rosterCol(db, eventId)
    .where("status", "==", "waitlist")
    .orderBy("joinedAt", "asc")
    .limit(1)
    .get();
  if (head.empty) return null;
  const candidateUid = head.docs[0].id;

  return db.runTransaction(async (tx) => {
    const eSnap = await tx.get(eventRef(db, eventId));
    if (!eSnap.exists) return null;
    const e = eSnap.data();
    if (e.status === "cancelled") return null;
    const max = maxOf(e);
    const count = e.participantCount || 0;
    if (max && count >= max) return null; // no room
    const cRef = rosterRef(db, eventId, candidateUid);
    const cSnap = await tx.get(cRef);
    if (!cSnap.exists || cSnap.data().status !== "waitlist") return null; // raced
    tx.update(cRef, {status: "active", promotedAt: FieldValue.serverTimestamp()});
    tx.update(eventRef(db, eventId), {participantCount: FieldValue.increment(1)});
    return candidateUid;
  });
}

module.exports = {
  eventRef,
  rosterRef,
  rosterCol,
  maxOf,
  joinRosterTx,
  leaveRosterTx,
  promoteOldestWaitlist,
};
