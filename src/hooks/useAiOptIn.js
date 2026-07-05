/**
 * useAiOptIn — live users/{uid}.aiOptIn. Gates every AI surface client-side
 * (the server enforces it too). `setOptIn` powers the first-run screen and
 * the Settings toggle.
 */
import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

export default function useAiOptIn() {
  const [aiOptIn, setAiOptIn] = useState(false);
  const [decided, setDecided] = useState(false); // has the user ever answered?
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
        const d = snap.exists() ? snap.data() : {};
        setAiOptIn(d.aiOptIn === true);
        setDecided(d.aiOptIn === true || d.aiOptIn === false);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const setOptIn = useCallback(async (value) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await updateDoc(doc(db, "users", uid), { aiOptIn: value === true });
  }, []);

  return { aiOptIn, decided, loading, setOptIn };
}
