// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  onAuthStateChanged,
} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBEz8A7DgKaSMW-BF2sU87BRyn_9KFCKgE",
  authDomain: "bbnka-mobile.firebaseapp.com",
  projectId: "bbnka-mobile",
  storageBucket: "bbnka-mobile.firebasestorage.app",
  messagingSenderId: "214639010070",
  appId: "1:214639010070:web:1662506c2f688760e3f037",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence);

export { db, auth, onAuthStateChanged };
