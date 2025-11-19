import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCLaUcFpX5KcemGsCCMHSfCz49CauUKjGc",
  authDomain: "bondvibe-dev.firebaseapp.com",
  projectId: "bondvibe-dev",
  storageBucket: "bondvibe-dev.firebasestorage.app",
  messagingSenderId: "762181340271",
  appId: "1:762181340271:web:fd45de5ece4e2ea1b1e393"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
console.log('🔧 Initializing Firebase Auth with LOCAL persistence...');
const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
});

// Set persistence explicitly (double check)
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('✅ Auth persistence set to LOCAL');
  })
  .catch((error) => {
    console.error('❌ Error setting persistence:', error);
  });

const db = getFirestore(app);
const storage = getStorage(app);

console.log('✅ Firebase initialized successfully');

export { auth, db, storage };
