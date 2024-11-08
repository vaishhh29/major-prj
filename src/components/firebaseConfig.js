// src/components/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyCkLA4TXRtj7N0BzD4Uk0rMOtLH4kN5R6g",
  authDomain: "ai-clothbot.firebaseapp.com",
  databaseURL: "https://ai-clothbot-default-rtdb.firebaseio.com",
  projectId: "ai-clothbot",
  storageBucket: "ai-clothbot.appspot.com",
  messagingSenderId: "860181522768",
  appId: "1:860181522768:web:513eb7851e0ce60991a455",
  measurementId: "G-PGZ2FNSDBN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { db };
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User details:", user);
  } else {
    console.log("No user is signed in.");
  }
});