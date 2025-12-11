import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
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
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

console.log("[Firebase] ✅ Firebase app initialized");

// Initialize Auth with AsyncStorage persistence
// This properly handles React Native persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

console.log("[Firebase] 🔐 Auth initialized with AsyncStorage persistence");

// Initialize Firestore
export const db = getFirestore(app);
console.log("[Firebase] 📦 Firestore initialized");

// Initialize Storage
export const storage = getStorage(app);
console.log("[Firebase] 📁 Storage initialized");

console.log("[Firebase] 🎉 All Firebase services ready!");
