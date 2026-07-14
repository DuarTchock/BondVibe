// Dynamic Expo config. Everything lives in app.json; this file only injects the
// native Android Google Maps SDK key from the environment (GOOGLE_MAPS_ANDROID_API_KEY
// in .env, gitignored) so it never sits in the committed repo.
//
// The web Places/Geocoding key (EXPO_PUBLIC_GOOGLE_PLACES_API_KEY) is NOT injected
// here: Expo inlines EXPO_PUBLIC_* vars into the JS bundle from .env at build time,
// and the client reads it via process.env. Injecting it into `extra` made `eas`
// commands serialize it back into app.json — so we keep it out of the config.
//
// iOS uses Apple Maps (no key needed). See .env.example.
const appJson = require("./app.json");
const expo = appJson.expo;

const androidMapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY || "";

module.exports = () => ({
  ...expo,
  android: {
    ...expo.android,
    config: {
      ...expo.android?.config,
      // Only attach the maps config when a key is present, so a missing key
      // degrades to our in-app "Map unavailable" guard instead of a prebuild
      // error or a silently-broken (gray) map.
      ...(androidMapsKey ? { googleMaps: { apiKey: androidMapsKey } } : {}),
    },
  },
});
