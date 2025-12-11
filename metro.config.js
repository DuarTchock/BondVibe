const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Firebase compatibility fixes for Expo SDK 53/54
// The .cjs extension is needed for Firebase's CommonJS modules
config.resolver.sourceExts.push("cjs");

// CRITICAL: This line fixes "Component auth has not been registered yet"
// Expo SDK 53+ enables package exports by default, which breaks Firebase Auth
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
