// Fails (exit 1) if en.json and es.json don't have the exact same key set.
// Run in CI and locally: `node scripts/check-i18n-parity.js`
const fs = require("fs");
const path = require("path");

const load = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "src/i18n/locales", f), "utf8"));
const flat = (o, p = "") =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === "object" && !Array.isArray(v) ? flat(v, p + k + ".") : [p + k],
  );

const en = new Set(flat(load("en.json")));
const es = new Set(flat(load("es.json")));
const missingInEs = [...en].filter((k) => !es.has(k));
const missingInEn = [...es].filter((k) => !en.has(k));

if (missingInEs.length || missingInEn.length) {
  console.error("❌ i18n parity FAILED — en.json and es.json key sets differ");
  if (missingInEs.length) console.error("  missing in es.json:", missingInEs);
  if (missingInEn.length) console.error("  missing in en.json:", missingInEn);
  process.exit(1);
}
console.log(`✅ i18n parity OK (${en.size} keys in both en.json and es.json)`);
