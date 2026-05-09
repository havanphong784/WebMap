import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CodexAnimation from './CodexAnimation.jsx';
import GlassPanel from '../../../shared/components/common/glassPanel.jsx';
import { CloseIcon, SendIcon, SparklesIcon } from '../../../shared/components/common/icons.jsx';
import eveSpritesheet from '../styles/eve/spritesheet.webp';

const MapChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Chào bạn! Tôi là EVE. Tôi có thể hỗ trợ bạn tìm địa điểm, xem thời tiết hoặc lên lộ trình khám phá. Bạn muốn bắt đầu từ đâu?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeRow, setActiveRow] = useState(0); // Default to Idle (Row 1)
  const constraintsRef = useRef(null);
  const botRef = useRef(null);
  const [isTopHalf, setIsTopHalf] = useState(false);
  const [isLeftHalf, setIsLeftHalf] = useState(false);
  const isDragging = useRef(false);

  // Animation Row Mapping (0-indexed)
  const ROWS = {
    IDLE: 0,         // Hàng 1
    MOVE_RIGHT: 1,   // Hàng 2
    MOVE_LEFT: 2,    // Hàng 3
    TALKING: 3,      // Hàng 4
    TALK_ALT: 4,     // Hàng 5
    SLIGHTLY_SAD: 5, // Hàng 6
    SAD: 6,          // Hàng 7
    CURIOUS: 7,      // Hàng 8
    ANGRY: 8         // Hàng 9
  };

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setActiveRow(ROWS.TALKING); // Chuyển sang hoạt ảnh nói

    setTimeout(() => {
      setIsTyping(false);
      setActiveRow(ROWS.IDLE); // Về đứng im
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: 'Tôi đang phân tích yêu cầu của bạn... Tính năng này sẽ sớm ra mắt hoàn chỉnh. Hiện tại bạn có thể xem các địa điểm "Trending" trong khu vực nhé!' 
      }]);
    }, 1500);
  };

  const toggleOpen = () => {
    if (isDragging.current) return;
    
    if (!isOpen && botRef.current) {
      const rect = botRef.current.getBoundingClientRect();
      setIsTopHalf(rect.top < window.innerHeight / 2);
      setIsLeftHalf(rect.left < window.innerWidth / 2);
      setActiveRow(ROWS.CURIOUS); // Chuyển sang tò mò khi mở
    } else {
      setActiveRow(ROWS.IDLE);
    }
    setIsOpen(!isOpen);
  };

  const handleDrag = (event, info) => {
    // Detect drag direction
    if (Math.abs(info.delta.x) > 0.5) {
      setActiveRow(info.delta.x > 0 ? ROWS.MOVE_RIGHT : ROWS.MOVE_LEFT);
    }
  };

  const handleDragEnd = () => {
    setTimeout(() => { 
      isDragging.current = false; 
      setActiveRow(ROWS.IDLE); // Về đứng im khi dừng kéo
    }, 100);
  };

  return (
    <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[4000]">
      {/* Draggable Anchor */}
      <motion.div
        ref={botRef}
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.05}
        onDragStart={() => { isDragging.current = true; }}
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
              initial={{ opacity: 0, scale: 0.3, y: isTopHalf ? 50 : -50, x: isLeftHalf ? -50 : 50, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.3, y: isTopHalf ? 50 : -50, x: isLeftHalf ? -50 : 50, filter: 'blur(10px)' }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className="absolute w-80 sm:w-85"
              style={{ 
                bottom: isTopHalf ? 'auto' : '100%',
                top: isTopHalf ? '100%' : 'auto',
                left: isLeftHalf ? 0 : 'auto',
                right: isLeftHalf ? 'auto' : 0,
                marginBottom: isTopHalf ? 0 : '16px',
                marginTop: isTopHalf ? '16px' : 0,
                transformOrigin: `${isTopHalf ? 'top' : 'bottom'} ${isLeftHalf ? 'left' : 'right'}`
              }}
            >
              <GlassPanel className="flex flex-col h-[420px] border-glass-border bg-glass-obsidian shadow-neon-sm rounded-3xl overflow-hidden p-0 backdrop-blur-2xl">
                {/* Header */}
                <div className="px-6 py-4 border-b border-glass-border flex justify-between items-center bg-gradient-to-r from-cyan-glow/10 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-glow/20 flex items-center justify-center border border-cyan-glow/30 shadow-neon-sm">
                      <SparklesIcon size={18} className="text-cyan-glow animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-jakarta font-bold text-xs text-text-primary uppercase tracking-[0.2em]">EVE Companion</h3>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        <span className="text-[10px] text-text-muted font-bold tracking-tight">AI Trực tuyến</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsOpen(false); setActiveRow(ROWS.IDLE); }}
                    className="p-2 hover:bg-white/10 rounded-full transition-all text-text-muted hover:text-white"
                  >
                    <CloseIcon size={16} />
                  </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-black/10">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed font-medium shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-cyan-glow/30 border border-cyan-glow/40 text-text-primary rounded-tr-none' 
                          : 'bg-glass-white border border-glass-border text-text-secondary rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-glass-white border border-glass-border px-4 py-2 rounded-2xl rounded-tl-none flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-cyan-glow rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-cyan-glow rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-cyan-glow rounded-full animate-bounce" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-black/40 border-t border-glass-border">
                  <div className="flex gap-2 p-2 bg-glass-white/50 border border-glass-border rounded-2xl focus-within:border-cyan-glow/50 focus-within:bg-glass-white transition-all duration-300 shadow-inner">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Gửi tin nhắn..."
                      className="flex-1 bg-transparent border-none outline-none px-3 text-xs text-text-primary placeholder-text-dim font-medium"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isTyping}
                      className="p-2.5 bg-cyan-glow text-white rounded-xl shadow-neon-sm hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                    >
                      <SendIcon size={14} />
                    </button>
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trigger Button */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleOpen}
          className={`relative w-20 h-20 flex items-center justify-center transition-all duration-500 group ${
            isOpen ? 'scale-90 opacity-90' : ''
          }`}
        >
          {!isOpen && (
            <div className="absolute inset-0 bg-cyan-glow/10 rounded-full blur-2xl group-hover:bg-cyan-glow/20 transition-all duration-500 animate-pulse" />
          )}
          
          <div className="relative">
            <CodexAnimation 
              spritesheetPath={eveSpritesheet} 
              size={80} 
              activeRow={activeRow}
              className="pointer-events-none drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            />
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default MapChatbot;
