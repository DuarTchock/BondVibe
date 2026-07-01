/**
 * Strategic host insights that back the tappable Analytics tiles: finance
 * (trends + revenue per event), member breakdowns, and per-event ratings.
 */
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "./firebase";

const msOf = (ts) => (ts?.toMillis ? ts.toMillis() : ts ? new Date(ts).getTime() : 0);
const monthKey = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const hostReceives = (p) => {
  const r = Number(p.metadata?.hostReceives);
  return Number.isFinite(r) ? r : p.amount || 0;
};

/** Finance: total, this month, last-6-month trend, and revenue per event. */
export const getHostFinance = async (hostId = null) => {
  const uid = hostId || auth.currentUser?.uid;
  if (!uid) return null;
  const snap = await getDocs(query(collection(db, "payments"), where("hostId", "==", uid)));
  const byMonth = {};
  const byEvent = {};
  let total = 0;
  let month = 0;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  snap.forEach((d) => {
    const p = d.data();
    const cents = hostReceives(p);
    total += cents;
    const ms = msOf(p.createdAt);
    if (ms >= monthStart) month += cents;
    byMonth[ms ? monthKey(ms) : "—"] = (byMonth[ms ? monthKey(ms) : "—"] || 0) + cents;
    const ev = p.eventId || p.metadata?.eventId;
    if (ev) {
      byEvent[ev] = byEvent[ev] || { cents: 0, title: p.eventTitle || p.metadata?.eventTitle || "Event" };
      byEvent[ev].cents += cents;
    }
  });
  return {
    totalCentavos: total,
    monthCentavos: month,
    byMonth: Object.entries(byMonth).sort().slice(-6).map(([m, c]) => ({ month: m, cents: c })),
    byEvent: Object.entries(byEvent)
      .map(([id, v]) => ({ eventId: id, title: v.title, cents: v.cents }))
      .sort((a, b) => b.cents - a.cents),
  };
};

/** Member lists behind the tiles. */
export const getHostMembersDetail = async (hostId = null) => {
  const uid = hostId || auth.currentUser?.uid;
  if (!uid) return { memberships: [], redemptions: [] };
  const [mSnap, rSnap] = await Promise.all([
    getDocs(query(collection(db, "memberships"), where("hostId", "==", uid))),
    getDocs(query(collection(db, "membershipRedemptions"), where("hostId", "==", uid))),
  ]);
  return {
    memberships: mSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    redemptions: rSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  };
};

/** Average rating grouped by event (ratings change from event to event). */
export const getHostRatingsByEvent = async (hostId = null) => {
  const uid = hostId || auth.currentUser?.uid;
  if (!uid) return [];
  const snap = await getDocs(query(collection(db, "ratings"), where("hostId", "==", uid)));
  const byEvent = {};
  snap.forEach((d) => {
    const r = d.data();
    const ev = r.eventId || "—";
    byEvent[ev] = byEvent[ev] || { title: r.eventTitle || "Event", sum: 0, n: 0 };
    byEvent[ev].sum += r.rating || 0;
    byEvent[ev].n += 1;
  });
  return Object.entries(byEvent)
    .map(([id, v]) => ({ eventId: id, title: v.title, avg: v.n ? v.sum / v.n : 0, count: v.n }))
    .sort((a, b) => b.count - a.count);
};

const STOP = new Set(
  ("the a an and or but is was are be i you he she it we they this that of to in on for with at " +
    "my your our very really so much more most great good bad nice muy el la los las de que y a en " +
    "un una es fue con por para lo se su me te nos las del al como pero mas más").split(" ")
);

/** Free keyword frequency from review comments (no AI). */
export const extractKeywords = (comments) => {
  const freq = {};
  (comments || []).forEach((c) =>
    String(c || "")
      .toLowerCase()
      .replace(/[^a-záéíóúñ\s]/g, " ")
      .split(/\s+/)
      .forEach((w) => {
        if (w.length > 3 && !STOP.has(w)) freq[w] = (freq[w] || 0) + 1;
      })
  );
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));
};
