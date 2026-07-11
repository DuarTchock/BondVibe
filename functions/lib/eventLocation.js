/**
 * F2 gated-location derivation helpers (server). Pure — no Firebase — so they
 * can be unit-tested without the emulator. Mirrors src/utils/eventLocation.js.
 */

// ~0.01° ≈ 1.1 km. Snap (never per-read jitter) so averaging can't recover the point.
const APPROX_GRID_DEG = 0.01;

/**
 * Snap exact coords to the coarse grid to produce `approxCoords`.
 * @param {{latitude:number, longitude:number}|null} coords exact coordinates
 * @return {{latitude:number, longitude:number}|null} snapped point, or null if invalid
 */
function snapApproxGrid(coords) {
  if (!coords ||
      !Number.isFinite(coords.latitude) ||
      !Number.isFinite(coords.longitude)) {
    return null;
  }
  const snap = (v) =>
    Number((Math.round(v / APPROX_GRID_DEG) * APPROX_GRID_DEG).toFixed(4));
  return {latitude: snap(coords.latitude), longitude: snap(coords.longitude)};
}

/**
 * Derive the coarse `area` label. `location` is "Venue, City" — the tail is a
 * coarse (city-level) label; never expose the street through `area`.
 * @param {string} location the "Venue, City" location string
 * @param {string} city fallback city label
 * @return {string|null} coarse area label, or null when neither is present
 */
function deriveArea(location, city) {
  if (typeof location === "string" && location.includes(",")) {
    const tail = location.split(",").pop().trim();
    if (tail) return tail;
  }
  return city || null;
}

/**
 * Derive the venue name (the head of "Venue, City").
 * @param {string} location the "Venue, City" location string
 * @return {string|null} venue name, or null when absent
 */
function deriveVenue(location) {
  if (typeof location === "string" && location.includes(",")) {
    return location.split(",")[0].trim();
  }
  return (typeof location === "string" && location.trim()) || null;
}

/**
 * Validate + normalize a coords object to {latitude, longitude}.
 * @param {{latitude:number, longitude:number}} c a coords-like object
 * @return {{latitude:number, longitude:number}|null} normalized coords, or null
 */
function coordFromData(c) {
  return c && Number.isFinite(c.latitude) && Number.isFinite(c.longitude) ?
    {latitude: c.latitude, longitude: c.longitude} : null;
}

/**
 * Whether two coord objects are equal (used as the trigger loop guard).
 * @param {{latitude:number, longitude:number}|null} a first coords
 * @param {{latitude:number, longitude:number}|null} b second coords
 * @return {boolean} true when both exist and match exactly
 */
function coordsEqual(a, b) {
  return !!a && !!b && a.latitude === b.latitude && a.longitude === b.longitude;
}

module.exports = {
  APPROX_GRID_DEG,
  snapApproxGrid,
  deriveArea,
  deriveVenue,
  coordFromData,
  coordsEqual,
};
