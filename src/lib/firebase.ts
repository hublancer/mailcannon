// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDMQKBBttO3Tl2ceBCHca8D6zOJXE7V7CI",
  authDomain: "mailcannon-tua39.firebaseapp.com",
  projectId: "mailcannon-tua39",
  storageBucket: "mailcannon-tua39.firebasestorage.app",
  messagingSenderId: "855915472927",
  appId: "1:855915472927:web:66503733887b0022784d2a"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
