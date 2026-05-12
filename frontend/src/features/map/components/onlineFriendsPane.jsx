import {memo, useEffect, useMemo, useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {useNavigate} from "react-router-dom";
import UserBadge from "../../../shared/components/UserBadge.jsx";
import GlassPanel from "../../../shared/components/common/glassPanel.jsx";
import {
  ArrowIcon,
  CommentIcon,
  LocateIcon,
  SearchIcon,
  SendIcon,
  UserIcon,
} from "../../../shared/components/common/icons.jsx";
import {useAuthStore} from "../../auth/context/authStore.js";
import {useSocialStore} from "../store/useSocialStore.jsx";
import {isMobile} from "../../../shared/utils/deviceUtils.js";

const hasPosition = (user) => {
  const lat = Number.parseFloat(user?.current_lat);
  const lng = Number.parseFloat(user?.current_lng);
  return Number.isFinite(lat) && Number.isFinite(lng);
};

const isRecentlyOnline = (user) => {
  const lastSeen = new Date(user?.last_seen_at);
  if (Number.isNaN(lastSeen.getTime())) return false;
  return (Date.now() - lastSeen.getTime()) / 1000 / 60 < 2;
};

const getDisplayName = (user) => user?.name || user?.email?.split("@")?.[0] || "Người dùng Aether";

const ChatArrowTab = ({isOpen, onClick}) => {
  const mobile = isMobile();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={false}
      animate={{
        left: isOpen
          ? (mobile ? "calc(100vw - 12px - 44px)" : "500px")
          : "0px"
      }}
      transition={{type: "spring", damping: 25, stiffness: 120}}
      className="fixed top-1/2 z-[9999] flex h-14 w-11 -translate-y-1/2 items-center justify-center rounded-r-2xl border border-l-0 border-cyan-glow/25 bg-white text-cyan-glow shadow-floating backdrop-blur-2xl ring-1 ring-white/80 transition-colors hover:bg-cyan-glow hover:text-white"
      aria-label={isOpen ? "Thu gọn Chat" : "Mở chat bạn bè"}
    >
      <span className="relative h-5 w-5">
        <ArrowIcon size={19} className={`absolute left-0 top-0 transition-transform ${isOpen ? "rotate-180" : ""}`}/>
        <ArrowIcon size={19} className={`absolute left-1.5 top-0 transition-transform ${isOpen ? "rotate-180" : ""}`}/>
      </span>
    </motion.button>
  );
};

