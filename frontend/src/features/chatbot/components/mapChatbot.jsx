import {useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import ChatbotAnimation from './chatbotAnimation.jsx';
import GlassPanel from '../../../shared/components/common/glassPanel.jsx';
import {CloseIcon, SendIcon, SparklesIcon} from '../../../shared/components/common/icons.jsx';
import eveSpritesheet from '../styles/eve/spritesheet.webp';
import {isMobile} from '../../../shared/utils/deviceUtils.js';

const ROWS = {
  STARTUP: 0,
  MOVE_RIGHT: 1,
  MOVE_LEFT: 2,
  GREET: 3,
  HAPPY: 4,
  SAD: 5,
  SHUTDOWN: 6,
  LOOK_AROUND: 7,
  SMILE: 8
};

const MapChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Chào bạn, tôi là EVE. Bạn có thể hỏi tôi về địa điểm, thời tiết hoặc lộ trình khám phá gần đây.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeRow, setActiveRow] = useState(ROWS.STARTUP);
  const constraintsRef = useRef(null);
  const botRef = useRef(null);
  const [isTopHalf, setIsTopHalf] = useState(false);
  const [isLeftHalf, setIsLeftHalf] = useState(false);
  const isDragging = useRef(false);
  const [mobile] = useState(() => isMobile());

  useEffect(() => {
    if (isOpen || isDragging.current || mobile) return;

    const idleTimer = setInterval(() => {
      if (Math.random() > 0.7) {
        setActiveRow(ROWS.LOOK_AROUND);
        setTimeout(() => setActiveRow(ROWS.STARTUP), 2000);
      }
    }, 8000);

    return () => clearInterval(idleTimer);
  }, [isOpen, mobile]);

  useEffect(() => {
    if (mobile) return;
    const handleMapActivity = () => {
      if (!isOpen && !isDragging.current && activeRow === ROWS.STARTUP) {
        setActiveRow(ROWS.LOOK_AROUND);
        setTimeout(() => setActiveRow(ROWS.STARTUP), 1500);
      }
    };

    window.addEventListener('wheel', handleMapActivity, {passive: true});
    return () => window.removeEventListener('wheel', handleMapActivity);
  }, [isOpen, activeRow, mobile]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;

    const userMsg = {role: 'user', text: input};
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setActiveRow(ROWS.HAPPY);

    setTimeout(() => {
      setIsTyping(false);
      setActiveRow(ROWS.SMILE);
      setMessages(prev => [...prev, {
        role: 'bot',
        text: 'Tôi đang phân tích yêu cầu của bạn. Bản hoàn chỉnh sẽ sớm có gợi ý địa điểm và lộ trình tốt hơn.'
      }]);

      setTimeout(() => setActiveRow(ROWS.STARTUP), 3000);
    }, 1500);
  };

  const toggleOpen = () => {
    if (isDragging.current) return;

    if (!isOpen && botRef.current) {
      const rect = botRef.current.getBoundingClientRect();
      setIsTopHalf(rect.top < window.innerHeight / 2);
      setIsLeftHalf(rect.left < window.innerWidth / 2);
      setActiveRow(ROWS.GREET);
    } else {
      setActiveRow(ROWS.STARTUP);
    }
    setIsOpen(!isOpen);
  };

  const handleDrag = (event, info) => {
    if (Math.abs(info.delta.x) > 0.5) {
      setActiveRow(info.delta.x > 0 ? ROWS.MOVE_RIGHT : ROWS.MOVE_LEFT);
    }
  };

  const handleDragEnd = () => {
    setTimeout(() => {
      isDragging.current = false;
      setActiveRow(ROWS.STARTUP);
    }, 100);
  };

  return (
    <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[4000]">
      <motion.div
        animate={!mobile}
        ref={botRef}
        drag={!mobile}
        dragConstraints={constraintsRef}
        dragElastic={0.05}
        onDragStart={() => {
          isDragging.current = true;
        }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{
          position: 'absolute',
          ...(mobile
            ? {
              right: '16px',
              bottom: '10.75rem',
              width: '64px',
              height: '64px',
            }
            : {
              left: 'calc(100% - 120px)',
              top: 'calc(100% - 150px)',
              width: '80px',
              height: '80px',
            }),
        }}
        className="pointer-events-auto flex items-center justify-center"
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              animate={{opacity: 1, scale: 1, y: 0, x: 0, filter: 'blur(0px)'}}
              initial={{
                opacity: 0,
                scale: 0.92,
                y: mobile || !isTopHalf ? 18 : -18,
                x: mobile ? 0 : isLeftHalf ? -18 : 18,
                filter: 'blur(8px)'
              }}
              exit={{
                opacity: 0,
                scale: 0.92,
                y: mobile || !isTopHalf ? 18 : -18,
                x: mobile ? 0 : isLeftHalf ? -18 : 18,
                filter: 'blur(8px)'
              }}
              transition={{type: 'spring', damping: 28, stiffness: 360}}
              className="absolute z-50 w-[min(360px,calc(100vw-1.5rem))] sm:w-[390px]"
              style={{
                bottom: mobile ? 'calc(100% + 14px)' : isTopHalf ? 'auto' : '100%',
                top: mobile ? 'auto' : isTopHalf ? '100%' : 'auto',
                left: mobile ? 'auto' : isLeftHalf ? 0 : 'auto',
                right: mobile ? 0 : isLeftHalf ? 'auto' : 0,
                marginBottom: mobile || !isTopHalf ? 0 : undefined,
                marginTop: !mobile && isTopHalf ? '24px' : 0,
                transformOrigin: `${mobile || !isTopHalf ? 'bottom' : 'top'} ${mobile || !isLeftHalf ? 'right' : 'left'}`
              }}
            >
              <GlassPanel
                animate={false}
                variant="floating"
                pad="none"
                className="relative flex h-[min(520px,calc(100dvh-12rem))] min-h-[380px] flex-col overflow-hidden rounded-[1.75rem] border-white/80 bg-white/95 shadow-[0_24px_70px_rgba(22,29,29,0.18)] ring-1 ring-black/5 sm:h-[520px] sm:rounded-[2rem]"
              >
                <div className="flex shrink-0 items-center justify-between border-b border-glass-border bg-white/90 px-4 py-3.5 backdrop-blur-2xl sm:px-5 sm:py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-glow/20 bg-cyan-glow/10 text-cyan-glow shadow-neon">
                      <SparklesIcon size={20}/>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-[13px] font-black uppercase tracking-[0.16em] text-text-primary">
                          EVE Companion
                        </h3>
                        <span className="hidden rounded-full border border-cyan-glow/20 bg-cyan-glow/8 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-cyan-glow sm:inline-flex">
                          Beta
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald shadow-[0_0_10px_rgba(16,185,129,0.65)]"/>
                        <span className="truncate text-[11px] font-bold text-text-muted">
                          Sẵn sàng hỗ trợ
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      setActiveRow(ROWS.STARTUP);
                    }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-glass-border bg-white text-text-muted shadow-sm transition-colors hover:border-sunset/30 hover:bg-sunset/10 hover:text-sunset"
                    aria-label="Đóng chatbot"
                  >
                    <CloseIcon size={18}/>
                  </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto bg-map-bg/80 px-4 py-5 custom-scrollbar sm:px-5">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={`${msg.role}-${idx}`}
                      animate={!mobile ? {opacity: 1, x: 0, y: 0} : {}}
                      initial={!mobile ? {opacity: 0, x: msg.role === 'user' ? 14 : -14, y: 8} : {}}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[86%] rounded-3xl px-4 py-3 text-[13px] font-semibold leading-relaxed shadow-sm ${
                          msg.role === 'user'
                            ? 'rounded-br-lg border border-cyan-glow/30 bg-cyan-glow text-white shadow-neon'
                            : 'rounded-bl-lg border border-glass-border bg-white text-text-secondary'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-1.5 rounded-3xl rounded-bl-lg border border-glass-border bg-white px-4 py-3 shadow-sm">
                        {[0, 1, 2].map((dot) => (
                          <motion.span
                            key={dot}
                            animate={{opacity: [0.35, 1, 0.35], y: [0, -2, 0]}}
                            transition={{repeat: Infinity, duration: 1, delay: dot * 0.16}}
                            className="h-2 w-2 rounded-full bg-cyan-glow"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="shrink-0 border-t border-glass-border bg-white/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-2xl sm:p-4">
                  <div className="flex items-center gap-2 rounded-3xl border border-glass-border bg-map-bg/70 p-1.5 shadow-inner focus-within:border-cyan-glow/40 focus-within:bg-white">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Nhắn cho EVE..."
                      className="min-w-0 flex-1 bg-transparent px-3 text-[13px] font-semibold text-text-primary outline-none placeholder:text-text-muted"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isTyping}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-glow text-white shadow-neon transition-all hover:brightness-105 active:scale-95 disabled:opacity-35 disabled:shadow-none"
                      aria-label="Gửi tin nhắn"
                    >
                      <SendIcon size={18}/>
                    </button>
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          animate={!mobile}
          whileHover={!mobile ? {scale: 1.12} : {}}
          whileTap={{scale: 0.92}}
          onClick={toggleOpen}
          className={`relative flex items-center justify-center transition-all duration-300 group ${mobile ? 'h-16 w-16' : 'h-20 w-20'} ${
            isOpen ? 'scale-95 opacity-95' : ''
          }`}
          aria-label="Mở chatbot EVE"
        >
          {!isOpen && (
            <div className="absolute inset-1 rounded-full bg-cyan-glow/10 blur-xl transition-colors group-hover:bg-cyan-glow/20"/>
          )}

          <ChatbotAnimation
            spritesheetPath={eveSpritesheet}
            size={mobile ? 64 : 80}
            activeRow={activeRow}
            className="pointer-events-none drop-shadow-neon"
          />
        </motion.button>
      </motion.div>
    </div>
  );
};

export default MapChatbot;
