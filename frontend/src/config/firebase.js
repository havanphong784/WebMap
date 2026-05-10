// Import the functions you need from the SDKs you need
import {initializeApp} from "firebase/app";
// https://firebase.google.com/docs/web/setup#available-libraries
import {getAuth, GoogleAuthProvider} from "firebase/auth";
import {getStorage} from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC-EsnFKnAtKvPH8QK7CUce_q41KuE-SbQ",
  authDomain: "mapweb-d12da.firebaseapp.com",
  projectId: "mapweb-d12da",
  storageBucket: "mapweb-d12da.firebasestorage.app",
  messagingSenderId: "432125420293",
  appId: "1:432125420293:web:7eb84ea3d920268eb2cd6c",
  measurementId: "G-39591P2M8Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);
