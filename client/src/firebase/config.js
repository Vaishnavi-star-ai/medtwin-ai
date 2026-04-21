import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC-FMvV_J2BwWMv-lkB06zJNEVC58mE6SY",
  authDomain: "medtwinplus-46575.firebaseapp.com",
  projectId: "medtwinplus-46575",
  storageBucket: "medtwinplus-46575.firebasestorage.app",
  messagingSenderId: "626629274140",
  appId: "1:626629274140:web:511a3f2691f49a91d54dd9",
  measurementId: "G-T0Y3CZW2GM"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 🔥 IMPORTANT: Firestore connection
export const db = getFirestore(app);