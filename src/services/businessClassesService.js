/**
 * businessClassesService — scheduling (kinlo_business/01 §5). Recurring weekly
 * classes (or one-off), instructor, capacity + waitlist with auto-promote on a
 * cancellation. Roster booking is manual-first (host books members); marking
 * present flows through the attendance ledger (Block 2).
 *
 * Data: businesses/{bizId}/classes/{classId}
 *   title, instructor, weekdays[0-6], time"HH:MM", date?(ISO one-off),
 *   durationMin, capacity, location, roster:[{memberId,name}],
 *   waitlist:[{memberId,name}], public, branchId?
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { getMyBizId } from "./businessService";

const classesCol = (bizId) => collection(db, "businesses", bizId, "classes");
const classRef = (bizId, id) => doc(db, "businesses", bizId, "classes", id);

const timeToMin = (time) => {
  const [h, m] = String(time || "0:0").split(":").map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
};

export async function listClasses(bizId = getMyBizId()) {
  if (!bizId) return [];
  try {
    const snap = await getDocs(classesCol(bizId));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => timeToMin(a.time) - timeToMin(b.time));
  } catch (e) {
    console.error("listClasses failed:", e?.message || e);
    return [];
  }
}

/** Classes scheduled on a given weekday (0=Sun): recurring or one-off. */
export function classesOnWeekday(classes, weekday) {
  return classes.filter((c) => {
    if (Array.isArray(c.weekdays) && c.weekdays.includes(weekday)) return true;
    if (c.date && new Date(c.date).getDay() === weekday) return true;
    return false;
  });
}

export async function getClass(classId, bizId = getMyBizId()) {
  if (!bizId || !classId) return null;
  const snap = await getDoc(classRef(bizId, classId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createClass(data = {}, bizId = getMyBizId()) {
  if (!bizId) throw new Error("no_business");
  const payload = {
    title: (data.title || "").trim(),
    instructor: (data.instructor || "").trim() || null,
    weekdays: Array.isArray(data.weekdays) ? data.weekdays : [],
    time: data.time || "18:00",
    date: data.date || null,
    durationMin: data.durationMin ? parseInt(data.durationMin, 10) : 60,
    capacity: Math.max(1, parseInt(data.capacity, 10) || 12),
    location: (data.location || "").trim() || null,
    roster: [],
    waitlist: [],
    public: data.public === true,
    branchId: data.branchId || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(classesCol(bizId), payload);
  return { id: ref.id, ...payload };
}

export async function updateClass(classId, patch = {}, bizId = getMyBizId()) {
  if (!bizId || !classId) return;
  await updateDoc(classRef(bizId, classId), { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteClass(classId, bizId = getMyBizId()) {
  if (!bizId || !classId) return;
  await deleteDoc(classRef(bizId, classId));
}

/**
 * Book a member into a class. Adds to the roster if there's space, else to the
 * waitlist. Idempotent.
 * @returns {Promise<{status:'roster'|'waitlist'|'already'}>}
 */
export async function bookMember(cls, member, bizId = getMyBizId()) {
  if (!bizId || !cls?.id || !member?.id) return { status: "already" };
  const roster = Array.isArray(cls.roster) ? [...cls.roster] : [];
  const waitlist = Array.isArray(cls.waitlist) ? [...cls.waitlist] : [];
  if (roster.some((r) => r.memberId === member.id) || waitlist.some((w) => w.memberId === member.id)) {
    return { status: "already" };
  }
  const entry = { memberId: member.id, name: member.name || "" };
  let status;
  if (roster.length < (cls.capacity || 1)) {
    roster.push(entry);
    status = "roster";
  } else {
    waitlist.push(entry);
    status = "waitlist";
  }
  await updateClass(cls.id, { roster, waitlist }, bizId);
  return { status };
}

/**
 * Remove a member from the roster; auto-promote the first waitlisted member.
 * @returns {Promise<{promoted:object|null}>}
 */
export async function removeFromRoster(cls, memberId, bizId = getMyBizId()) {
  if (!bizId || !cls?.id) return { promoted: null };
  let roster = (cls.roster || []).filter((r) => r.memberId !== memberId);
  const waitlist = [...(cls.waitlist || [])];
  let promoted = null;
  if (waitlist.length > 0 && roster.length < (cls.capacity || 1)) {
    promoted = waitlist.shift();
    roster.push(promoted);
  }
  await updateClass(cls.id, { roster, waitlist }, bizId);
  return { promoted };
}

export async function removeFromWaitlist(cls, memberId, bizId = getMyBizId()) {
  if (!bizId || !cls?.id) return;
  const waitlist = (cls.waitlist || []).filter((w) => w.memberId !== memberId);
  await updateClass(cls.id, { waitlist }, bizId);
}
