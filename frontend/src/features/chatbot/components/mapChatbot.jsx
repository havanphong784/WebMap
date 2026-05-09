import React, {useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import ChatbotAnimation from './chatbotAnimation.jsx';
import GlassPanel from '../../../shared/components/common/glassPanel.jsx';
import {CloseIcon, SendIcon, SparklesIcon} from '../../../shared/components/common/icons.jsx';
import eveSpritesheet from '../styles/eve/spritesheet.webp';
import { isMobile } from '../../../shared/utils/deviceUtils.js';

const MapChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Chào bạn! Tôi là EVE. Tôi có thể hỗ trợ bạn tìm địa điểm, xem thời tiết hoặc lên lộ trình khám phá. Bạn muốn bắt đầu từ đâu?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeRow, setActiveRow] = useState(0);
  const constraintsRef = useRef(null);
  const botRef = useRef(null);
  const [isTopHalf, setIsTopHalf] = useState(false);
  const [isLeftHalf, setIsLeftHalf] = useState(false);
  const isDragging = useRef(false);
  const mobile = useRef(isMobile()).current;

  // New Animation Row Mapping (0-indexed)
  const ROWS = {
    STARTUP: 0,      // Dòng 1: Khởi động / Idle
    MOVE_RIGHT: 1,   // Dòng 2: Sang phải
    MOVE_LEFT: 2,    // Dòng 3: Sang trái
    GREET: 3,        // Dòng 4: Chào
    HAPPY: 4,        // Dòng 5: Vui sướng
    SAD: 5,          // Dòng 6: Buồn
    SHUTDOWN: 6,     // Dòng 7: Tắt máy
    LOOK_AROUND: 7,  // Dòng 8: Nhìn quanh
    SMILE: 8         // Dòng 9: Cười
  };

  // Random Idle Behavior: Look around occasionally
  useEffect(() => {
    if (isOpen || isDragging.current || mobile) return;

    const idleTimer = setInterval(() => {
      if (Math.random() > 0.7) {
        setActiveRow(ROWS.LOOK_AROUND);
        setTimeout(() => setActiveRow(ROWS.STARTUP), 2000);
      }
    }, 8000);

    return () => clearInterval(idleTimer);
  }, [isOpen]);

  // Listen to general map activity (Look around when user interacts with screen)
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
  }, [isOpen, activeRow]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;

    const userMsg = {role: 'user', text: input};
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setActiveRow(ROWS.HAPPY); // Vui sướng khi nhận tin nhắn

    setTimeout(() => {
      setIsTyping(false);
      setActiveRow(ROWS.SMILE); // Cười khi trả lời xong
      setMessages(prev => [...prev, {
        role: 'bot',
        text: 'Tôi đang phân tích yêu cầu của bạn... Tính năng này sẽ sớm ra mắt hoàn chỉnh. Hiện tại bạn có thể xem các địa điểm "Trending" trong khu vực nhé!'
      }]);

      // Về idle sau một lúc
      setTimeout(() => setActiveRow(ROWS.STARTUP), 3000);
    }, 1500);
  };

  const toggleOpen = () => {
    if (isDragging.current) return;

    if (!isOpen && botRef.current) {
      const rect = botRef.current.getBoundingClientRect();
      setIsTopHalf(rect.top < window.innerHeight / 2);
      setIsLeftHalf(rect.left < window.innerWidth / 2);
      setActiveRow(ROWS.GREET); // Chào khi mở
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
      {/* Draggable Anchor */}
      <motion.div
        animate={!mobile}
        ref={botRef}
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.05}
        onDragStart={() => {
          isDragging.current = true;
        }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{
          position: 'absolute',
          left: 'calc(100% - 120px)',
          top: 'calc(100% - 150px)',
          width: '80px',
          height: '80px',
        }}
        className="pointer-events-auto flex items-center justify-center"
      >
        {/* Chat Window Popup */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              animate={!mobile ? {opacity: 1, scale: 1, y: 0, x: 0, filter: 'blur(0px)'} : {}}
              initial={!mobile ? {
                opacity: 0,
                scale: 0.8,
                y: isTopHalf ? 30 : -30,
                x: isLeftHalf ? -30 : 30,
                filter: 'blur(10px)'
              } : {}}
              exit={{opacity: 0, scale: 0.8, y: isTopHalf ? 30 : -30, x: isLeftHalf ? -30 : 30, filter: 'blur(10px)'}}
              transition={{type: 'spring', damping: 25, stiffness: 350}}
              className="absolute w-[320px] sm:w-[380px] z-50"
              style={{
                bottom: isTopHalf ? 'auto' : '100%',
                top: isTopHalf ? '100%' : 'auto',
                left: isLeftHalf ? 0 : 'auto',
                right: isLeftHalf ? 'auto' : 0,
                marginBottom: isTopHalf ? 0 : '24px',
                marginTop: isTopHalf ? '24px' : 0,
                transformOrigin: `${isTopHalf ? 'top' : 'bottom'} ${isLeftHalf ? 'left' : 'right'}`
              }}
            >
              <GlassPanel
                className="flex flex-col h-[480px] border-glass-border bg-glass-obsidian shadow-glass rounded-[2.5rem] overflow-hidden p-0 backdrop-blur-3xl relative">
                {/* Holographic Scanline Overlay */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%]"/>

                {/* Header */}
                <div
                  className="px-8 py-5 border-b border-glass-border flex justify-between items-center bg-gradient-to-r from-cyan-glow/10 via-cyan-glow/5 to-transparent relative overflow-hidden shrink-0">
                  <div
                    className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-glow/50 to-transparent"/>

                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-cyan-glow/40 rounded-full blur-md animate-pulse"/>
                      <div
                        className="relative w-11 h-11 rounded-full bg-glass-obsidian flex items-center justify-center border border-cyan-glow/40">
                        <SparklesIcon size={20} className="text-cyan-glow"/>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          className="font-jakarta font-extrabold text-[13px] text-text-primary uppercase tracking-[0.25em]">EVE
                          Companion</h3>
                        <span
                          className="px-1.5 py-0.5 rounded-[4px] bg-cyan-glow/10 border border-cyan-glow/20 text-[8px] text-cyan-glow font-black tracking-tighter">v2.4.0</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="relative flex h-2 w-2">
                          <span
                            className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-glow opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-glow"></span>
                        </div>
                        <span className="text-[10px] text-cyan-glow/80 font-bold tracking-tight uppercase">Neural Link Established</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      setActiveRow(ROWS.STARTUP);
                    }}
                    className="group p-2.5 bg-obsidian-light/30 hover:bg-sunset/20 rounded-xl transition-all duration-300 border border-glass-border hover:border-sunset/40"
                  >
                    <CloseIcon size={18} className="text-text-muted group-hover:text-sunset transition-colors"/>
                  </button>
                </div>

                {/* Messages Area */}
                <div
                  className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_50%_-20%,var(--color-cyan-glow),transparent)] bg-[length:100%_40%] bg-no-repeat opacity-90">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      animate={!mobile}
                      initial={!mobile ? {opacity: 0, x: msg.role === 'user' ? 20 : -20, y: 10} : {}}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`relative max-w-[90%] px-5 py-4 rounded-[1.8rem] text-[12px] leading-relaxed font-medium shadow-sm transition-all ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-br from-cyan-glow/30 to-cyan-glow/10 border border-cyan-glow/40 text-text-primary rounded-tr-none'
                            : 'bg-white/90 border border-glass-border text-text-secondary rounded-tl-none shadow-sm'
                        }`}>
                        {msg.role === 'bot' && (
                          <div className="absolute -left-2 top-0 w-1 h-8 bg-cyan-glow/40 rounded-full blur-[1px]"/>
                        )}
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div
                        className="bg-white/90 border border-glass-border px-5 py-3 rounded-[1.5rem] rounded-tl-none flex gap-1.5 items-center shadow-sm">
                        <motion.span animate={{opacity: [0.4, 1, 0.4]}} transition={{repeat: Infinity, duration: 1}}
                                     className="w-2 h-2 bg-cyan-glow rounded-full shadow-neon" />
                        <motion.span animate={{opacity: [0.4, 1, 0.4]}}
                                     transition={{repeat: Infinity, duration: 1, delay: 0.2}}
                                     className="w-2 h-2 bg-cyan-glow rounded-full shadow-neon" />
                        <motion.span animate={{opacity: [0.4, 1, 0.4]}}
                                     transition={{repeat: Infinity, duration: 1, delay: 0.4}}
                                     className="w-2 h-2 bg-cyan-glow rounded-full shadow-neon" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-6 bg-obsidian-light/80 border-t border-glass-border backdrop-blur-3xl relative shrink-0">
                  <div
                    className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-glow/20 to-transparent"/>

                  <div
                    className="flex gap-3 p-2.5 bg-white border border-glass-border rounded-[1.5rem] focus-within:border-cyan-glow/40 transition-all duration-500 shadow-sm group">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Giao tiếp với EVE..."
                      className="flex-1 bg-transparent border-none outline-none px-4 text-[13px] text-text-primary placeholder-text-dim font-semibold"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isTyping}
                      className="flex items-center justify-center w-12 h-12 bg-cyan-glow text-white rounded-2xl shadow-neon hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 disabled:shadow-none transition-all duration-300"
                    >
                      <SendIcon size={20}/>
                    </button>
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trigger Button */}
        <motion.button
          animate={!mobile}
          whileHover={!mobile ? {scale: 1.15} : {}}
          whileTap={{scale: 0.9}}
          onClick={toggleOpen}
          className={`relative w-20 h-20 flex items-center justify-center transition-all duration-500 group ${
            isOpen ? 'scale-90 opacity-90' : ''
          }`}
        >
          {!isOpen && (
            <div
              className="absolute inset-0 bg-cyan-glow/10 rounded-full blur-2xl group-hover:bg-cyan-glow/20 transition-all duration-500 animate-pulse"/>
          )}

          <div className="relative">
            <ChatbotAnimation
              spritesheetPath={eveSpritesheet}
              size={80}
              activeRow={activeRow}
              className="pointer-events-none drop-shadow-neon"
            />
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default MapChatbot;
