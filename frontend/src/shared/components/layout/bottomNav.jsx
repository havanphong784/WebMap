import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from "../../../features/auth/context/authContext.jsx";
import { MapIcon, DiscoverIcon, NotificationIcon, UserIcon } from "../common/icons.jsx";

const BottomNav = () => {
  const { user } = useAuthStore();

  const navItems = [
    { icon: MapIcon, path: '/', label: 'Bản đồ' },
    { icon: DiscoverIcon, path: '/discover', label: 'Khám phá' },
    { icon: NotificationIcon, path: '/notifications', label: 'Thông báo' },
    { icon: UserIcon, path: user ? `/profile/${user.uid}` : '/login', label: user ? 'Hồ sơ' : 'Đăng nhập' },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[80%] max-w-lg">
      <nav className="glass-panel py-1.5 px-6 flex justify-between items-center shadow-2xl border-white/5 bg-obsidian/85 backdrop-blur-3xl rounded-xl">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) => `
              relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-300
              ${isActive ? 'text-cyan-glow bg-cyan-glow/5' : 'text-zinc-500 hover:text-white hover:bg-white/5'}
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} className={isActive ? 'drop-shadow-[0_0_8px_rgba(0,245,255,0.5)]' : 'transition-transform group-hover:scale-110'} />
                <span className="hidden sm:block text-[9px] font-bold tracking-wider uppercase mt-1">
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-1 w-4 h-[2px] bg-cyan-glow rounded-full shadow-neon"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default BottomNav;

