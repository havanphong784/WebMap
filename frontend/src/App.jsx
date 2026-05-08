import {lazy, Suspense, useEffect} from 'react';
import {Route, Routes, useLocation} from 'react-router-dom';
import {AnimatePresence} from 'framer-motion';
import BottomNav from "./shared/components/layout/bottomNav.jsx";
import ProtectedRoute from "./shared/components/layout/protectedRoute.jsx";
import PageTransition from "./shared/components/layout/pageTransition.jsx";
import {useAuthStore} from "./features/auth/context/authContext.jsx";
import {useSocialStore} from "./features/map/store/useSocialStore.jsx";
import {useNotificationStore} from "./features/notifications/store/useNotificationStore.jsx";
import ToastProvider from "./shared/components/toast/ToastProvider.jsx";

const MapPage = lazy(() => import("./features/map/mapPage.jsx"));
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
  const {user} = useAuthStore();
  const {sendHeartbeat} = useSocialStore();
  const {fetchNotifications} = useNotificationStore();

  useEffect(() => {
    if (user?.uid) {
      sendHeartbeat();
      fetchNotifications(user.uid, true);

      const heartbeatInterval = setInterval(sendHeartbeat, 60000);

      const notifInterval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchNotifications(user.uid, true);
        }
      }, 30000);

      return () => {
        clearInterval(heartbeatInterval);
        clearInterval(notifInterval);
      };
    }
  }, [user?.uid, sendHeartbeat, fetchNotifications]);

  return (
    <div
      className="min-h-screen bg-obsidian text-white selection:bg-cyan-glow selection:text-obsidian overflow-x-hidden">
      <Suspense fallback={<LoadingFallback/>}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/login" element={<PageTransition><Login/></PageTransition>}/>
            <Route path="/" element={<PageTransition><MapPage/></PageTransition>}/>

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

            <Route path="*" element={<PageTransition><MapPage/></PageTransition>}/>
          </Routes>
        </AnimatePresence>
      </Suspense>
      {!isLoginPage && <BottomNav/>}
      <ToastProvider />
    </div>
  );
}

export default App;
