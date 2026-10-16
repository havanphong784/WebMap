import {memo, useCallback, useEffect, useMemo, useRef, useState} from "react";
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
  SpinnerIcon,
  UserIcon,
} from "../../../shared/components/common/icons.jsx";
import {apiClient} from "../../../shared/api/apiClient.js";
import {useAuthStore} from "../../auth/context/authStore.js";
import {isMobile} from "../../../shared/utils/deviceUtils.js";
import {registerBackHandler} from "../../../platform/backStack.js";

const hasPosition = (user) => {
  const lat = Number.parseFloat(user?.current_lat ?? user?.peer_current_lat);
  const lng = Number.parseFloat(user?.current_lng ?? user?.peer_current_lng);
  return Number.isFinite(lat) && Number.isFinite(lng);
};

const isRecentlyOnline = (user) => {
  const lastSeen = new Date(user?.last_seen_at ?? user?.peer_last_seen_at);
  if (Number.isNaN(lastSeen.getTime())) return false;
  return (Date.now() - lastSeen.getTime()) / 1000 / 60 < 2;
};

const getDisplayName = (user) => user?.name || user?.peer_name || user?.email?.split("@")?.[0] || user?.peer_email?.split("@")?.[0] || "Người dùng Aether";

const formatMessageTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const sameDay = date.toDateString() === new Date().toDateString();
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    ...(sameDay ? {} : {day: "2-digit", month: "2-digit"}),
  }).format(date);
};

const getThreadPeer = (thread) => ({
  firebase_uid: thread.peer_id,
  name: thread.peer_name,
  email: thread.peer_email,
  avatar_url: thread.peer_avatar_url,
  last_seen_at: thread.peer_last_seen_at,
  current_lat: thread.peer_current_lat,
  current_lng: thread.peer_current_lng,
});

const normalizeMessage = (message) => ({
  id: String(message.id),
  sender_id: message.sender_id,
  recipient_id: message.recipient_id,
  content: message.content,
  is_read: message.is_read,
  created_at: message.created_at,
  status: message.status || "sent",
});

