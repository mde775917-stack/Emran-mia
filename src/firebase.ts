import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD6v9DOqoY_HyfPtpbsIVFjbmOlVk1FWWY",
  authDomain: "earnings-b324d.firebaseapp.com",
  projectId: "earnings-b324d",
  storageBucket: "earnings-b324d.firebasestorage.app",
  messagingSenderId: "978551635574",
  appId: "1:978551635574:web:02ec027f39a884300d2957",
  measurementId: "G-6YW5L9C4XV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
