/**
 * Direct messages — 1:1 threads. Thread id is the sorted uid pair so a
 * conversation is a single deterministic doc. Only the two participants can
 * read/write (enforced by rules).
 */
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "./firebase";

const uid = () => auth.currentUser?.uid || null;

export const threadIdFor = (a, b) => [a, b].sort().join("_");

/** Get (creating if needed) the DM thread with another user. */
export const getOrCreateThread = async (otherUid) => {
  const me = uid();
  if (!me || !otherUid || me === otherUid) return null;
  const id = threadIdFor(me, otherUid);
  const ref = doc(db, "dms", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      users: [me, otherUid].sort(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: "",
    });
  }
  return id;
};

/** The current user's DM threads, most recent first. */
export const getMyThreads = async () => {
  const me = uid();
  if (!me) return [];
  try {
    const snap = await getDocs(
      query(
        collection(db, "dms"),
        where("users", "array-contains", me),
        orderBy("updatedAt", "desc")
      )
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("❌ getMyThreads:", e);
    return [];
  }
};

export const subscribeThreadMessages = (threadId, cb) =>
  onSnapshot(
    query(collection(db, "dms", threadId, "messages"), orderBy("createdAt", "asc")),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => console.error("❌ subscribeThreadMessages:", err)
  );

export const sendDM = async (threadId, text) => {
  const me = uid();
  const body = (text || "").trim();
  if (!me || !body) return { success: false };
  try {
    await addDoc(collection(db, "dms", threadId, "messages"), {
      senderId: me,
      text: body,
      createdAt: serverTimestamp(),
    });
    await setDoc(
      doc(db, "dms", threadId),
      { lastMessage: body, lastSenderId: me, updatedAt: serverTimestamp() },
      { merge: true }
    );
    return { success: true };
  } catch (e) {
    console.error("❌ sendDM:", e);
    return { success: false, error: e.message };
  }
};

/**
 * Mark a thread read for me (spec 12) — stamps lastReadAt.{uid} so the Inbox
 * unread dot clears. Merged nested write; participants may update per rules.
 */
export const markThreadRead = async (threadId) => {
  const me = uid();
  if (!me || !threadId) return;
  try {
    await setDoc(
      doc(db, "dms", threadId),
      { lastReadAt: { [me]: serverTimestamp() } },
      { merge: true }
    );
  } catch (e) {
    // best-effort
  }
};
