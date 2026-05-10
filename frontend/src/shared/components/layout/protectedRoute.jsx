import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../features/auth/context/authStore.js';
import { SpinnerIcon } from '../common/icons.jsx';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-obsidian">
        <div className="flex flex-col items-center gap-4">
          <SpinnerIcon size={40} className="text-cyan-glow animate-spin" />
          <span className="text-cyan-glow/50 text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">
            Đang xác thực...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
