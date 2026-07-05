/**
 * claudeService — the ONLY client path to Kinlo AI. Calls the `callClaude`
 * Cloud Function (Anthropic key lives server-side; see functions/ai/foundation).
 *
 * Response contract:
 *   { ok:true, data }                                → render AI content
 *   { ok:false, fallback:true, error, needsPlus? }   → plain non-AI fallback
 * Never fake AI output on fallback (spec: hide the AI card instead).
 */
import { getFunctions, httpsCallable } from "firebase/functions";

const memoryCache = new Map(); // key -> { at, data }

/**
 * @param {"smart_wall"|"ask_kinlo"} feature
 * @param {object} input feature-specific input
 * @param {{cacheKey?:string, ttlMs?:number}} opts non-chat results may cache
 */
export async function callClaude(feature, input = {}, opts = {}) {
  const { cacheKey, ttlMs } = opts;
  if (cacheKey && ttlMs) {
    const hit = memoryCache.get(cacheKey);
    if (hit && Date.now() - hit.at < ttlMs) return hit.data;
  }
  try {
    const fn = httpsCallable(getFunctions(), "callClaude");
    const res = await fn({ feature, input });
    const payload = res.data || { ok: false, error: "empty", fallback: true };
    if (payload.ok && cacheKey && ttlMs) {
      memoryCache.set(cacheKey, { at: Date.now(), data: payload });
    }
    return payload;
  } catch (e) {
    console.error("callClaude failed:", e?.message || e);
    return { ok: false, error: "ai_unavailable", fallback: true };
  }
}

/** Drop a cached result (e.g. re-rank the wall after a new RSVP). */
export const invalidateClaudeCache = (cacheKey) => memoryCache.delete(cacheKey);
