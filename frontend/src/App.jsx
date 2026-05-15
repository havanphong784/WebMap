import {lazy, Suspense, useEffect, useMemo, useRef} from 'react';
import {Route, Routes, useLocation} from 'react-router-dom';
import {AnimatePresence} from 'framer-motion';
import BottomNav from "./shared/components/layout/bottomNav.jsx";
import ProtectedRoute from "./shared/components/layout/protectedRoute.jsx";
import PageTransition from "./shared/components/layout/pageTransition.jsx";
import {useAuthStore} from "./features/auth/context/authStore.js";
import {useSocialStore} from "./features/map/store/useSocialStore.jsx";
import {useLocationStore} from "./features/map/store/useLocationsStore.jsx";
import {useNotificationStore} from "./features/notifications/store/useNotificationStore.jsx";
import ToastProvider from "./shared/components/toast/ToastProvider.jsx";
import useSSE from "./shared/hooks/useSSE.jsx";

const LandingPage = lazy(() => import("./features/landing/landingPage.jsx"));
const MapPage = lazy(() => import("./features/map/MapPage.jsx"));
const DiscoveryFeed = lazy(() => import("./features/discovery/discoveryFeed.jsx"));
const ProfilePage = lazy(() => import("./features/profile/profilePage.jsx"));
const Login = lazy(() => import("./features/auth/loginPage.jsx"));
const NotificationsPage = lazy(() => import("./features/notifications/notificationsPage.jsx"));

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
  const isLandingPage = location.pathname === '/';
  const {user, setUnreadAchievements} = useAuthStore();
  const {sendHeartbeat, setActiveUsers} = useSocialStore();
  const userLocation = useLocationStore(state => state.userLocation);
  const {setNotificationsFromSSE} = useNotificationStore();
  const userLocationRef = useRef(userLocation);

  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  // SSE event handlers
  const sseHandlers = useMemo(() => ({
    notifications: (data) => {
      if (Array.isArray(data)) {
        setNotificationsFromSSE(data);
      }
    },
    new_notification: (data) => {
      if (data?.id) {
        useNotificationStore.getState().addNotification(data);
      }
    },
    active_users: (data) => {
      if (Array.isArray(data)) {
        setActiveUsers(data);
      }
    },
    new_message: (data) => {
      // Forward DM event ra window cho component chat lắng nghe
      window.dispatchEvent(new CustomEvent("aether:new_message", {detail: data}));
    },
    achievement_unlocked: () => {
      // Tăng badge count ngay; ProfilePage sẽ fetch lại chi tiết khi user mở tab achievements.
      if (typeof setUnreadAchievements === "function") {
        setUnreadAchievements(prev => (prev || 0) + 1);
      }
    },
    daily_task_completed: () => {
      if (typeof setUnreadAchievements === "function") {
        setUnreadAchievements(prev => (prev || 0) + 1);
      }
    },
  }), [setNotificationsFromSSE, setActiveUsers, setUnreadAchievements]);

  // SSE connection — replaces notification polling and active users polling
  useSSE({
    enabled: Boolean(user?.uid),
    handlers: sseHandlers,
  });

  // Heartbeat — still needed to update last_seen in DB (triggers SSE broadcast)
  useEffect(() => {
    if (user?.uid) {
      // Fetch active users ngay lập tức (fallback khi SSE chưa connect)
      useSocialStore.getState().fetchActiveUsers();
      
      sendHeartbeat(userLocationRef.current);
      const heartbeatInterval = setInterval(() => sendHeartbeat(userLocationRef.current), 60000);
      return () => clearInterval(heartbeatInterval);
    }
  }, [user?.uid, sendHeartbeat]);

  return (
    <div
      className="min-h-screen bg-obsidian text-white selection:bg-cyan-glow selection:text-obsidian overflow-x-hidden">
      <Suspense fallback={<LoadingFallback/>}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/login" element={<PageTransition><Login/></PageTransition>}/>
            <Route path="/" element={<PageTransition><LandingPage/></PageTransition>}/>
            <Route path="/map" element={
              <ProtectedRoute>
                <PageTransition><MapPage/></PageTransition>
              </ProtectedRoute>
            }/>

            <Route path="/discover" element={
              <ProtectedRoute>
                <PageTransition><DiscoveryFeed/></PageTransition>
              </ProtectedRoute>
            }/>

            <Route path="/notifications" element={
              <ProtectedRoute>
                <PageTransition><NotificationsPage/></PageTransition>
              </ProtectedRoute>
            }/>

            <Route path="/profile/:uid" element={
              <ProtectedRoute>
                <PageTransition><ProfilePage/></PageTransition>
              </ProtectedRoute>
            }/>

            <Route path="/profile" element={
              <ProtectedRoute>
                <PageTransition><ProfilePage/></PageTransition>
              </ProtectedRoute>
            }/>

            <Route path="*" element={<PageTransition><LandingPage/></PageTransition>}/>
          </Routes>
        </AnimatePresence>
      </Suspense>
      {!isLoginPage && !isLandingPage && <BottomNav/>}
      <ToastProvider />
    </div>
  );
}

export default App;
