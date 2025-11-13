import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCLaUcFpX5KcemGsCCMHSfCz49CauUKjGc",
  authDomain: "bondvibe-dev.firebaseapp.com",
  projectId: "bondvibe-dev",
  storageBucket: "bondvibe-dev.firebasestorage.app",
  messagingSenderId: "629419649601",
  appId: "1:629419649601:web:4654e0378542001e18b4c0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
