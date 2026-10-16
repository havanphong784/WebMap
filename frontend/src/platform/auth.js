import {FirebaseAuthentication} from "@capacitor-firebase/authentication";
import {
  GoogleAuthProvider,
  signInWithCredential as firebaseSignInWithCredential,
  signInWithPopup as firebaseSignInWithPopup,
} from "firebase/auth";
import {auth, googleProvider} from "../config/firebase.js";
import {isNativeAndroid} from "./runtime.js";

const authError = (code, message, cause) => Object.assign(new Error(message, {cause}), {code});

const isCancellation = (error) => {
  const value = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();
  return value.includes("12501") || value.includes("cancel") || value.includes("canceled");
};

export const createGoogleAuthAdapter = ({
  nativeAndroid = isNativeAndroid(),
  nativeAuth = FirebaseAuthentication,
  webAuth = auth,
  provider = googleProvider,
  googleCredential = GoogleAuthProvider.credential,
  signInWithPopup = firebaseSignInWithPopup,
  signInWithCredential = firebaseSignInWithCredential,
} = {}) => ({
  signInWithGoogle: async () => {
    if (!nativeAndroid) return signInWithPopup(webAuth, provider);

    let result;
    try {
      result = await nativeAuth.signInWithGoogle({skipNativeAuth: true});
    } catch (error) {
      if (isCancellation(error)) {
        throw authError("AUTH_CANCELLED", "Đăng nhập Google đã được hủy", error);
      }
      throw authError("AUTH_NATIVE_FAILED", error?.message || "Đăng nhập Google thất bại", error);
    }

    const idToken = result?.credential?.idToken;
    if (!idToken) {
      throw authError("AUTH_INVALID_CREDENTIAL", "Google không trả về ID token hợp lệ");
    }

    const credential = googleCredential(idToken, result.credential?.accessToken);
    return signInWithCredential(webAuth, credential);
  },
});

export const {signInWithGoogle} = createGoogleAuthAdapter();
