import {initializeApp, type FirebaseApp, type FirebaseOptions} from "firebase/app";
import {getAuth, GoogleAuthProvider, type Auth} from "firebase/auth";
import {getStorage, type FirebaseStorage} from "firebase/storage";
import {runtimeConfig} from "./runtimeConfig.js";

const firebaseConfig = runtimeConfig.firebaseConfig as FirebaseOptions;

const app: FirebaseApp = initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();
export const storage: FirebaseStorage = getStorage(app);
