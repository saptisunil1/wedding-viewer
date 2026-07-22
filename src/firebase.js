import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBoHHPLlf1WJ0jWpTI1hxW7N98VifpxpJo",
  authDomain: "thesanistory.firebaseapp.com",
  projectId: "thesanistory",
  storageBucket: "thesanistory.firebasestorage.app",
  messagingSenderId: "663547961746",
  appId: "1:663547961746:web:bcd6372b4daef0e4d9e14b",
  measurementId: "G-BJVKZ40ZMH"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);