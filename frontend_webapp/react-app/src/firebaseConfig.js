import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBmHVUQ7gVnKnzOmEaJ5O66al7Xv6S29RQ",
  authDomain: "technofino-tech.firebaseapp.com",
  projectId: "technofino-tech",
  storageBucket: "technofino-tech.firebasestorage.app",
  messagingSenderId: "509178956937",
  appId: "1:509178956937:web:e0251889470fa3de6eca58",
  measurementId: "G-0KHF1FKV9C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
