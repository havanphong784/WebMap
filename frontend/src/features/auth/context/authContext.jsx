import {useCallback, useEffect, useState} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import {auth} from "../../../config/firebase.js";
import {AuthContext} from "./authStore.js";
import {apiClient} from "../../../shared/api/apiClient.js";

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadAchievements, setUnreadAchievements] = useState(0);

  const syncWithBackend = async () => {
    try {
      // apiClient tự đính Authorization Bearer từ Firebase user hiện tại.
      const response = await apiClient.post("/auth/login");
      if (response?.success) {
        return response.user || response.data?.user || null;
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

        const backendUser = await syncWithBackend();
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

    const backendUser = await syncWithBackend();
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

  const fetchUnreadCount = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const response = await apiClient.get(`/achievements/unread/${userId}`);
      if (response?.success) {
        setUnreadAchievements(response.count ?? 0);
      }
    } catch (err) {
      console.error("Lỗi fetch unread count:", err);
    }
  }, []);

  // Lần đầu load: fetch unread count để có giá trị ngay.
  // Sau đó SSE event `achievement_unlocked` / `daily_task_completed` sẽ tự bump counter.
  useEffect(() => {
    if (!user?.uid) return;
    const timer = setTimeout(() => fetchUnreadCount(user.uid), 0);
    return () => clearTimeout(timer);
  }, [user?.uid, fetchUnreadCount]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      logout,
      loginWithEmail,
      registerWithEmail,
      resetPassword,
      unreadAchievements,
      fetchUnreadCount,
      setUnreadAchievements
    }}>
      {children}
    </AuthContext.Provider>
  );
};
