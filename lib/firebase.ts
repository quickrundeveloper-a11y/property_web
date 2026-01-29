// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDUOtyTS_QQ7Clzs2cuLMFNB-Gm1x0c5Hk",
  authDomain: "ott-app-a3eaf.firebaseapp.com",
  projectId: "ott-app-a3eaf",
  storageBucket: "ott-app-a3eaf.firebasestorage.app",
  messagingSenderId: "578839911643",
  appId: "1:578839911643:web:674828748e6397cd7140fe",
  measurementId: "G-09CKPPZ1TS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (only in browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
