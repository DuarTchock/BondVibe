import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';

export const clearAuth = async () => {
  try {
    await signOut(auth);
    console.log('Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
  }
};
