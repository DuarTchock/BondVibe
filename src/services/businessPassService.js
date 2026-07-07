/**
 * businessPassService — the ATTENDEE side of Kinlo for Business.
 * Redeem a host's guest code (links the app account to the CRM record via the
 * server; the attendee has no direct write access), and list the businesses
 * the attendee belongs to so they can show their check-in pass.
 */
import { getFunctions, httpsCallable } from "firebase/functions";
import { collectionGroup, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "./firebase";

/** The QR value a member shows for a host to scan them in. */
export const buildBusinessPassPayload = (bizId, memberId) => `bizpass:${bizId}:${memberId}`;

/**
 * Redeem a guest code. Server links the member + unlocks the pass.
 * @returns {Promise<{ok:boolean, bizId?:string, memberId?:string, businessName?:string, error?:string}>}
 */
export async function redeemGuestCode(code) {
  const clean = (code || "").trim();
  if (!clean) return { ok: false, error: "empty" };
  try {
    const fn = httpsCallable(getFunctions(), "redeemBusinessGuestCode");
    const res = await fn({ code: clean });
    return { ok: true, ...(res.data || {}) };
  } catch (e) {
    // Firebase HttpsError codes: not-found | already-exists | unauthenticated
    const code2 = e?.code || "";
    let error = "failed";
    if (code2.includes("not-found")) error = "invalid";
    else if (code2.includes("already-exists")) error = "in_use";
    return { ok: false, error };
  }
}

/**
 * The businesses this attendee is a linked member of (for showing passes).
 * Reads only their own member records (allowed by rules on linkedUid).
 */
export async function getMyBusinessPasses() {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  try {
    const snap = await getDocs(
      query(collectionGroup(db, "members"), where("linkedUid", "==", uid))
    );
    return snap.docs.map((d) => {
      const data = d.data();
      const bizId = d.ref.parent.parent.id;
      return {
        bizId,
        memberId: d.id,
        businessName: data.businessName || "",
        memberName: data.name || "",
        activePackage: data.activePackage || null,
        creditBalance: typeof data.creditBalance === "number" ? data.creditBalance : null,
      };
    });
  } catch (e) {
    console.error("getMyBusinessPasses failed:", e?.message || e);
    return [];
  }
}
