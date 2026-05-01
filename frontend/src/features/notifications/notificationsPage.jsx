import {motion} from "framer-motion";
import {useNavigate} from "react-router-dom";
import {useAuthStore} from "../auth/context/authContext.jsx";
import GlassPanel from "../../shared/components/common/glassPanel.jsx";
import {LikeIcon, CommentIcon, PinIcon, MapIcon} from "../../shared/components/common/icons.jsx";
import ActionButton from "../../shared/components/common/actionButton.jsx";

const mockNotifications = [
  {
    id: 1,
    type: 'like',
    message: 'đã thích địa điểm của bạn',
    target: 'Hồ Gươm về đêm',
    time: '2 phút trước',
    avatar: 'https://picsum.photos/50/50?random=21',
    user: 'Nguyễn Anh',
    read: false,
  },
  {
    id: 2,
    type: 'comment',
    message: 'đã bình luận: "Địa điểm cực đẹp, mình đã ghé qua!"',
    target: 'Phố cổ Hội An',
    time: '15 phút trước',
    avatar: 'https://picsum.photos/50/50?random=22',
    user: 'Trần Minh',
    read: false,
  },
  {
    id: 3,
    type: 'discovery',
    message: 'đã ghim một địa điểm gần bạn',
    target: 'Hang động Phong Nha',
    time: '1 giờ trước',
    avatar: 'https://picsum.photos/50/50?random=23',
    user: 'Lê Thu Hà',
    read: true,
  },
  {
    id: 4,
    type: 'like',
    message: 'và 5 người khác đã thích bài đăng của bạn',
    target: 'Đỉnh Fansipan',
    time: '3 giờ trước',
    avatar: 'https://picsum.photos/50/50?random=24',
    user: 'Phạm Quang',
    read: true,
  },
  {
    id: 5,
    type: 'comment',
    message: 'đã trả lời bình luận của bạn',
    target: 'Vịnh Hạ Long',
    time: 'Hôm qua',
    avatar: 'https://picsum.photos/50/50?random=25',
    user: 'Đỗ Khánh',
    read: true,
  },
];

const typeConfig = {
  like: {icon: LikeIcon, color: 'text-sunset', bg: 'bg-sunset/10 border-sunset/20'},
  comment: {icon: CommentIcon, color: 'text-cyan-glow', bg: 'bg-cyan-glow/10 border-cyan-glow/20'},
  discovery: {icon: PinIcon, color: 'text-emerald', bg: 'bg-emerald/10 border-emerald/20'},
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const {user} = useAuthStore();

  if (!user) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center gap-6">
        <MapIcon size={48} className="text-cyan-glow opacity-30"/>
        <p className="text-zinc-500 font-plus font-bold uppercase tracking-widest text-sm text-center">
          Đăng nhập để xem thông báo
        </p>
        <ActionButton onClick={() => navigate('/login')}>Đăng nhập ngay</ActionButton>
      </div>
    );
  }

  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-map-bg pb-32 overflow-y-auto no-scrollbar">
      <div className="sticky top-0 z-10 bg-obsidian/90 backdrop-blur-xl border-b border-glass-border px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-plus font-black tracking-tight text-text-primary uppercase">Thông báo</h1>
            {unreadCount > 0 && (
              <p className="text-text-secondary text-xs font-bold mt-0.5">
                {unreadCount} thông báo chưa đọc
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button className="text-cyan-glow text-[10px] font-bold uppercase tracking-widest hover:underline">
              Đánh dấu đã đọc
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-6 space-y-3">
        {mockNotifications.map((notif, i) => {
          const config = typeConfig[notif.type] || typeConfig.like;
          const Icon = config.icon;
          return (
            <motion.div
              key={notif.id}
              initial={{opacity: 0, x: -20}}
              animate={{opacity: 1, x: 0}}
              transition={{delay: i * 0.06}}
            >
              <GlassPanel
                className={`p-4 flex items-start gap-4 border-glass-border cursor-pointer hover:border-cyan-glow/20 transition-all duration-300 relative overflow-hidden ${!notif.read ? 'bg-cyan-glow/[0.02]' : ''}`}
                onClick={() => navigate('/')}
              >
                {!notif.read && (
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-cyan-glow shadow-neon"/>
                )}

                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-glass-border">
                    <img src={notif.avatar} className="w-full h-full object-cover" alt="avatar"/>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-lg border ${config.bg}`}>
                    <Icon size={10} className={config.color}/>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-text-primary leading-snug">
                    <span className="font-bold">{notif.user}</span>{' '}
                    <span className="text-text-secondary font-medium">{notif.message}</span>
                  </p>
                  <p className={`text-[11px] font-bold mt-1 ${config.color} truncate`}>
                    📍 {notif.target}
                  </p>
                  <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mt-1">
                    {notif.time}
                  </p>
                </div>
              </GlassPanel>
            </motion.div>
          );
        })}

        {mockNotifications.length === 0 && (
          <div className="text-center py-40 glass-panel border-glass-border rounded-3xl">
            <MapIcon size={48} className="text-text-dim mx-auto mb-4 opacity-20"/>
            <p className="text-text-secondary font-plus font-bold uppercase tracking-widest text-sm">
              Chưa có thông báo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