const OnlineFriendsPane = memo(({onFlyToUser}) => {
  const navigate = useNavigate();
  const {user: currentUser} = useAuthStore();
  const activeUsers = useSocialStore(state => state.activeUsers);
  const isLoading = useSocialStore(state => state.isLoading);
  const fetchActiveUsers = useSocialStore(state => state.fetchActiveUsers);
  const [isOpen, setIsOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [query, setQuery] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [messagesByUser, setMessagesByUser] = useState({});

  const friends = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return activeUsers
      .filter((item) => item.firebase_uid !== currentUser?.uid)
      .filter((item) => !normalizedQuery || getDisplayName(item).toLowerCase().includes(normalizedQuery))
      .map((item) => ({...item, canLocate: hasPosition(item), isOnline: isRecentlyOnline(item)}));
  }, [activeUsers, currentUser?.uid, query]);

  const activeChatUser = friends.find((item) => item.firebase_uid === activeChatId) || null;
  const activeMessages = activeChatUser ? messagesByUser[activeChatUser.firebase_uid] || [] : [];

  useEffect(() => {
    fetchActiveUsers();
    const interval = setInterval(fetchActiveUsers, 60000);
    return () => clearInterval(interval);
  }, [fetchActiveUsers]);

  const openProfile = (friend) => {
    if (!friend?.firebase_uid) return;
    navigate(`/profile/${friend.firebase_uid}`);
  };

  const openChat = (friend) => {
    setActiveChatId(friend.firebase_uid);
    setDraftMessage("");
  };

  const handleSendMessage = (event) => {
    event.preventDefault();
    const content = draftMessage.trim();
    if (!content || !activeChatUser) return;

    setMessagesByUser((messages) => ({
      ...messages,
      [activeChatUser.firebase_uid]: [
        ...(messages[activeChatUser.firebase_uid] || []),
        {
          id: `${activeChatUser.firebase_uid}-${Date.now()}`,
          content,
          createdAt: new Date().toISOString(),
          fromMe: true,
        },
      ],
    }));
    setDraftMessage("");
  };

  return (
    <>
      <ChatArrowTab isOpen={isOpen} onClick={() => setIsOpen((value) => !value)}/>

      <motion.aside
        initial={false}
        animate={{x: isOpen ? 0 : "-100%", opacity: isOpen ? 1 : 0.98}}
        transition={{type: "spring", damping: 25, stiffness: 120}}
        className={`fixed inset-y-0 left-0 z-1001 w-full p-3 sm:w-130 sm:p-5 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!isOpen}
      >
        <GlassPanel
          variant="floating"
          radius="lg"
          pad="none"
          animate={false}
          className="flex h-full flex-col overflow-hidden rounded-4xl border-glass-border bg-[#f5f7fb]/96 shadow-floating ring-1 ring-glass-border"
        >
          <div className="flex min-h-20 items-center gap-3 border-b border-black/5 bg-white px-4">
            {activeChatUser ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveChatId(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-black/5 hover:text-text-primary"
                  aria-label="Quay lai danh sach chat"
                >
                  <ArrowIcon size={22} className="rotate-180"/>
                </button>
                <button
                  type="button"
                  onClick={() => openProfile(activeChatUser)}
                  className="shrink-0"
                  aria-label={`Mo ho so ${getDisplayName(activeChatUser)}`}
                >
                  <UserBadge user={activeChatUser} size={46} hideLevelBadge isOnline={activeChatUser.isOnline}/>
                </button>
                <button type="button" onClick={() => openChat(activeChatUser)} className="min-w-0 flex-1 text-left">
                  <h2 className="truncate text-lg font-black tracking-tight text-text-primary">
                    {getDisplayName(activeChatUser)}
                  </h2>
                  <p className="mt-0.5 text-xs font-bold text-emerald">
                    {activeChatUser.isOnline ? "Đang hoạt động" : "Vừa hoạt động"}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => onFlyToUser?.(activeChatUser)}
                  disabled={!activeChatUser.canLocate}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-glow text-white shadow-neon transition-all hover:brightness-105 disabled:bg-slate/30 disabled:text-text-muted disabled:shadow-none"
                  aria-label="Di toi vi tri tren ban do"
                >
                  <LocateIcon size={18}/>
                </button>
              </>
            ) : (
              <>
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0084ff] text-white shadow-[0_12px_32px_rgba(0,132,255,0.28)]">
                  <CommentIcon size={22}/>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-black tracking-tight text-text-primary">Chat</h2>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-text-muted">
                    Bạn bè online trên bản đồ
                  </p>
                </div>
              </>
            )}
          </div>

          <AnimatePresence mode="wait">
            {!activeChatUser ? (
              <motion.div
                key="friends-list"
                initial={{opacity: 0, x: -18}}
                animate={{opacity: 1, x: 0}}
                exit={{opacity: 0, x: -18}}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="border-b border-black/5 bg-white px-4 pb-4">
                  <div className="flex min-h-11 items-center gap-2 rounded-full bg-[#eef1f5] px-4">
                    <SearchIcon size={17} className="text-text-muted"/>
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Tim kiem tren Messenger"
                      className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-text-primary outline-none placeholder:text-text-muted"
                    />
                  </div>
                </div>

                <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-3">
                  {isLoading && (
                    <div
                      className="px-3 py-8 text-center text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Đang cập nhật bạn bè...
                    </div>
                  )}

                  {!isLoading && friends.length === 0 && (
                    <div className="px-6 py-16 text-center">
                      <div
                        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e7f3ff] text-[#0084ff]">
                        <UserIcon size={24}/>
                      </div>
                      <p className="text-sm font-black text-text-primary">Chưa có bạn bè online</p>
                      <p className="mt-2 text-xs font-medium leading-6 text-text-muted">
                        Khi người dùng khác online và chia sẻ vị trí, họ sẽ xuất hiện tại đây. Bạn có thể trò chuyện và
                        định vị họ trên bản đồ nếu họ cho phép chia sẻ vị trí.
                      </p>
                    </div>
                  )}

                  {friends.map((friend) => (
                    <div
                      key={friend.firebase_uid}
                      className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-white"
                    >
                      <button
                        type="button"
                        onClick={() => openProfile(friend)}
                        className="shrink-0"
                        aria-label={`Mo ho so ${getDisplayName(friend)}`}
                      >
                        <UserBadge user={friend} size={54} hideLevelBadge isOnline={friend.isOnline}/>
                      </button>

                      <button
                        type="button"
                        onClick={() => openChat(friend)}
                        className="min-w-0 flex-1 text-left"
                        aria-label={`Mo chat voi ${getDisplayName(friend)}`}
                      >
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[15px] font-black text-text-primary">{getDisplayName(friend)}</p>
                          <span
                            className={`h-2.5 w-2.5 shrink-0 rounded-full ${friend.isOnline ? "bg-emerald" : "bg-slate"}`}/>
                        </div>
                        <p className="mt-0.5 truncate text-xs font-semibold text-text-muted">
                          {friend.canLocate ? "Có vị trí trên bản đồ" : "Đang online, chưa chia sẻ vị trí"}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => onFlyToUser?.(friend)}
                        disabled={!friend.canLocate}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e7f3ff] text-[#0084ff] opacity-100 shadow-sm transition-all hover:scale-105 hover:bg-[#0084ff] hover:text-white disabled:cursor-not-allowed disabled:bg-black/5 disabled:text-text-muted sm:opacity-0 sm:group-hover:opacity-100"
                        aria-label={`Di toi vi tri ${getDisplayName(friend)}`}
                      >
                        <LocateIcon size={18}/>
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="chat-detail"
                initial={{opacity: 0, x: 18}}
                animate={{opacity: 1, x: 0}}
                exit={{opacity: 0, x: 18}}
                className="flex min-h-0 flex-1 flex-col bg-white"
              >
                <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f5f7fb] px-4 py-5">
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => openProfile(activeChatUser)}
                      className="flex flex-col items-center"
                    >
                      <UserBadge user={activeChatUser} size={74} hideLevelBadge isOnline={activeChatUser.isOnline}/>
                      <span
                        className="mt-3 text-base font-black text-text-primary">{getDisplayName(activeChatUser)}</span>
                      <span className="mt-1 text-xs font-semibold text-text-muted">Aether Geo</span>
                    </button>
                  </div>

                  <div
                    className="mr-16 max-w-[78%] rounded-[1.25rem] rounded-bl-md bg-white px-4 py-3 text-sm font-medium leading-6 text-text-secondary shadow-sm">
                    {getDisplayName(activeChatUser)} đang online trên bản đồ. Bấm nút định vị ở góc trên để zoom tới vị
                    trí hiện tại.
                  </div>

                  {activeMessages.map((message) => (
                    <div key={message.id} className="flex justify-end">
                      <div
                        className="max-w-[78%] rounded-[1.25rem] rounded-br-md bg-[#0084ff] px-4 py-3 text-sm font-bold leading-6 text-white shadow-[0_10px_24px_rgba(0,132,255,0.22)]">
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage}
                      className="flex items-center gap-2 border-t border-black/5 bg-white p-3">
                  <input
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    placeholder="Aa"
                    className="min-h-11 min-w-0 flex-1 rounded-full bg-[#eef1f5] px-4 text-sm font-semibold text-text-primary outline-none placeholder:text-text-muted"
                  />
                  <button
                    type="submit"
                    disabled={!draftMessage.trim()}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0084ff] text-white shadow-[0_10px_24px_rgba(0,132,255,0.24)] transition-all hover:brightness-105 disabled:bg-[#e7f3ff] disabled:text-[#0084ff] disabled:shadow-none"
                    aria-label="Gui tin nhan"
                  >
                    <SendIcon size={18}/>
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassPanel>
      </motion.aside>
    </>
  );
});

OnlineFriendsPane.displayName = "OnlineFriendsPane";

export default OnlineFriendsPane;
