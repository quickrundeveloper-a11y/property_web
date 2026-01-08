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
  apiKey: "AIzaSyDfg4DCiUxCsAuDoReJJlPIZLRwrWpZYe4",
  authDomain: "property-app-48bab.firebaseapp.com",
  projectId: "property-app-48bab",
  storageBucket: "property-app-48bab.appspot.com",
  messagingSenderId: "615619120794",
  appId: "1:615619120794:web:29fc63b2d50b581c401923",
  measurementId: "G-8H0N2821H3"
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
