/**
 * Kinlo Plus subscription (attendee) — opens the hosted Stripe Checkout /
 * Billing Portal. Mirrors proService. The Stripe webhook flips
 * users/{uid}.plan to "kinlo_plus" on success. (The createPlusCheckoutSession
 * Cloud Function is wired in Block 2.5.)
 */
import { getFunctions, httpsCallable } from "firebase/functions";
import * as WebBrowser from "expo-web-browser";

export const startPlusCheckout = async () => {
  const fn = httpsCallable(getFunctions(), "createPlusCheckoutSession");
  const res = await fn({});
  const url = res.data?.url;
  if (!url) throw new Error("Could not start checkout. Please try again.");
  await WebBrowser.openBrowserAsync(url);
};

export const openPlusPortal = async () => {
  const fn = httpsCallable(getFunctions(), "createPlusPortalSession");
  const res = await fn({});
  const url = res.data?.url;
  if (!url) throw new Error("Could not open the billing portal.");
  await WebBrowser.openBrowserAsync(url);
};
