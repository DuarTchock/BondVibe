/**
 * User-to-user blocking. Stored at users/{me}/blocks/{blockedUid}. Blocked
 * users are filtered out of the feed and DM lists (client-side), and the block
 * is mutual for visibility purposes.
 */
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "./firebase";

const uid = () => auth.currentUser?.uid || null;
const blockRef = (me, other) => doc(db, "users", me, "blocks", other);

export const blockUser = async (otherUid) => {
  const me = uid();
  if (!me || !otherUid || me === otherUid) return { success: false };
  try {
    await setDoc(blockRef(me, otherUid), { createdAt: serverTimestamp() });
    return { success: true };
  } catch (e) {
    console.error("❌ blockUser:", e);
    return { success: false, error: e.message };
  }
};

export const unblockUser = async (otherUid) => {
  const me = uid();
  if (!me || !otherUid) return { success: false };
  try {
    await deleteDoc(blockRef(me, otherUid));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const isBlocked = async (otherUid) => {
  const me = uid();
  if (!me || !otherUid) return false;
  const s = await getDoc(blockRef(me, otherUid));
  return s.exists();
};

/** UIDs the current user has blocked. */
export const getBlockedIds = async () => {
  const me = uid();
  if (!me) return [];
  try {
    const snap = await getDocs(collection(db, "users", me, "blocks"));
    return snap.docs.map((d) => d.id);
  } catch (e) {
    console.error("❌ getBlockedIds:", e);
    return [];
  }
};
