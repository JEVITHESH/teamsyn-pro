
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD8SRBawuldheLpOysHsWSG2cF-3EAPSOM",
    authDomain: "teamsync-793c2.firebaseapp.com",
    projectId: "teamsync-793c2",
    storageBucket: "teamsync-793c2.firebasestorage.app",
    messagingSenderId: "151991172042",
    appId: "1:151991172042:web:5f566153114f6eff7d6d33",
    measurementId: "G-WPNZ18JDLP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, db, auth, storage, googleProvider };
