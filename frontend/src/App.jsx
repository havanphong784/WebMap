import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import MapPage from './pages/Map/MapPage';
import DiscoveryFeed from './pages/Discovery/DiscoveryFeed';
import ProfilePage from './pages/Profile/ProfilePage';
import Login from './pages/Login/Login';
import BottomNav from './components/layout/BottomNav';

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-obsidian text-white selection:bg-cyan-glow selection:text-obsidian overflow-x-hidden">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<MapPage />} />
          <Route path="/discover" element={<DiscoveryFeed />} />
          <Route path="/profile/:uid" element={<ProfilePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<MapPage />} />
        </Routes>
      </AnimatePresence>
      {!isLoginPage && <BottomNav />}
    </div>
  );
}

export default App;