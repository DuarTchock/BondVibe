/**
 * Server-side notification i18n (BUG 34) — the single source of truth for
 * localizing system push / SMS / in-app notifications to the recipient's
 * language. Catalogs live in functions/i18n/notifications.<lang>.json, mirroring
 * the client languages; English is the fallback for any missing language OR key,
 * so a notification NEVER renders blank.
 */
const admin = require("firebase-admin");
const {FieldPath} = require("firebase-admin/firestore");

// Add a language here as its catalog file lands (slice 5). English is required.
const CATALOGS = {
  en: require("./notifications.en.json"),
  es: require("./notifications.es.json"),
};

/**
 * Normalize any language tag to a catalog code (2-letter; Belgian Dutch shares
 * the `nl` catalog). Unknown → the base 2-letter code (tPush still falls back to
 * English if there's no catalog for it).
 * @param {string} code
 * @return {string}
 */
function baseLang(code) {
  if (!code) return "en";
  const c = String(code).toLowerCase();
  if (c.startsWith("nl") || c === "be") return "nl";
  return c.split("-")[0];
}

/**
 * Localize a notification string. Looks up `key` in the recipient language's
 * catalog, falling back to English per missing key, then interpolates
 * `{{param}}` placeholders. Never returns blank (returns the key as a last
 * resort so a bug is visible rather than empty).
 * @param {string} key e.g. "membership.redeemed.title"
 * @param {string} lang recipient language code
 * @param {object} [params] interpolation values
 * @return {string}
 */
function tPush(key, lang, params = {}) {
  const l = baseLang(lang);
  const cat = CATALOGS[l] || CATALOGS.en;
  let str = cat && cat[key] != null ? cat[key] : null;
  if (str == null) str = CATALOGS.en[key] != null ? CATALOGS.en[key] : key;
  return String(str).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) =>
    params[k] != null ? String(params[k]) : "",
  );
}

/**
 * The recipient's stored language (BUG 34), defaulting to English when absent.
 * @param {string} uid
 * @return {Promise<string>}
 */
async function getUserLang(uid) {
  if (!uid) return "en";
  try {
    const snap = await admin.firestore().collection("users").doc(uid).get();
    const code = snap.exists ? snap.data().language : null;
    return baseLang(code) || "en";
  } catch (e) {
    return "en";
  }
}

/**
 * Batch-resolve languages for many uids (BUG 34) — chunked `in` queries (≤10),
 * deduped. Returns a { uid: lang } map defaulting to "en" for every requested
 * uid (so a missing doc or a failed chunk still yields English, never blank).
 * @param {string[]} uids
 * @return {Promise<Record<string,string>>}
 */
async function getUserLangs(uids) {
  const unique = [...new Set((uids || []).filter(Boolean))];
  const out = {};
  unique.forEach((u) => {
    out[u] = "en";
  });
  if (unique.length === 0) return out;
  const db = admin.firestore();
  for (let i = 0; i < unique.length; i += 10) {
    const chunk = unique.slice(i, i + 10);
    try {
      const snap = await db.collection("users")
        .where(FieldPath.documentId(), "in", chunk).get();
      snap.forEach((d) => {
        out[d.id] = baseLang(d.data().language) || "en";
      });
    } catch (e) {
      // leave English defaults for this chunk
    }
  }
  return out;
}

module.exports = {tPush, getUserLang, getUserLangs, baseLang, CATALOGS};
