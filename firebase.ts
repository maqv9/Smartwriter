
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAlcbseIAmgOFcibt4rmfpBFVszmSbjkpo",
  authDomain: "smartwriter-webapp.firebaseapp.com",
  projectId: "smartwriter-webapp",
  storageBucket: "smartwriter-webapp.appspot.com",
  messagingSenderId: "535319289068",
  appId: "1:535319289068:web:44469cf6ec368d3fc059c9",
  measurementId: "G-YSZV06ZG6X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
