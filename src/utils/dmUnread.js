/**
 * Pure DM-thread unread check (spec 12) — no Firebase, so it's unit-testable
 * and shared by the Inbox hook + the Inbox list.
 */
import { toMillis } from "./membershipUtils";

/** A DM thread is unread when the other person sent last, after my last read. */
export const isThreadUnread = (thread, uid) => {
  if (!thread || !thread.lastSenderId || thread.lastSenderId === uid) return false;
  const read = toMillis(thread.lastReadAt ? thread.lastReadAt[uid] : null);
  const updated = toMillis(thread.updatedAt);
  return !read || read < updated;
};
