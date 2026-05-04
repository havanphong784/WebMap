import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import MapPage from "./features/map/mapPage.jsx";
import DiscoveryFeed from "./features/discovery/discoveryFeed.jsx";
import ProfilePage from "./features/profile/profilePage.jsx";
import Login from "./features/auth/loginPage.jsx";
import NotificationsPage from "./features/notifications/notificationsPage.jsx";
import BottomNav from "./shared/components/layout/bottomNav.jsx";
import ProtectedRoute from "./shared/components/layout/protectedRoute.jsx";

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-obsidian text-white selection:bg-cyan-glow selection:text-obsidian overflow-x-hidden">
      <AnimatePresence mode="wait">
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
      </AnimatePresence>
      {!isLoginPage && <BottomNav />}
    </div>
  );
}

export default App;
