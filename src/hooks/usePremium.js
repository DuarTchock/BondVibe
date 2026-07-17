import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../services/firebase";

/**
 * Real-time Kinlo Pro entitlement for the current user.
 *
 * `isPremium` is set server-side only (Stripe subscription webhook); the client
 * just listens to its own user doc. The moment it flips, gated UI updates with
 * no manual refresh — so when a host pays Pro on the web and returns to the app,
 * the Pro features unlock automatically.
 *
 * @returns {{ isPremium: boolean, loading: boolean }}
 */
export const usePremium = () => {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        setIsPremium(snap.exists() && snap.data().isPremium === true);
        setLoading(false);
      },
      () => {
        setIsPremium(false);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return { isPremium, loading };
};

/**
 * Wait for the Pro entitlement to actually land.
 *
 * Returning from Stripe does NOT mean Pro is granted: the webhook grants it, and
 * it routinely arrives a second or two after the browser closes. That gap is the
 * bug — the user came back to a paywall still offering to sell them what they'd
 * just bought. So watch the user doc until isPremium flips, with a ceiling so a
 * webhook that never fires leaves us saying "still processing" instead of
 * spinning forever.
 *
 * @param {number} [timeoutMs=15000]
 * @returns {Promise<boolean>} true once entitled; false if it didn't arrive in time
 */
export const waitForPremium = (timeoutMs = 15000) =>
  new Promise((resolve) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return resolve(false);

    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      unsub();
      clearTimeout(timer);
      resolve(value);
    };

    const unsub = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        if (snap.exists() && snap.data().isPremium === true) finish(true);
      },
      () => finish(false)
    );
    const timer = setTimeout(() => finish(false), timeoutMs);
  });
