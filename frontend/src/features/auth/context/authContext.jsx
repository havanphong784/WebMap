import {createContext, useContext, useEffect, useState} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import {auth} from "../../../config/firebase.js";

export const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncWithBackend = async (firebaseUser) => {
    try {
      const token = await firebaseUser.getIdToken(true); // Force refresh to get latest profile updates
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.user;
      }
    } catch (error) {
      console.error("Lỗi đồng bộ backend:", error);
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        const backendUser = await syncWithBackend(firebaseUser);
        if (backendUser) {
          setUser({
            ...firebaseUser,
            ...backendUser,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: backendUser.name || firebaseUser.displayName,
            photoURL: backendUser.avatar_url || firebaseUser.photoURL,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const registerWithEmail = async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, {displayName: name});

    const backendUser = await syncWithBackend(userCredential.user);
    if (backendUser) {
      setUser({
        ...userCredential.user,
        ...backendUser,
        displayName: name,
      });
    }

    return userCredential;
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{user, loading, logout, loginWithEmail, registerWithEmail, resetPassword}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthStore = () => {
  return useContext(AuthContext);
};


