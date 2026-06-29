/**
 * Atomic free-event join via the joinEvent Cloud Function (capacity enforced
 * server-side in a transaction). Replaces the old client-side arrayUnion so
 * events can't be overbooked.
 */
import { getFunctions, httpsCallable } from "firebase/functions";

export const joinFreeEvent = async (eventId) => {
  try {
    const fn = httpsCallable(getFunctions(), "joinEvent");
    const res = await fn({ eventId });
    return { success: true, ...res.data };
  } catch (e) {
    const msg = e.message || "";
    let error = "Could not join. Please try again.";
    if (msg.includes("event_full")) error = "This event is full.";
    else if (msg.includes("already happened")) error = "This event has already happened.";
    else if (msg.includes("cancelled")) error = "This event was cancelled.";
    else if (msg.includes("paid_event")) error = "This is a paid event — please use checkout.";
    return { success: false, error, code: e.code };
  }
};
