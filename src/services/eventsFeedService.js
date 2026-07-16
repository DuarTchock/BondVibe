/**
 * eventsFeedService — read-only feed of upcoming public events for the Home
 * "Events near you" carousel (M0). Mirrors the SearchEvents base query so the
 * Home surface matches the events tab: date >= now, soonest-first, cancelled
 * filtered out. No new engine — a single read.
 *
 * NOTE: "near you" ordering is not implemented (no geolocation source yet) — the
 * row shows query order (soonest-first); distance sort is a follow-up.
 */
import { collection, query, where, orderBy, limit as qLimit, getDocs } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Upcoming public events, soonest-first.
 * @param {number} [max=10]
 * @returns {Promise<Array>} event docs ({ id, title, date, images, ... })
 */
export async function getUpcomingEvents(max = 10) {
  const nowISO = new Date().toISOString();
  const q = query(
    collection(db, "events"),
    where("date", ">=", nowISO),
    orderBy("date", "asc"),
    qLimit(max)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((e) => e.status !== "cancelled");
}
