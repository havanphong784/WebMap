import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

const MapPage = lazy(() => import("./features/map/mapPage.jsx"));
const DiscoveryFeed = lazy(() => import("./features/discovery/discoveryFeed.jsx"));
const ProfilePage = lazy(() => import("./features/profile/profilePage.jsx"));
const Login = lazy(() => import("./features/auth/loginPage.jsx"));
const NotificationsPage = lazy(() => import("./features/notifications/notificationsPage.jsx"));

import BottomNav from "./shared/components/layout/bottomNav.jsx";
import ProtectedRoute from "./shared/components/layout/protectedRoute.jsx";
import { useAuthStore } from "./features/auth/context/authContext.jsx";
import { useSocialStore } from "./features/map/store/useSocialStore.jsx";
import { useNotificationStore } from "./features/notifications/store/useNotificationStore.jsx";
import { useEffect } from "react";

const LoadingFallback = () => (
  <div className="h-screen w-full flex items-center justify-center bg-obsidian text-cyan-glow">
    <div className="animate-pulse flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-cyan-glow border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-xs font-black uppercase tracking-widest">Aether Loading...</p>
    </div>
  </div>
);

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const { user } = useAuthStore();
  const { sendHeartbeat } = useSocialStore();
  const { fetchNotifications } = useNotificationStore();

  useEffect(() => {
    if (user?.uid) {
      sendHeartbeat();
      // Fetch initial notifications when app loads and user is available
      fetchNotifications(user.uid, true);

      // Heartbeat interval (45s)
      const heartbeatInterval = setInterval(sendHeartbeat, 45000);
      
      // Polling for notifications (15s) to ensure accurate and real-time feel
      const notifInterval = setInterval(() => {
        fetchNotifications(user.uid, true);
      }, 15000);

      return () => {
        clearInterval(heartbeatInterval);
        clearInterval(notifInterval);
      };
    }
  }, [user?.uid]);

  return (
    <div className="min-h-screen bg-obsidian text-white selection:bg-cyan-glow selection:text-obsidian overflow-x-hidden">
      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingFallback />}>
          <Routes location={location} key={location.pathname}>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<MapPage />} />

            <Route path="/discover" element={
              <ProtectedRoute>
                <DiscoveryFeed />
              </ProtectedRoute>
            } />

            <Route path="/notifications" element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } />

            <Route path="/profile/:uid" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />

            <Route path="*" element={<MapPage />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
      {!isLoginPage && <BottomNav />}
    </div>
  );
}

export default App;
