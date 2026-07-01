/**
 * Server-side mirror of src/utils/contentGuard.js. Blocks off-platform payment
 * solicitation (bank accounts, CLABE, cards, transfer instructions).
 */
const BANK_WORDS = new RegExp(
  [
    "clabe", "spei", "transferenc", "transfi[eé]r", "dep[oó]sit",
    "cuenta\\s+bancaria", "n[uú]mero\\s+de\\s+cuenta", "\\btarjeta\\b",
    "oxxo\\s*pay", "paypal", "mercado\\s*pago", "\\bven?mo\\b", "zelle",
  ].join("|"),
  "i",
);

/**
 * Detect off-platform payment solicitation in a message.
 * @param {string} text message text
 * @return {{flagged: boolean, reason: string}} detection result
 */
function detectProhibitedContent(text) {
  const t = String(text || "");
  const digits = t.replace(/[\s\-.]/g, "");
  if (/\d{15,19}/.test(digits)) return {flagged: true, reason: "account_number"};
  if (/\bclabe\b|\bspei\b/i.test(t)) return {flagged: true, reason: "bank_rail"};
  if (BANK_WORDS.test(t) && /\d{6,}/.test(digits)) {
    return {flagged: true, reason: "bank_details"};
  }
  return {flagged: false, reason: ""};
}

module.exports = {detectProhibitedContent};
