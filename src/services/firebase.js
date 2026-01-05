import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

console.log("[Firebase] 🔥 Starting Firebase initialization...");

const firebaseConfig = {
  apiKey: Constants.expoConfig.extra.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: Constants.expoConfig.extra.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig.extra.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig.extra.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    Constants.expoConfig.extra.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig.extra.EXPO_PUBLIC_FIREBASE_APP_ID,
};

console.log(
  "[Firebase] 📋 Config loaded, projectId:",
  firebaseConfig.projectId
);

// Initialize app (singleton pattern)
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log("[Firebase] ✅ Firebase app initialized (new)");
} else {
  app = getApp();
  console.log("[Firebase] ✅ Firebase app initialized (existing)");
}

// Initialize Auth with AsyncStorage persistence
// Must use initializeAuth on first load, getAuth on subsequent loads
let auth;
if (getApps().length === 1 && !global._firebaseAuthInitialized) {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  global._firebaseAuthInitialized = true;
  console.log("[Firebase] 🔐 Auth initialized with AsyncStorage persistence");
} else {
  auth = getAuth(app);
  console.log("[Firebase] 🔐 Auth retrieved from existing instance");
}

export { auth };

// Initialize Firestore
export const db = getFirestore(app);
console.log("[Firebase] 📦 Firestore initialized");

// Initialize Storage
export const storage = getStorage(app);
console.log("[Firebase] 📁 Storage initialized");

console.log("[Firebase] 🎉 All Firebase services ready!");
