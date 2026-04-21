// Firebase client configuration for Authentication
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC-FMvV_J2BwWMv-lkB06zJNEVC58mE6SY",
  authDomain: "medtwinplus-46575.firebaseapp.com",
  projectId: "medtwinplus-46575",
  storageBucket: "medtwinplus-46575.firebasestorage.app",
  messagingSenderId: "626629274140",
  appId: "1:626629274140:web:b0ee0c0252fef463d54dd9",
  measurementId: "G-39HSCE380Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail };
export default app;
