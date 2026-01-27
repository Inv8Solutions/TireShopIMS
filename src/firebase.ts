// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // added Firestore import
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyALVCZOzGqzQsSxk65O6bH21j9RZGTTCCo",
  authDomain: "basicventures01.firebaseapp.com",
  projectId: "basicventures01",
  storageBucket: "basicventures01.firebasestorage.app",
  messagingSenderId: "1099334123598",
  appId: "1:1099334123598:web:ff13dfca9a682a20b4c31f",
  measurementId: "G-0KETVNQWWK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app); // initialize Firestore

export { app, analytics, auth, db }; // export db