const ChatArrowTab = ({isOpen, onClick}) => {
  const mobile = isMobile();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={false}
      animate={{
        left: isOpen
          ? (mobile ? "calc(100vw - 56px)" : "500px")
          : "0px",
      }}
      transition={{type: "spring", damping: 25, stiffness: 120}}
      className="fixed top-1/2 z-[60] flex h-14 w-11 -translate-y-1/2 items-center justify-center rounded-r-2xl border border-l-0 border-cyan-glow/25 bg-white text-cyan-glow shadow-floating ring-1 ring-white/80 transition-colors hover:bg-cyan-glow hover:text-white"
      aria-label={isOpen ? "Thu gọn chat" : "Mở chat bạn bè"}
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
  const bottomRef = useRef(null);
  const {user: currentUser} = useAuthStore();
  const currentUserId = currentUser?.uid;
  const [isOpen, setIsOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [query, setQuery] = useState("");
  const [friendList, setFriendList] = useState([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [messagesByUser, setMessagesByUser] = useState({});
  const [threads, setThreads] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    if (!isOpen) return undefined;
    return registerBackHandler("online-friends", () => {
      if (activeChatId) {
        setActiveChatId(null);
      } else {
        setIsOpen(false);
      }
      return true;
    }, activeChatId ? 35 : 25);
  }, [activeChatId, isOpen]);

  const threadMap = useMemo(() => new Map(threads.map((thread) => [thread.peer_id, thread])), [threads]);

  const friends = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return friendList
      .filter((item) => item.firebase_uid !== currentUserId)
      .filter((item) => !normalizedQuery || getDisplayName(item).toLowerCase().includes(normalizedQuery))
      .map((item) => ({...item, canLocate: hasPosition(item), isOnline: isRecentlyOnline(item)}));
  }, [currentUserId, friendList, query]);

  const activeChatUser = useMemo(() => {
    const onlineUser = friends.find((item) => item.firebase_uid === activeChatId);
    if (onlineUser) return onlineUser;
    const thread = threadMap.get(activeChatId);
    return thread ? {...getThreadPeer(thread), canLocate: hasPosition(thread), isOnline: isRecentlyOnline(thread)} : null;
  }, [activeChatId, friends, threadMap]);

  const activeMessages = activeChatUser ? messagesByUser[activeChatUser.firebase_uid] || [] : [];

  const loadThreads = useCallback(async () => {
    if (!currentUserId) return;
    const result = await apiClient.get("/messages/threads");
    if (result.success) {
      setThreads(result.data || []);
    }
  }, [currentUserId]);

  const loadFriends = useCallback(async ({silent = false} = {}) => {
    if (!currentUserId) return;
    if (!silent) setIsLoadingFriends(true);
    const result = await apiClient.get(`/follows/friends/${currentUserId}`);
    if (result.success) {
      setFriendList(result.data || []);
    } else if (!silent) {
      setChatError(result.message || "Không thể tải danh sách bạn bè.");
    }
    if (!silent) setIsLoadingFriends(false);
  }, [currentUserId]);

  const loadConversation = useCallback(async (peerId, {silent = false} = {}) => {
    if (!peerId || !currentUserId) return;
    if (!silent) setIsLoadingMessages(true);
    const result = await apiClient.get(`/messages/${peerId}?limit=100`);
    if (result.success) {
      setMessagesByUser((messages) => ({
        ...messages,
        [peerId]: (result.data || []).map(normalizeMessage),
      }));
      setChatError("");
      await loadThreads();
    } else if (!silent) {
      setChatError(result.message || "Không thể tải hội thoại.");
    }
    if (!silent) setIsLoadingMessages(false);
  }, [currentUserId, loadThreads]);

  // Lắng nghe SSE: khi có DM mới, append/refresh.
  useEffect(() => {
    if (!currentUserId) return;
    const handler = (event) => {
      const message = event.detail;
      if (!message) return;
      const peerId = message.sender_id === currentUserId ? message.recipient_id : message.sender_id;
      setMessagesByUser((prev) => {
        const existing = prev[peerId] || [];
        if (existing.some((m) => String(m.id) === String(message.id))) return prev;
        return {...prev, [peerId]: [...existing, normalizeMessage(message)]};
      });
      // Refresh thread list để cập nhật last message + unread count
      loadThreads();
    };
    window.addEventListener("aether:new_message", handler);
    return () => window.removeEventListener("aether:new_message", handler);
  }, [currentUserId, loadThreads]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({behavior: "smooth", block: "end"});
  }, [activeMessages.length, activeChatId]);

  const openProfile = (friend) => {
    if (!friend?.firebase_uid) return;
    navigate(`/profile/${friend.firebase_uid}`);
  };

  const openChat = (friend) => {
    if (!friend?.firebase_uid) return;
    setActiveChatId(friend.firebase_uid);
    setDraftMessage("");
    setChatError("");
    void loadConversation(friend.firebase_uid);
  };

  const togglePane = () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen) {
      void loadFriends();
      void loadThreads();
    }
  };

  const appendMessage = (peerId, message) => {
    setMessagesByUser((messages) => ({
      ...messages,
      [peerId]: [
        ...(messages[peerId] || []),
        normalizeMessage(message),
      ],
    }));
  };

  const replaceMessage = (peerId, tempId, nextMessage) => {
    setMessagesByUser((messages) => ({
      ...messages,
      [peerId]: (messages[peerId] || []).map((message) => (
        message.id === tempId ? normalizeMessage(nextMessage) : message
      )),
    }));
  };

  const markMessageFailed = (peerId, tempId) => {
    setMessagesByUser((messages) => ({
      ...messages,
      [peerId]: (messages[peerId] || []).map((message) => (
        message.id === tempId ? {...message, status: "error"} : message
      )),
    }));
  };

  const sendMessageContent = async (content) => {
    if (!content || !activeChatUser?.firebase_uid || !currentUserId) return;

    const peerId = activeChatUser.firebase_uid;
    const tempId = `pending-${Date.now()}`;
    appendMessage(peerId, {
      id: tempId,
      sender_id: currentUserId,
      recipient_id: peerId,
      content,
      created_at: new Date().toISOString(),
      is_read: false,
      status: "sending",
    });

    setIsSending(true);
    setChatError("");
    const result = await apiClient.post(`/messages/${peerId}`, {content});
    setIsSending(false);

    if (result.success) {
      replaceMessage(peerId, tempId, result.data);
      await loadThreads();
    } else {
      markMessageFailed(peerId, tempId);
      setChatError(result.message || "Gửi tin nhắn thất bại.");
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const content = draftMessage.trim();
    if (!content || isSending) return;
    setDraftMessage("");
    await sendMessageContent(content);
  };

  const renderThreadPreview = (friend) => {
    const thread = threadMap.get(friend.firebase_uid);
    if (!thread) {
      return friend.isOnline ? "Đang hoạt động" : "Bạn bè";
    }

    const prefix = thread.sender_id === currentUserId ? "Bạn: " : "";
    return `${prefix}${thread.content}`;
  };

  return (
    <>
      <ChatArrowTab isOpen={isOpen} onClick={togglePane}/>

      <motion.aside
        initial={false}
        animate={{x: isOpen ? 0 : "-100%", opacity: isOpen ? 1 : 0.98}}
        transition={{type: "spring", damping: 25, stiffness: 120}}
        className={`fixed inset-y-0 left-0 z-[60] w-full p-3 sm:w-[520px] sm:p-5 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!isOpen}
      >
        <GlassPanel
          variant="floating"
          radius="lg"
          pad="none"
          animate={false}
          className="flex h-full flex-col overflow-hidden rounded-[2rem] border-glass-border bg-[#f5f7fb]/96 shadow-floating ring-1 ring-glass-border"
        >
          <div className="flex min-h-20 items-center gap-3 border-b border-black/5 bg-white px-4">
            {activeChatUser ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveChatId(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-black/5 hover:text-text-primary"
                  aria-label="Quay lại danh sách chat"
                >
                  <ArrowIcon size={22} className="rotate-180"/>
                </button>
                <button
                  type="button"
                  onClick={() => openProfile(activeChatUser)}
                  className="shrink-0"
                  aria-label={`Mở hồ sơ ${getDisplayName(activeChatUser)}`}
                >
                  <UserBadge user={activeChatUser} size={46} hideLevelBadge isOnline={activeChatUser.isOnline}/>
                </button>
                <button type="button" onClick={() => openProfile(activeChatUser)} className="min-w-0 flex-1 text-left">
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
                  aria-label="Đi tới vị trí trên bản đồ"
                >
                  <LocateIcon size={18}/>
                </button>
              </>
            ) : (
              <>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0084ff] text-white shadow-[0_12px_32px_rgba(0,132,255,0.28)]">
                  <CommentIcon size={22}/>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-black tracking-tight text-text-primary">Chat</h2>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-text-muted">
                    Bạn bè
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
                      placeholder="Tìm kiếm trên Messenger"
                      className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-text-primary outline-none placeholder:text-text-muted"
                    />
                  </div>
                </div>

                <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-3">
                  {isLoadingFriends && (
                    <div className="px-3 py-8 text-center text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Đang cập nhật bạn bè...
                    </div>
                  )}

                  {!isLoadingFriends && friends.length === 0 && (
                    <div className="px-6 py-16 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e7f3ff] text-[#0084ff]">
                        <UserIcon size={24}/>
                      </div>
                      <p className="text-sm font-black text-text-primary">Chưa có bạn bè</p>
                      <p className="mt-2 text-xs font-medium leading-6 text-text-muted">
                        Khi hai người cùng theo dõi nhau, họ sẽ xuất hiện tại đây để bạn nhắn tin.
                      </p>
                    </div>
                  )}

                  {friends.map((friend) => {
                    const thread = threadMap.get(friend.firebase_uid);
                    return (
                      <div
                        key={friend.firebase_uid}
                        className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-white"
                      >
                        <button
                          type="button"
                          onClick={() => openProfile(friend)}
                          className="shrink-0"
                          aria-label={`Mở hồ sơ ${getDisplayName(friend)}`}
                        >
                          <UserBadge user={friend} size={54} hideLevelBadge isOnline={friend.isOnline}/>
                        </button>

                        <button
                          type="button"
                          onClick={() => openChat(friend)}
                          className="min-w-0 flex-1 text-left"
                          aria-label={`Mở chat với ${getDisplayName(friend)}`}
                        >
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[15px] font-black text-text-primary">{getDisplayName(friend)}</p>
                            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${friend.isOnline ? "bg-emerald" : "bg-slate"}`}/>
                            {thread?.unread_count > 0 && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0084ff] px-1.5 text-[10px] font-black text-white">
                                {thread.unread_count}
                              </span>
                            )}
                          </div>
                          <p className={`mt-0.5 truncate text-xs ${thread?.unread_count > 0 ? "font-black text-text-primary" : "font-semibold text-text-muted"}`}>
                            {renderThreadPreview(friend)}
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => onFlyToUser?.(friend)}
                          disabled={!friend.canLocate}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e7f3ff] text-[#0084ff] opacity-100 shadow-sm transition-all hover:scale-105 hover:bg-[#0084ff] hover:text-white disabled:cursor-not-allowed disabled:bg-black/5 disabled:text-text-muted sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label={`Đi tới vị trí ${getDisplayName(friend)}`}
                        >
                          <LocateIcon size={18}/>
                        </button>
                      </div>
                    );
                  })}
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
                      <span className="mt-3 text-base font-black text-text-primary">{getDisplayName(activeChatUser)}</span>
                      <span className="mt-1 text-xs font-semibold text-text-muted">Aether Geo</span>
                    </button>
                  </div>

                  <div className="mr-16 max-w-[78%] rounded-[1.25rem] rounded-bl-md bg-white px-4 py-3 text-sm font-medium leading-6 text-text-secondary shadow-sm">
                    Hai bạn đang theo dõi lẫn nhau. Bạn có thể nhắn tin trực tiếp tại đây.
                  </div>

                  {isLoadingMessages && (
                    <div className="flex justify-center py-3 text-xs font-bold text-text-muted">
                      <SpinnerIcon size={16} className="mr-2 animate-spin"/>
                      Đang tải hội thoại...
                    </div>
                  )}

                  {activeMessages.map((message) => {
                    const fromMe = message.sender_id === currentUserId;
                    return (
                      <div key={message.id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[78%] rounded-[1.25rem] px-4 py-3 text-sm font-bold leading-6 shadow-sm ${
                          fromMe
                            ? "rounded-br-md bg-[#0084ff] text-white shadow-[0_10px_24px_rgba(0,132,255,0.22)]"
                            : "rounded-bl-md bg-white text-text-primary"
                        }`}>
                          <p className="break-words">{message.content}</p>
                          {message.created_at && (
                            <div className={`mt-1 text-[10px] font-black ${fromMe ? "text-white/70" : "text-text-muted"}`}>
                              {formatMessageTime(message.created_at)}
                            </div>
                          )}
                          {message.status !== "sent" && (
                            <div className={`mt-1 text-[10px] font-black ${fromMe ? "text-white/75" : "text-text-muted"}`}>
                              {message.status === "sending" ? "Đang gửi..." : "Gửi lỗi"}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {chatError && (
                    <div className="rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
                      {chatError}
                    </div>
                  )}
                  <div ref={bottomRef}/>
                </div>

                <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t border-black/5 bg-white p-3">
                  <input
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    placeholder="Aa"
                    className="min-h-11 min-w-0 flex-1 rounded-full bg-[#eef1f5] px-4 text-sm font-semibold text-text-primary outline-none placeholder:text-text-muted"
                  />
                  <button
                    type="submit"
                    disabled={!draftMessage.trim() || isSending}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0084ff] text-white shadow-[0_10px_24px_rgba(0,132,255,0.24)] transition-all hover:brightness-105 disabled:bg-[#e7f3ff] disabled:text-[#0084ff] disabled:shadow-none"
                    aria-label="Gửi tin nhắn"
                  >
                    {isSending ? <SpinnerIcon size={18} className="animate-spin"/> : <SendIcon size={18}/>}
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
