import {useEffect, useMemo, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import ChatbotAnimation from './chatbotAnimation.jsx';
import GlassPanel from '../../../shared/components/common/glassPanel.jsx';
import {CloseIcon, PinIcon, RouteIcon, SendIcon, SparklesIcon} from '../../../shared/components/common/icons.jsx';
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

const MapChatbot = () => {
  const locations = useLocationStore(state => state.locations);
  const userLocation = useLocationStore(state => state.userLocation);
  const setRouteData = useLocationStore(state => state.setRouteData);
  const weather = useWeatherStore(state => state.weather);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Chào bạn, tôi là EVE. Tôi có thể gợi ý địa điểm theo vị trí, thời tiết, tag hoặc dựng lịch trình ngắn từ các địa điểm đang có trên bản đồ.'
    }
  ]);
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
  const [isTopHalf, setIsTopHalf] = useState(false);
  const [isLeftHalf, setIsLeftHalf] = useState(false);
  const isDragging = useRef(false);
  const [mobile] = useState(() => isMobile());

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

  const handleSend = async (overrideText = input) => {
    if (!overrideText.trim() || isTyping) return;

    const userMsg = {role: 'user', text: overrideText};
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setActiveRow(ROWS.HAPPY);

    try {
      // Check for local commands first (like "saved trips")
      const normalized = normalizeText(overrideText);
      if (normalized.includes('da luu') || normalized.includes('chuyen di da luu') || normalized.includes('saved')) {
        const botReply = createBotReply(overrideText);
        setMessages(prev => [...prev, botReply]);
        setIsTyping(false);
        setActiveRow(ROWS.SMILE);
        return;
      }

      // Call AI Backend
      const res = await apiClient.post('/chatbot/chat', {
        message: overrideText,
        context: {
          weather,
          locations: locations.slice(0, 20), // Send top 20 locations for context
          userLocation
        }
      });

      setIsTyping(false);
      setActiveRow(ROWS.SMILE);

      if (res.success && res.data?.response) {
        let aiText = res.data.response;
        let actions = null;

        // Try to extract [ACTIONS] block
        const actionMatch = aiText.match(/\[ACTIONS\]:\s*(\{.*\})/);
        if (actionMatch) {
          try {
            actions = JSON.parse(actionMatch[1]);
            // Remove the JSON block from the text shown to user
            aiText = aiText.replace(/\[ACTIONS\]:\s*\{.*\}/, '').trim();
          } catch (e) {
            console.error("Failed to parse AI actions:", e);
          }
        }
        
        const botReply = {
          role: 'bot',
          text: aiText,
        };

        if (actions && actions.type === 'recommendations' && actions.locationIds?.length > 0) {
          const recommended = locations.filter(loc => actions.locationIds.includes(loc.id));
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
              botReply.actions = [{label: 'Tạo lịch trình 4 giờ', type: 'plan', prompt: `Lên lịch trình 4 giờ cho các địa điểm này`}];
            }
          }
        }
        
        setMessages(prev => [...prev, botReply]);
        
        // Trigger side effects
        if (botReply.routeItinerary) {
          showRouteOnMap(botReply.routeItinerary);
        }
        if (botReply.shouldSaveTrip) {
          saveTrip(botReply.itinerary, botReply.tripOptions);
        }
      } else {
        // Fallback to local logic if AI fails
        const botReply = createBotReply(overrideText);
        setMessages(prev => [...prev, botReply]);
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      setIsTyping(false);
      const botReply = createBotReply(overrideText);
      setMessages(prev => [...prev, botReply]);
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
                        className={`max-w-[86%] rounded-3xl px-4 py-3 text-[13px] font-semibold leading-relaxed shadow-sm ${
                          msg.role === 'user'
                            ? 'rounded-br-lg border border-cyan-glow/30 bg-cyan-glow text-white shadow-neon'
                            : 'rounded-bl-lg border border-glass-border bg-white text-text-secondary'
                        }`}
                      >
                        {msg.text}

                        {msg.itinerary?.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {msg.itinerary.map((location, index) => (
                              <div
                                key={`${location.id || location.name}-${index}`}
                                className="rounded-2xl border border-glass-border bg-white/70 px-3 py-2 text-left"
                              >
                                <div className="flex items-start gap-2">
                                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-glow text-[10px] font-black text-white">
                                    {index + 1}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-[12px] font-black text-text-primary">{location.name}</p>
                                    <p className="mt-0.5 line-clamp-2 text-[10px] font-medium text-text-muted">
                                      {location.address || location.category}
                                    </p>
                                  </div>
                                </div>
                              </div>
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
