import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import ChatbotAnimation from './chatbotAnimation.jsx';
import GlassPanel from '../../../shared/components/common/glassPanel.jsx';
import {CloseIcon, PinIcon, PlusIcon, RouteIcon, SendIcon, SparklesIcon, SpinnerIcon} from '../../../shared/components/common/icons.jsx';
import eveSpritesheet from '../styles/eve/spritesheet.webp';
import {isMobile} from '../../../shared/utils/deviceUtils.js';
import {useLocationStore} from '../../map/store/useLocationsStore.jsx';
import {useWeatherStore} from '../../map/store/useWeatherStore.jsx';
import {apiClient} from '../../../shared/api/apiClient.js';

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

const SAVED_TRIPS_KEY = 'aether.savedTrips';
const CHAT_SESSION_KEY = 'aether.eve.activeSessionId';
const WELCOME_MESSAGE = {
  role: 'bot',
  text: 'Chào bạn, tôi là EVE. Tôi có thể gợi ý địa điểm theo vị trí, thời tiết, tag hoặc dựng lịch trình ngắn từ các địa điểm đang có trên bản đồ.'
};

const normalizeText = (value = '') => (
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
);

const getDistanceKm = (from, location) => {
  const fromLng = Number(from?.[0]);
  const fromLat = Number(from?.[1]);
  const lng = Number(location?.lng);
  const lat = Number(location?.lat);
  if (![fromLng, fromLat, lng, lat].every(Number.isFinite)) return null;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat - fromLat);
  const dLng = toRad(lng - fromLng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(fromLat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const parseTripOptions = (text) => {
  const normalized = normalizeText(text);
  const hoursMatch = normalized.match(/(\d+)\s*(h|gio|hour)/);
  const daysMatch = normalized.match(/(\d+)\s*(ngay|day)/);
  const durationHours = daysMatch
    ? Number(daysMatch[1]) * 8
    : hoursMatch
      ? Number(hoursMatch[1])
      : normalized.includes('ca ngay')
        ? 8
        : 4;

  const budget = normalized.includes('re') || normalized.includes('tiet kiem')
    ? 'Tiết kiệm'
    : normalized.includes('cao') || normalized.includes('sang') || normalized.includes('premium')
      ? 'Thoải mái'
      : 'Vừa phải';

  const preferenceMap = [
    {keyword: 'cafe', label: 'cafe'},
    {keyword: 'ca phe', label: 'cafe'},
    {keyword: 'an', label: 'restaurant'},
    {keyword: 'food', label: 'restaurant'},
    {keyword: 'view', label: 'view'},
    {keyword: 'checkin', label: 'check-in'},
    {keyword: 'check-in', label: 'check-in'},
    {keyword: 'yen tinh', label: 'yên tĩnh'},
    {keyword: 'lich su', label: 'lịch sử'},
    {keyword: 'gia dinh', label: 'gia đình'},
    {keyword: 'dem', label: 'ban đêm'},
  ];

  const preferences = preferenceMap
    .filter(item => normalized.includes(item.keyword))
    .map(item => item.label);

  return {
    durationHours: Math.min(Math.max(durationHours, 2), 24),
    budget,
    preferences: [...new Set(preferences)],
  };
};

const hasLocationSignal = (location, terms) => {
  const haystack = normalizeText([
    location.name,
    location.address,
    location.category,
    ...(location.tags || []),
  ].filter(Boolean).join(' '));
  return terms.some(term => haystack.includes(normalizeText(term)));
};

const scoreLocation = (location, {userLocation, weather, preferences = [], text = ''}) => {
  let score = Number(location.rating || 0) * 2
    + Number(location.likes_count || 0) * 0.35
    + Number(location.comments_count || 0) * 0.2;

  if (preferences.length && hasLocationSignal(location, preferences)) score += 8;

  const searchTerms = normalizeText(text).split(/\s+/).filter(word => word.length > 2);
  if (searchTerms.length && hasLocationSignal(location, searchTerms)) score += 4;

  const condition = normalizeText(weather?.weather?.[0]?.main || weather?.weather?.[0]?.description || '');
  if ((condition.includes('rain') || condition.includes('mua')) && hasLocationSignal(location, ['cafe', 'hotel', 'restaurant', 'trong nhà'])) {
    score += 3;
  }
  if ((condition.includes('clear') || condition.includes('sun')) && hasLocationSignal(location, ['view', 'ngoài trời', 'check-in'])) {
    score += 3;
  }

  const distance = getDistanceKm(userLocation, location);
  if (distance !== null) score += Math.max(0, 6 - distance);

  return score;
};

const getRecommendedLocations = (locations, options) => (
  [...locations]
    .filter(location => Number.isFinite(Number(location.lat)) && Number.isFinite(Number(location.lng)))
    .map(location => ({location, score: scoreLocation(location, options)}))
    .sort((a, b) => b.score - a.score)
    .map(item => item.location)
);

const buildItinerary = (locations, options) => {
  const stopCount = Math.min(6, Math.max(2, Math.ceil(options.durationHours / 2)));
  return getRecommendedLocations(locations, options).slice(0, stopCount);
};

const makeRouteGeometry = (itinerary, userLocation) => {
  const coordinates = [];
  if (userLocation?.length === 2) {
    coordinates.push([Number(userLocation[0]), Number(userLocation[1])]);
  }

  itinerary.forEach(location => {
    coordinates.push([Number(location.lng), Number(location.lat)]);
  });

  if (coordinates.length < 2) return null;
  return {type: 'LineString', coordinates};
};

const makeRoutePoints = (itinerary, userLocation) => {
  const points = [];
  if (userLocation?.length === 2) {
    points.push([Number(userLocation[0]), Number(userLocation[1])]);
  }

  itinerary.forEach(location => {
    points.push([Number(location.lng), Number(location.lat)]);
  });

  return points.filter(point => point.every(Number.isFinite));
};

const formatItineraryText = (itinerary, options, weather) => {
  const weatherText = weather?.weather?.[0]?.description
    ? ` Thời tiết hiện tại: ${weather.weather[0].description}.`
    : '';
  const preferenceText = options.preferences.length
    ? ` Ưu tiên: ${options.preferences.join(', ')}.`
    : '';

  return `Mình đã dựng một lịch trình ${options.durationHours} giờ với ${itinerary.length} điểm dừng, ngân sách ${options.budget.toLowerCase()}.${preferenceText}${weatherText}`;
};

const MessageText = ({ text, isUser }) => {
  if (!text) return null;
  
  // Split by bold patterns **text**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  
  return (
    <div className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className={isUser ? 'text-white' : 'font-black text-text-primary'}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
};

const MapChatbot = ({ onLocationClick }) => {
  const locations = useLocationStore(state => state.locations);
  const userLocation = useLocationStore(state => state.userLocation);
  const setRouteData = useLocationStore(state => state.setRouteData);
  const weather = useWeatherStore(state => state.weather);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(() => localStorage.getItem(CHAT_SESSION_KEY) || null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [failedPrompt, setFailedPrompt] = useState(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [savedTrips, setSavedTrips] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SAVED_TRIPS_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [activeRow, setActiveRow] = useState(ROWS.STARTUP);
  const constraintsRef = useRef(null);
  const botRef = useRef(null);
  const pendingMessageIdRef = useRef(0);
  const [isTopHalf, setIsTopHalf] = useState(false);
  const [isLeftHalf, setIsLeftHalf] = useState(false);
  const isDragging = useRef(false);
  const [mobile, setMobile] = useState(() => isMobile());
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setMobile(isMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const normalizePersistedMessage = useCallback((message) => ({
    id: message.id,
    role: message.role === 'assistant' ? 'bot' : message.role,
    text: message.content,
    metadata: message.metadata || {},
    createdAt: message.created_at,
    feedbackRating: message.feedback_rating,
    status: 'sent',
  }), []);

  const loadSessions = useCallback(async () => {
    const result = await apiClient.get('/chatbot/sessions');
    if (result.success) {
      setSessions(result.data || []);
      return result.data || [];
    }
    return [];
  }, []);

  const loadSessionMessages = useCallback(async (nextSessionId) => {
    if (!nextSessionId) return;
    setIsLoadingHistory(true);
    try {
      const result = await apiClient.get(`/chatbot/sessions/${nextSessionId}/messages`);
      if (result.success) {
        const loadedMessages = (result.data || []).map(normalizePersistedMessage);
        setMessages(loadedMessages.length ? loadedMessages : [WELCOME_MESSAGE]);
        setSessionId(nextSessionId);
        localStorage.setItem(CHAT_SESSION_KEY, nextSessionId);
      }
    } finally {
      setIsLoadingHistory(false);
    }
  }, [normalizePersistedMessage]);

  const startNewChat = useCallback(() => {
    setSessionId(null);
    setMessages([WELCOME_MESSAGE]);
    setFailedPrompt(null);
    localStorage.removeItem(CHAT_SESSION_KEY);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const hydrate = async () => {
      const loadedSessions = await loadSessions();
      if (cancelled) return;

      const sessionToLoad = sessionId || loadedSessions[0]?.id;
      if (sessionToLoad && messages.length <= 1) {
        await loadSessionMessages(sessionToLoad);
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [isOpen, loadSessionMessages, loadSessions, messages.length, sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const quickPrompts = useMemo(() => [
    'Gợi ý quán cafe gần đây',
    'Lên lịch trình 4 giờ, view đẹp, ngân sách vừa phải',
    'Địa điểm phù hợp với thời tiết hiện tại',
    'Xem chuyến đi đã lưu',
  ], []);

  const saveTrip = (itinerary, options) => {
    const stopKey = itinerary.map(location => location.id || location.name).join('-');
    const trip = {
      id: `trip-${options.durationHours}-${stopKey}-${savedTrips.length}`,
      title: `Chuyến đi ${options.durationHours} giờ`,
      options,
      stops: itinerary.map(location => ({
        id: location.id,
        name: location.name,
        address: location.address,
        category: location.category,
        lat: location.lat,
        lng: location.lng,
      })),
    };

    setSavedTrips(prev => {
      const next = [trip, ...prev].slice(0, 10);
      localStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(next));
      return next;
    });

    return trip;
  };

  const showRouteOnMap = async (itinerary) => {
    const points = makeRoutePoints(itinerary, userLocation);
    if (points.length < 2) return;

    try {
      const encodedPoints = encodeURIComponent(points.map(point => point.join(',')).join(';'));
      const result = await apiClient.get(`/locations/routing?points=${encodedPoints}`);
      const geometry = result?.routes?.[0]?.geometry;

      if (geometry?.type === 'LineString' && Array.isArray(geometry.coordinates)) {
        setRouteData(geometry);
        return;
      }
    } catch (error) {
      console.error('Goong itinerary routing error:', error);
    }

    const geometry = makeRouteGeometry(itinerary, userLocation);
    if (geometry) setRouteData(geometry);
  };

  const createBotReply = (text) => {
    const normalized = normalizeText(text);

    if (normalized.includes('da luu') || normalized.includes('chuyen di da luu') || normalized.includes('saved')) {
      if (!savedTrips.length) {
        return {
          role: 'bot',
          text: 'Bạn chưa có chuyến đi nào được lưu. Hãy thử nhắn: "Lên lịch trình 4 giờ cafe view đẹp".',
        };
      }

      return {
        role: 'bot',
        text: `Bạn đang có ${savedTrips.length} chuyến đi đã lưu. Đây là chuyến mới nhất.`,
        itinerary: savedTrips[0].stops,
        actions: [{label: 'Hiển thị tuyến', type: 'route', itinerary: savedTrips[0].stops}],
      };
    }

    const isTripRequest = ['lich trinh', 'trip', 'chuyen di', 'planner', 'ke hoach'].some(keyword => normalized.includes(keyword));
    const options = parseTripOptions(text);
    const recommended = isTripRequest
      ? buildItinerary(locations, {...options, userLocation, weather, text})
      : getRecommendedLocations(locations, {...options, userLocation, weather, text}).slice(0, 5);

    if (!recommended.length) {
      return {
        role: 'bot',
        text: 'Mình chưa thấy đủ địa điểm trong vùng bản đồ hiện tại để gợi ý. Hãy di chuyển/zoom bản đồ hoặc tải thêm dữ liệu địa điểm trước nhé.',
      };
    }

    if (isTripRequest) {
      return {
        role: 'bot',
        text: `${formatItineraryText(recommended, options, weather)} Mình cũng đã lưu vào "Chuyến đi của tôi".`,
        itinerary: recommended,
        routeItinerary: recommended,
        shouldSaveTrip: true,
        tripOptions: options,
        actions: [{label: 'Vẽ lại tuyến', type: 'route', itinerary: recommended}],
      };
    }

    return {
      role: 'bot',
      text: `Mình chọn ${recommended.length} địa điểm phù hợp nhất từ dữ liệu hiện có trên map. Bạn có thể nhắn thêm số giờ/ngân sách để mình biến nó thành lịch trình.`,
      itinerary: recommended,
      actions: [{label: 'Tạo lịch trình 4 giờ', type: 'plan', prompt: `Lên lịch trình 4 giờ ${text}`}],
    };
  };

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

  const buildBotReplyFromAi = (responseText) => {
    let aiText = typeof responseText === 'string' ? responseText : String(responseText || '');
    let actions = null;

    const actionMatch = aiText.match(/\[ACTIONS\]:\s*(\{[\s\S]*?\})(?=\n|$|\[)/);
    if (actionMatch) {
      try {
        actions = JSON.parse(actionMatch[1]);
        aiText = aiText.replace(/\[ACTIONS\]:\s*\{[\s\S]*?\}/, '').trim();
      } catch (error) {
        console.error("Failed to parse AI actions:", error);
      }
    }

    const botReply = {role: 'bot', text: aiText, status: 'sent'};

    if (actions?.type === 'recommendations' && Array.isArray(actions.locationIds) && actions.locationIds.length > 0) {
      const ids = actions.locationIds.map(id => String(id));
      const recommended = locations.filter(loc => ids.includes(String(loc.id)));

      if (recommended.length > 0) {
        botReply.itinerary = recommended;
        if (actions.isItinerary) {
          botReply.routeItinerary = recommended;
          botReply.shouldSaveTrip = true;
          botReply.tripOptions = {
            durationHours: actions.durationHours || 4,
            budget: 'Vừa phải',
            preferences: []
          };
          botReply.actions = [{label: 'Vẽ lại tuyến', type: 'route', itinerary: recommended}];
        } else {
          botReply.actions = [{label: 'Tạo lịch trình 4 giờ', type: 'plan', prompt: 'Lên lịch trình 4 giờ cho các địa điểm này'}];
        }
      }
    }

    return botReply;
  };

  const handleSend = async (overrideText = input) => {
    if (!overrideText.trim() || isTyping) return;

    pendingMessageIdRef.current += 1;
    const optimisticId = `pending-${pendingMessageIdRef.current}`;
    const userMsg = {id: optimisticId, role: 'user', text: overrideText, status: 'sending'};
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setFailedPrompt(null);
    setIsTyping(true);
    setActiveRow(ROWS.HAPPY);

    try {
      const normalized = normalizeText(overrideText);
      if (normalized.includes('da luu') || normalized.includes('chuyen di da luu') || normalized.includes('saved')) {
        const botReply = {...createBotReply(overrideText), status: 'sent'};
        setMessages(prev => prev.map(message => message.id === optimisticId ? {...message, status: 'sent'} : message));
        setMessages(prev => [...prev, botReply]);
        setIsTyping(false);
        setActiveRow(ROWS.SMILE);
        return;
      }

      const res = await apiClient.post('/chatbot/chat', {
        sessionId,
        message: overrideText,
        context: {
          weather,
          locations: locations.slice(0, 20),
          userLocation
        }
      });

      setIsTyping(false);
      setActiveRow(ROWS.SMILE);

      if (res.success && res.data?.response) {
        if (res.data.sessionId && res.data.sessionId !== sessionId) {
          setSessionId(res.data.sessionId);
          localStorage.setItem(CHAT_SESSION_KEY, res.data.sessionId);
          loadSessions();
        }

        const botReply = {
          ...buildBotReplyFromAi(res.data.response),
          id: res.data.assistantMessage?.id,
          createdAt: res.data.assistantMessage?.created_at,
        };

        setMessages(prev => prev.map(message => (
          message.id === optimisticId
            ? {
              ...message,
              id: res.data.userMessage?.id || message.id,
              createdAt: res.data.userMessage?.created_at,
              status: 'sent',
            }
            : message
        )));
        setMessages(prev => [...prev, botReply]);

        if (botReply.routeItinerary) {
          showRouteOnMap(botReply.routeItinerary);
        }
        if (botReply.shouldSaveTrip) {
          saveTrip(botReply.itinerary, botReply.tripOptions);
        }
      } else {
        const botReply = {...createBotReply(overrideText), status: 'sent'};
        setMessages(prev => prev.map(message => (
          message.id === optimisticId ? {...message, status: 'sent'} : message
        )));
        setMessages(prev => [...prev, botReply]);
      }
      setIsTyping(false);
      setActiveRow(ROWS.SMILE);
    } catch (error) {
      console.error("Chatbot error:", error);
      setIsTyping(false);
      setFailedPrompt(overrideText);
      setMessages(prev => prev.map(message => (
        message.id === optimisticId ? {...message, status: 'error'} : message
      )));
    } finally {
      setTimeout(() => setActiveRow(ROWS.STARTUP), 3000);
    }
  };

  const handleMessageAction = (action) => {
    if (action.type === 'route') {
      showRouteOnMap(action.itinerary || []);
      return;
    }
    if (action.type === 'plan') {
      handleSend(action.prompt);
    }
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
              right: '40px',
              bottom: '40px',
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
                className="relative flex h-[min(560px,calc(100dvh-12rem))] min-h-[390px] flex-col overflow-hidden rounded-[1.75rem] border-white/80 bg-white/95 shadow-[0_24px_70px_rgba(22,29,29,0.18)] ring-1 ring-black/5 sm:h-[560px] sm:rounded-[2rem]"
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
                          Planner
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald shadow-[0_0_10px_rgba(16,185,129,0.65)]"/>
                        <span className="truncate text-[11px] font-bold text-text-muted">
                          Dựa trên map, thời tiết và tag
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={startNewChat}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-glow/20 bg-cyan-glow/10 text-cyan-glow shadow-sm transition-colors hover:bg-cyan-glow/15"
                      aria-label="Tao cuoc tro chuyen moi"
                    >
                      <PlusIcon size={18}/>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                        setActiveRow(ROWS.STARTUP);
                      }}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-glass-border bg-white text-text-muted shadow-sm transition-colors hover:border-sunset/30 hover:bg-sunset/10 hover:text-sunset"
                      aria-label="Dong chatbot"
                    >
                      <CloseIcon size={18}/>
                    </button>
                  </div>
                </div>

                <div className="shrink-0 border-b border-glass-border bg-white/90 px-4 py-2 sm:px-5">
                  <select
                    value={sessionId || ''}
                    onChange={(event) => event.target.value ? loadSessionMessages(event.target.value) : startNewChat()}
                    className="w-full rounded-2xl border border-glass-border bg-map-bg/70 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-text-secondary outline-none focus:border-cyan-glow/40"
                  >
                    <option value="">Cuoc tro chuyen moi</option>
                    {sessions.map(session => (
                      <option key={session.id} value={session.id}>
                        {(session.title || session.last_message || 'EVE Chat').slice(0, 42)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto bg-map-bg/80 px-4 py-5 custom-scrollbar sm:px-5">
                  {isLoadingHistory && (
                    <div className="flex items-center justify-center gap-2 rounded-2xl border border-glass-border bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                      <SpinnerIcon size={14} className="animate-spin text-cyan-glow"/>
                      Dang tai lich su
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => handleSend(prompt)}
                        disabled={isTyping}
                        className="rounded-full border border-cyan-glow/20 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-glow shadow-sm transition-all hover:bg-cyan-glow/10 disabled:opacity-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  {messages.map((msg, idx) => (
                    <motion.div
                      key={`${msg.role}-${idx}`}
                      animate={mobile ? undefined : {opacity: 1, x: 0, y: 0}}
                      initial={mobile ? false : {opacity: 0, x: msg.role === 'user' ? 14 : -14, y: 8}}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-3xl px-4 py-3 text-[13px] leading-relaxed shadow-sm ring-1 ${
                          msg.role === 'user'
                            ? 'rounded-br-lg border-transparent bg-cyan-glow font-bold text-white shadow-neon ring-cyan-glow/20'
                            : 'rounded-bl-lg border-transparent bg-white font-medium text-text-secondary ring-black/5'
                        }`}
                      >
                        <MessageText text={msg.text} isUser={msg.role === 'user'} />

                        {msg.itinerary?.length > 0 && (
                          <div className="mt-4 space-y-2 border-t border-glass-border pt-3">
                            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-text-muted">Gợi ý địa điểm:</p>
                            {msg.itinerary.map((location, index) => (
                              <button
                                key={`${location.id || location.name}-${index}`}
                                onClick={() => onLocationClick?.(location)}
                                className="w-full rounded-2xl border border-glass-border bg-white/70 px-3 py-2 text-left transition-all hover:border-cyan-glow/30 hover:bg-white active:scale-[0.98]"
                              >
                                <div className="flex items-start gap-2">
                                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-glow text-[10px] font-black text-white">
                                    {index + 1}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-[12px] font-black text-text-primary">{location.name}</p>
                                    <p className="mt-0.5 line-clamp-1 text-[10px] font-medium text-text-muted">
                                      {location.address || location.category}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {msg.actions?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {msg.actions.map(action => (
                              <button
                                key={action.label}
                                onClick={() => handleMessageAction(action)}
                                className="inline-flex items-center gap-1.5 rounded-full border border-cyan-glow/25 bg-cyan-glow/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-glow transition-all hover:bg-cyan-glow/15"
                              >
                                {action.type === 'route' ? <RouteIcon size={12}/> : <PinIcon size={12}/>}
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {msg.role === 'user' && msg.status && msg.status !== 'sent' && (
                          <div className="mt-2 flex justify-end">
                            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/80">
                              {msg.status === 'sending' ? 'Đang gửi' : 'Lỗi gửi'}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {failedPrompt && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSend(failedPrompt)}
                        disabled={isTyping}
                        className="rounded-full border border-sunset/30 bg-sunset/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-sunset transition-colors hover:bg-sunset/15"
                      >
                        Gửi lại tin nhắn lỗi
                      </button>
                    </div>
                  )}

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
                  <div ref={messagesEndRef} />
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
                      onClick={() => handleSend()}
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
