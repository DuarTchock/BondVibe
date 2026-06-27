/**
 * Featured-event promotions (client).
 *
 * The platform keeps 100% of promotion fees. The SERVER
 * (functions/stripe/promotions.js) is the source of truth for the price; this
 * client catalog is for display only.
 */

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "./firebase";

const FUNCTIONS_BASE_URL =
  "https://us-central1-bondvibe-dev.cloudfunctions.net";

// Display catalog — mirrors functions/stripe/promotions.js.
export const PROMOTION_PLANS = [
  { id: "feat_7", days: 7, priceCentavos: 9900, label: "7 days" },
  { id: "feat_14", days: 14, priceCentavos: 17900, label: "14 days" },
  { id: "feat_30", days: 30, priceCentavos: 29900, label: "30 days" },
];

/**
 * Format centavos as a MXN price string.
 * @param {number} centavos
 * @returns {string}
 */
export const formatPromoPrice = (centavos) => {
  const pesos = (Number(centavos) || 0) / 100;
  return `$${pesos.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MXN`;
};

/**
 * Create a PaymentIntent to promote an event. The membership/featured doc is
 * applied by the payment webhook on success.
 * @param {string} eventId
 * @param {string} planId
 * @returns {Promise<{success:boolean, clientSecret?:string, error?:string}>}
 */
export const createPromotionPaymentIntent = async (eventId, planId) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return { success: false, error: "Not signed in." };
    const response = await fetch(
      `${FUNCTIONS_BASE_URL}/createPromotionPaymentIntent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, planId, userId }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Could not start promotion." };
    }
    return { success: true, ...data };
  } catch (e) {
    console.error("❌ createPromotionPaymentIntent:", e);
    return { success: false, error: e.message };
  }
};

/**
 * Fetch currently-featured events (promotion not expired).
 * @param {number} [max] limit
 * @returns {Promise<Array>}
 */
export const getFeaturedEvents = async (max = 10) => {
  try {
    const q = query(
      collection(db, "events"),
      where("featuredUntil", ">", Timestamp.now()),
      orderBy("featuredUntil", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((e) => e.status !== "cancelled")
      .slice(0, max);
  } catch (e) {
    console.error("❌ getFeaturedEvents:", e);
    return [];
  }
};
