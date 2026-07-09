import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { isThreadUnread } from "../utils/dmUnread";

export { isThreadUnread };

// Match-related notification types that belong under "Match chats".
const MATCH_TYPES = new Set(["new_match", "matching_open"]);

/**
 * Per-category unread breakdown for the Inbox (spec 12 · Fix A), from the one
 * per-user `notifications` index plus a DM-threads listener:
 *   { eventChats, matchChats, communityChats, notifications, dms, total }
 *
 * - eventChats     ← type "event_messages" (sum unreadCount)
 * - communityChats ← type "group_message" (unread count)
 * - matchChats     ← new_match / matching_open (unread count)
 * - notifications  ← everything else with read === false
 * - dms            ← threads whose last message is from the other person and
 *                    newer than my lastReadAt (a dot, not a full count)
 */
export const useInboxBadges = () => {
  const [notif, setNotif] = useState({
    eventChats: 0,
    matchChats: 0,
    communityChats: 0,
    notifications: 0,
  });
  const [dms, setDms] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const q = query(collection(db, "notifications"), where("userId", "==", uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        let eventChats = 0;
        let matchChats = 0;
        let communityChats = 0;
        let notifications = 0;
        snap.forEach((d) => {
          const data = d.data();
          if (data.type === "event_messages") {
            eventChats += data.unreadCount || 0;
            return;
          }
          if (data.read !== false) return;
          if (data.type === "group_message") communityChats += 1;
          else if (MATCH_TYPES.has(data.type)) matchChats += 1;
          else notifications += 1;
        });
        setNotif({ eventChats, matchChats, communityChats, notifications });
      },
      () => setNotif({ eventChats: 0, matchChats: 0, communityChats: 0, notifications: 0 })
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const q = query(collection(db, "dms"), where("users", "array-contains", uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        let count = 0;
        snap.forEach((d) => {
          if (isThreadUnread(d.data(), uid)) count += 1;
        });
        setDms(count);
      },
      () => setDms(0)
    );
    return () => unsub();
  }, []);

  const total =
    notif.eventChats + notif.matchChats + notif.communityChats + notif.notifications + dms;
  return { ...notif, dms, total };
};

// Back-compat: the header ✉ icon just wants the combined total.
export const useInboxBadge = () => useInboxBadges().total;
