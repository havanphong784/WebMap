import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocationStore } from "../store/useLocationsStore.jsx";
import { useAuthStore } from "../../auth/context/authStore.js";
import { apiClient } from "../../../shared/api/apiClient.js";
import GlassPanel from "../../../shared/components/common/glassPanel.jsx";
import ActionButton from "../../../shared/components/common/actionButton.jsx";
import {
    ArrowIcon,
    CheckIcon,
    CloseIcon,
    CloudIcon,
    CommentIcon,
    CopyIcon,
    DateIcon,
    DropletsIcon,
    ExternalLinkIcon,
    HashIcon,
    LikeIcon,
    LocateIcon,
    PinIcon,
    PlusIcon,
    RouteIcon,
    SendIcon,
    ShareIcon,
    SpinnerIcon,
    StarIcon,
    TagIcon,
    WindIcon
} from "../../../shared/components/common/icons.jsx";
import { parseDBDate } from "../../../shared/utils/dateUtils.js";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import UserBadge from "../../../shared/components/UserBadge.jsx";
import { isMobile } from "../../../shared/utils/deviceUtils.js";

const toRadians = (value) => (value * Math.PI) / 180;

const getDistanceKm = (from, to) => {
    const fromLng = Number(from?.[0]);
    const fromLat = Number(from?.[1]);
    const toLng = Number(to?.lng);
    const toLat = Number(to?.lat);

    if (![fromLng, fromLat, toLng, toLat].every(Number.isFinite)) return null;

    const earthRadiusKm = 6371;
    const dLat = toRadians(toLat - fromLat);
    const dLng = toRadians(toLng - fromLng);
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLng / 2) ** 2;

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (distanceKm) => {
    if (!Number.isFinite(distanceKm)) return null;
    if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
    if (distanceKm < 10) return `${distanceKm.toFixed(1)} km`;
    return `${Math.round(distanceKm)} km`;
};

const formatCoordinates = (location) => {
    const lat = Number(location?.lat);
    const lng = Number(location?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

export default function LocationSidebar({ location, onAddReview, onClose }) {
    const mobile = isMobile();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { fetchRoute, routeLoading, toggleLike, postComment, userLocation } = useLocationStore();

    const [commentText, setCommentText] = useState("");
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(true);
    const [commentsError, setCommentsError] = useState(null);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [toast, setToast] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const [localWeather, setLocalWeather] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [likeOverride, setLikeOverride] = useState(null);
    const scrollRef = useRef(null);

    const group = location?.group || [];
    const hasGroup = group.length > 1;
    const selectedIndex = hasGroup ? Math.min(currentIndex, group.length - 1) : 0;
    const displayLocation = hasGroup ? group[selectedIndex] : location;
    const isGoongPlace = displayLocation?.kind === "goong_place" || displayLocation?.source === "goong";
    const displayTitle = displayLocation?.name || displayLocation?.formatted_address?.split(",")?.[0] || "Địa điểm Goong";
    const displayAddress = typeof displayLocation?.address === "string"
        ? displayLocation.address
        : displayLocation?.display_name || displayLocation?.formatted_address || displayLocation?.address?.display_name || "";
    const displayCategory = displayLocation?.category || displayLocation?.types?.[0] || (isGoongPlace ? "Goong Place" : "other");
    const externalPlaceUrl = displayLocation?.url || (displayLocation?.place_id
        ? `https://maps.goong.io/?pid=${displayLocation.place_id}`
        : null);
    const localLiked = likeOverride?.id === displayLocation?.id
        ? likeOverride.value
        : Boolean(displayLocation?.is_liked);
    const distanceLabel = formatDistance(getDistanceKm(userLocation, displayLocation));
    const coordinateText = formatCoordinates(displayLocation);
    const goongTypes = Array.isArray(displayLocation?.types) ? displayLocation.types.filter(Boolean) : [];
    const goongCompound = displayLocation?.compound && typeof displayLocation.compound === "object"
        ? Object.entries(displayLocation.compound).filter(([, value]) => value)
        : [];
    const goongDeprecatedCompound = displayLocation?.deprecated_compound && typeof displayLocation.deprecated_compound === "object"
        ? Object.entries(displayLocation.deprecated_compound).filter(([, value]) => value)
        : [];
    const goongAddressComponents = Array.isArray(displayLocation?.address_components)
        ? displayLocation.address_components.filter(component => component?.long_name || component?.short_name)
        : [];
    const goongDetailRows = [
        { label: "Place ID", value: displayLocation?.place_id },
        { label: "Reference", value: displayLocation?.reference },
        { label: "Tọa độ", value: coordinateText },
        { label: "Plus code", value: displayLocation?.plus_code?.compound_code || displayLocation?.plus_code?.global_code || displayLocation?.plus_code },
    ].filter(row => row.value);

    const formatImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('blob:')) return url;
        // Prefix with server URL (removing /api from API_BASE_URL)
        const baseUrl = apiClient.API_BASE_URL ? apiClient.API_BASE_URL.replace('/api', '') : 'http://localhost:3000';
        return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 1600);
    };

    const handleOpenProfile = (uid) => {
        if (!uid || isGoongPlace) return;
        onClose();
        navigate(`/profile/${uid}`);
    };

    const handleShare = async () => {
        const locationIdParam = isGoongPlace ? "" : `&locationId=${displayLocation.id}`;
        const shareUrl = `${window.location.origin}/?lat=${displayLocation.lat}&lng=${displayLocation.lng}${locationIdParam}`;
        const shareData = {
            title: displayTitle,
            text: `Khám phá địa điểm "${displayTitle}" trên Aether Geo!`,
            url: shareUrl,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareUrl);
                showToast('✓ Đã sao chép link!');
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                await navigator.clipboard.writeText(shareUrl);
                showToast('✓ Đã sao chép link!');
            }
        }
    };

    useEffect(() => {
        if (!displayLocation?.id || isGoongPlace) {
            return;
        }

        let cancelled = false;

        const loadComments = async () => {
            setLoadingComments(true);
            setCommentsError(null);
            try {
                const result = await apiClient.get(`/comments/${displayLocation.id}/comments`);
                if (!cancelled && result.success) {
                    setComments(result.data);
                } else if (!cancelled) {
                    setCommentsError(result.message || "Không thể tải bình luận");
                }
            } catch (err) {
                console.error(err);
                if (!cancelled) {
                    setCommentsError("Không thể tải bình luận");
                }
            } finally {
                if (!cancelled) {
                    setLoadingComments(false);
                }
            }
        };

        loadComments();

        return () => {
            cancelled = true;
        };
    }, [displayLocation?.id, isGoongPlace]);

    useEffect(() => {
        const fetchFollowStatus = async () => {
            if (isGoongPlace || !user?.uid || !displayLocation?.user_id || user.uid === displayLocation.user_id) return;
            try {
                const followRes = await apiClient.get(`/follows/status?followerId=${user.uid}&followedId=${displayLocation.user_id}`);
                if (followRes.success) setIsFollowing(followRes.data.isFollowing);
            } catch (e) {
                console.error(e);
            }
        };
        fetchFollowStatus();
    }, [user?.uid, displayLocation?.user_id, isGoongPlace]);

    useEffect(() => {
        if (displayLocation?.lat && displayLocation?.lng) {
            const fetchLocalWeather = async () => {
                try {
                    const res = await apiClient.get(`/weather?lat=${displayLocation.lat}&lng=${displayLocation.lng}`);
                    if (res.success) setLocalWeather(res.data);
                } catch (e) {
                    console.error("Lỗi sidebar weather:", e);
                }
            };
            fetchLocalWeather();
        }
    }, [displayLocation?.lat, displayLocation?.lng]);

    const handleToggleFollow = async (e) => {
        e.stopPropagation();
        if (isGoongPlace) return;
        if (!user) {
            navigate('/login');
            return;
        }
        setIsFollowLoading(true);
        try {
            const res = await apiClient.post('/follows/toggle', {
                follower_id: user.uid,
                followed_id: displayLocation.user_id
            });
            if (res.success) {
                setIsFollowing(res.data.followed);
                showToast(res.data.followed ? '✓ Đã theo dõi' : '✓ Đã bỏ theo dõi');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsFollowLoading(false);
        }
    };

    const handleSendComment = async (e) => {
        e.preventDefault();
        if (isGoongPlace || !commentText.trim() || !user || isSubmittingComment) return;

        const content = commentText.trim();
        const tempId = `temp-${Date.now()}`;

        const optimisticComment = {
            id: tempId,
            content: content,
            user_id: user.uid,
            firebase_uid: user.uid,
            user_name: user.displayName || user.email?.split('@')[0] || 'Bạn',
            user_avatar: user.photoURL,
            name: user.displayName || user.email?.split('@')[0] || 'Bạn',
            avatar_url: user.photoURL,
            xp: 0,
            created_at: new Date().toISOString(),
            is_optimistic: true
        };

        setComments(prev => [optimisticComment, ...prev]);
        setCommentText("");
        setIsSubmittingComment(true);

        try {
            const res = await postComment(displayLocation.id, user.uid, content);
            if (res?.success) {
                const refreshRes = await apiClient.get(`/comments/${displayLocation.id}/comments`);
                if (refreshRes.success) {
                    setComments(refreshRes.data);
                }
            } else {
                setComments(prev => prev.filter(c => c.id !== tempId));
                setCommentText(content);
                showToast("Không thể gửi bình luận");
            }
        } catch (err) {
            console.error(err);
            setComments(prev => prev.filter(c => c.id !== tempId));
            setCommentText(content);
            showToast("Lỗi kết nối");
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const copyText = async (text, successMessage) => {
        if (!text) {
            showToast("Không có dữ liệu để sao chép");
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            showToast(successMessage);
        } catch {
            showToast("Không thể sao chép");
        }
    };

    const handleOpenGoongMaps = () => {
        const lat = Number(displayLocation?.lat);
        const lng = Number(displayLocation?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        window.open(
            externalPlaceUrl || `https://maps.goong.io/?lat=${lat}&lng=${lng}&zoom=17`,
            "_blank",
            "noopener,noreferrer"
        );
    };

    const handleGetDirections = () => {
        if (routeLoading) return;

        const destination = [Number(displayLocation.lng), Number(displayLocation.lat)];
        if (!destination.every(Number.isFinite)) {
            showToast("Tọa độ địa điểm không hợp lệ");
            return;
        }

        if (userLocation) {
            fetchRoute(userLocation, destination);
            return;
        }

        navigator.geolocation.getCurrentPosition((pos) => {
            fetchRoute([pos.coords.longitude, pos.coords.latitude], destination);
        }, () => {
            showToast("Không thể lấy vị trí của bạn");
        });
    };

    const handleToggleLike = async () => {
        if (isGoongPlace) return;
        if (!user) {
            navigate('/login');
            return;
        }

        const previousLiked = localLiked;
        setLikeOverride({ id: displayLocation.id, value: !previousLiked });
        const res = await toggleLike(displayLocation.id, user.uid);
        if (!res?.success) {
            setLikeOverride({ id: displayLocation.id, value: previousLiked });
            showToast(res?.message || "Không thể cập nhật lượt thích");
        }
    };

    if (!location) return null;

    const locationOwner = {
        firebase_uid: displayLocation.user_id || displayLocation.firebase_uid,
        name: displayLocation.user_name || displayLocation.name || displayLocation.displayName,
        displayName: displayLocation.user_name || displayLocation.displayName,
        email: displayLocation.user_email || displayLocation.email,
        avatar_url: formatImageUrl(
            displayLocation.user_avatar ||
            displayLocation.avatar_url ||
            displayLocation.user_avatar_url ||
            displayLocation.photoURL ||
            displayLocation.picture
        ),
        xp: displayLocation.user_xp || displayLocation.xp || 0,
        level: displayLocation.user_level || displayLocation.level,
        tier: displayLocation.user_tier || displayLocation.tier
    };

    const level = Math.floor(Math.sqrt((locationOwner.xp || 0) / 10)) + 1;

    return (
        <motion.div
            initial={mobile ? { y: "100%", opacity: 1 } : {
                x: window.innerWidth < 640 ? 0 : "-100%",
                y: window.innerWidth < 640 ? "100%" : 0,
                opacity: 0
            }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={mobile ? { y: "100%" } : {
                x: window.innerWidth < 640 ? 0 : "-100%",
                y: window.innerWidth < 640 ? "100%" : 0,
                opacity: 0
            }}
            transition={mobile ? { duration: 0.3 } : { type: "spring", damping: 25, stiffness: 120 }}
            className="fixed inset-x-0 bottom-0 z-[100] w-full pointer-events-none sm:inset-y-0 sm:left-0 sm:w-[520px] sm:p-5"
        >
            <GlassPanel
                animate={false}
                variant="floating"
                pad="none"
                className="relative flex h-[min(88dvh,760px)] flex-col overflow-hidden rounded-b-none rounded-t-[2rem] border-glass-border bg-white/95 shadow-floating ring-1 ring-glass-border pointer-events-auto sm:h-full sm:rounded-[2rem] group/sidebar">

                <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-black/10 sm:hidden" />

                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"></div>

                <div className="relative shrink-0 p-3 sm:p-4">
                    <div
                        className="relative h-[26dvh] min-h-40 max-h-56 overflow-hidden rounded-[1.5rem] border border-black/5 shadow-lg sm:h-56 sm:rounded-[1.8rem] group/img">
                        <motion.div
                            key={`${displayLocation.id}-${displayLocation.image_url}`}
                            animate={!mobile ? { scale: 1, opacity: 1 } : {}}
                            initial={!mobile ? { scale: 1.1, opacity: 0 } : {}}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="w-full h-full"
                        >
                            {displayLocation.image_url ? (
                                <img
                                    src={formatImageUrl(displayLocation.image_url)}
                                    className="w-full h-full object-cover transition-all duration-700 group-hover/img:scale-110"
                                    alt={displayTitle}
                                />
                            ) : (
                                <div
                                    className="w-full h-full bg-black/[0.03] flex flex-col items-center justify-center gap-3">
                                    <div
                                        className="w-16 h-16 rounded-full bg-black/[0.02] border border-black/5 flex items-center justify-center">
                                        <PinIcon size={24} className="text-text-dim/40" />
                                    </div>
                                    <span
                                        className="text-[10px] font-jakarta font-black uppercase tracking-[0.2em] text-text-dim/50">Không có ảnh</span>
                                </div>
                            )}
                        </motion.div>

                        {hasGroup && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentIndex(prev => (prev - 1 + group.length) % group.length);
                                    }}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 text-black backdrop-blur-xl border border-white/10 hover:border-cyan-glow/40 hover:bg-obsidian/60 hover:scale-110 transition-all active:scale-95 z-20 group/nav shadow-2xl"
                                >
                                    <ArrowIcon size={14}
                                        className="rotate-180 group-hover/nav:-translate-x-0.5 transition-transform" />
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentIndex(prev => (prev + 1) % group.length);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 text-black backdrop-blur-xl border border-white/10 hover:border-cyan-glow/40 hover:bg-obsidian/60 hover:scale-110 transition-all active:scale-95 z-20 group/nav shadow-2xl"
                                >
                                    <ArrowIcon size={14}
                                        className="group-hover/nav:translate-x-0.5 transition-transform" />
                                </button>

                                <div
                                    className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-2xl border border-white/5 text-[9px] font-black text-black tracking-[0.3em] uppercase z-20 shadow-xl">
                                    {selectedIndex + 1} / {group.length}
                                </div>
                            </>
                        )}

                        <div
                            className="absolute inset-0 bg-obsidian/10 group-hover/img:bg-transparent transition-colors duration-500"></div>

                        <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
                            <motion.button
                                whileHover={!mobile ? { scale: 1.1, rotate: 90 } : {}}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="rounded-xl border border-glass-border-bright bg-white/85 p-2 text-text-primary shadow-glass backdrop-blur-2xl transition-colors hover:bg-white"
                                aria-label="Đóng chi tiết địa điểm"
                            >
                                <CloseIcon size={14} />
                            </motion.button>
                            <div className="flex gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.1, y: -2 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleShare}
                                    className="rounded-xl border border-glass-border-bright bg-white/85 p-2 text-text-primary shadow-glass backdrop-blur-2xl transition-colors hover:bg-white"
                                    aria-label="Chia sẻ địa điểm"
                                >
                                    <ShareIcon size={12} />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 px-4 pb-2 sm:px-6">
                    <div className="flex items-center justify-between mb-4">
                        {!isGoongPlace ? (
                            <motion.div
                                animate={{ x: 0, opacity: 1 }}
                                initial={mobile ? false : { x: -10, opacity: 0 }}
                                className="flex items-center gap-3 cursor-pointer group/user"
                                onClick={() => handleOpenProfile(locationOwner.firebase_uid)}
                            >
                                <div className="relative">
                                    <UserBadge user={locationOwner} size={36} hideLevelBadge={true} />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col">
                                        <span
                                            className="text-[13px] font-jakarta font-bold text-text-primary leading-none group-hover/user:text-cyan-glow transition-colors">
                                            {locationOwner.name || 'Explorer'}
                                        </span>
                                        <span
                                            className={`text-[8px] font-bold uppercase tracking-widest mt-1.5 text-text-secondary`}>
                                            Lvl.{level} {locationOwner.tier || 'Wanderer'}
                                        </span>
                                    </div>
                                    {user?.uid && user.uid !== locationOwner.firebase_uid && (
                                        <button
                                            onClick={handleToggleFollow}
                                            disabled={isFollowLoading}
                                            className={`w-6 h-6 flex items-center justify-center rounded-full border shadow-sm transition-all duration-300 shrink-0 ${isFollowing
                                                ? 'bg-white border-glass-border text-text-primary hover:bg-white hover:scale-110'
                                                : 'bg-cyan-glow border-cyan-glow/50 text-white hover:bg-cyan-glow/80 hover:scale-110 shadow-neon-sm'
                                                }`}
                                        >
                                            {isFollowLoading ? (
                                                <div
                                                    className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            ) : isFollowing ? (
                                                <CheckIcon size={12} strokeWidth={3} />
                                            ) : (
                                                <PlusIcon size={12} strokeWidth={3} />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                animate={{ x: 0, opacity: 1 }}
                                initial={mobile ? false : { x: -10, opacity: 0 }}
                                className="flex items-center gap-3"
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-cyan-glow/15 bg-cyan-glow/8 text-cyan-glow">
                                    <PinIcon size={16} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[13px] font-jakarta font-bold text-text-primary leading-none">Goong Map</span>
                                    <span className="text-[8px] font-bold uppercase tracking-widest mt-1.5 text-text-secondary">Place Detail</span>
                                </div>
                            </motion.div>
                        )}

                        <motion.div
                            initial={{ x: 10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="flex gap-2"
                        >
                            <div
                                className="px-2.5 py-1 rounded-full border border-cyan-glow/20 bg-cyan-glow/5 text-cyan-glow text-[8px] font-black uppercase tracking-widest shadow-neon-sm">
                                {displayCategory}
                            </div>
                            {!isGoongPlace && !displayLocation.is_public && (
                                <div
                                    className="px-2.5 py-1 rounded-full border border-glass-border bg-glass-white text-text-muted text-[8px] font-black uppercase tracking-widest">
                                    Private
                                </div>
                            )}
                        </motion.div>
                    </div>

                    <motion.h2
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-xl font-jakarta font-black tracking-tight text-text-primary leading-tight mb-2"
                    >
                        {displayTitle}
                    </motion.h2>

                    {!isGoongPlace && displayLocation.tags?.length > 0 && (
                        <motion.div
                            initial={{ y: 8, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex items-center gap-2 mt-3 flex-wrap"
                        >
                            <TagIcon size={11} className="text-text-dim shrink-0" />
                            {displayLocation.tags.map(tag => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/4 border border-glass-border text-text-muted hover:bg-cyan-glow/5 hover:border-cyan-glow/20 hover:text-cyan-glow transition-all duration-300 text-[10px] font-bold cursor-default"
                                >
                                    <HashIcon size={8} />
                                    {tag}
                                </span>
                            ))}
                        </motion.div>
                    )}
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto p-4 pt-0 custom-scrollbar sm:p-6 sm:pt-0"
                    ref={scrollRef}>
                    {!isGoongPlace ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="relative group/review"
                        >
                            <div
                                className="relative p-4 glass-panel border-glass-border bg-white/30 rounded-[1.2rem] hover:bg-white/50 transition-all duration-300">
                                <div className="absolute top-0 right-0 p-2 opacity-[0.05]">
                                    <CommentIcon size={40} className="text-text-primary" />
                                </div>
                                <p className="text-text-primary text-[13px] leading-relaxed font-medium italic relative z-10">
                                    "{displayLocation.review_text || "Chưa có review chi tiết."}"
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4 rounded-[1.2rem] border border-cyan-glow/10 bg-cyan-glow/5 p-4"
                        >
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-glow">Goong Place Detail</p>
                                <p className="mt-2 text-[13px] font-black leading-tight text-text-primary">{displayTitle}</p>
                                {displayAddress && (
                                    <p className="mt-1 text-[12px] font-medium leading-5 text-text-secondary">{displayAddress}</p>
                                )}
                            </div>

                            {goongTypes.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {goongTypes.map(type => (
                                        <span
                                            key={type}
                                            className="rounded-full border border-cyan-glow/15 bg-white/60 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-text-secondary"
                                        >
                                            {type.replace(/_/g, " ")}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {goongDetailRows.length > 0 && (
                                <div className="grid gap-2">
                                    {goongDetailRows.map(row => (
                                        <button
                                            key={row.label}
                                            type="button"
                                            onClick={() => copyText(String(row.value), `Đã sao chép ${row.label}`)}
                                            className="rounded-2xl border border-glass-border bg-white/65 px-3 py-2 text-left transition-all hover:bg-white active:scale-[0.98]"
                                        >
                                            <p className="text-[8px] font-black uppercase tracking-[0.22em] text-text-muted">{row.label}</p>
                                            <p className="mt-1 truncate text-[12px] font-bold text-text-primary">{String(row.value)}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 text-text-secondary">
                            <div
                                className="w-8 h-8 rounded-xl bg-cyan-glow/5 border border-cyan-glow/10 flex items-center justify-center shrink-0">
                                <PinIcon size={14} className="text-cyan-glow" />
                            </div>
                            <p className="text-[12px] font-medium leading-tight truncate">{displayAddress}</p>
                        </div>

                        {!isGoongPlace && displayLocation.created_at && (
                            <div className="flex items-center gap-3 text-text-dim">
                                <div
                                    className="w-8 h-8 rounded-xl bg-sunset/5 border border-sunset/10 flex items-center justify-center shrink-0">
                                    <DateIcon size={14} className="text-sunset" />
                                </div>
                                <p className="text-[12px] font-medium">
                                    Đã đăng vào {parseDBDate(displayLocation.created_at).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <div
                                className="min-h-14 rounded-2xl border border-cyan-glow/10 bg-cyan-glow/5 px-3 py-2 flex items-center gap-2">
                                <LocateIcon size={15} className="text-cyan-glow shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-text-muted">Cách
                                        bạn</p>
                                    <p className="text-[12px] font-black text-text-primary truncate">{distanceLabel || "Bật vị trí"}</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleOpenGoongMaps}
                                className="min-h-14 rounded-2xl border border-glass-border bg-white/70 px-3 py-2 flex items-center gap-2 text-left transition-all hover:border-cyan-glow/25 hover:bg-white active:scale-[0.98]"
                            >
                                <ExternalLinkIcon size={15} className="text-cyan-glow shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-text-muted">Mở
                                        ngoài</p>
                                    <p className="text-[12px] font-black text-text-primary truncate">Goong Maps</p>
                                </div>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => copyText(displayAddress, "Đã sao chép địa chỉ")}
                                className="rounded-2xl border border-glass-border bg-white/55 px-3 py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary transition-all hover:bg-white hover:text-text-primary active:scale-[0.98]"
                            >
                                <CopyIcon size={13} className="text-cyan-glow" />
                                Địa chỉ
                            </button>
                            <button
                                type="button"
                                onClick={() => copyText(coordinateText, "Đã sao chép tọa độ")}
                                className="rounded-2xl border border-glass-border bg-white/55 px-3 py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary transition-all hover:bg-white hover:text-text-primary active:scale-[0.98]"
                            >
                                <PinIcon size={13} className="text-cyan-glow" />
                                Tọa độ
                            </button>
                        </div>

                        {isGoongPlace && (goongCompound.length > 0 || goongDeprecatedCompound.length > 0 || goongAddressComponents.length > 0) && (
                            <div className="space-y-3 rounded-[1.2rem] border border-glass-border bg-white/55 p-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-primary">
                                    Hành chính
                                </h4>

                                {goongCompound.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {goongCompound.map(([key, value]) => (
                                            <div key={key} className="min-h-14 rounded-2xl border border-cyan-glow/10 bg-cyan-glow/5 px-3 py-2">
                                                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-text-muted">{key}</p>
                                                <p className="mt-1 truncate text-[12px] font-black text-text-primary">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {goongDeprecatedCompound.length > 0 && (
                                    <div className="rounded-2xl border border-sunset/10 bg-sunset/5 px-3 py-2">
                                        <p className="text-[8px] font-black uppercase tracking-[0.18em] text-sunset">Địa giới cũ</p>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {goongDeprecatedCompound.map(([key, value]) => (
                                                <span key={key} className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold text-text-secondary">
                                                    {value}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {goongAddressComponents.length > 0 && (
                                    <div className="space-y-2">
                                        {goongAddressComponents.slice(0, 6).map((component, index) => (
                                            <div key={`${component.long_name || component.short_name}-${index}`} className="flex items-start gap-2 text-[11px]">
                                                <HashIcon size={12} className="mt-0.5 shrink-0 text-cyan-glow" />
                                                <div className="min-w-0">
                                                    <p className="font-bold text-text-primary">{component.long_name || component.short_name}</p>
                                                    {component.types?.length > 0 && (
                                                        <p className="truncate text-[9px] font-bold uppercase tracking-widest text-text-muted">
                                                            {component.types.join(", ")}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {localWeather && (
                            <div className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-left-2">
                                <div className="rounded-2xl border border-cyan-glow/10 bg-cyan-glow/5 px-3 py-2">
                                    <CloudIcon size={14} className="text-cyan-glow mb-1" />
                                    <p className="text-[13px] font-black text-text-primary">{Math.round(localWeather.main.temp)}°C</p>
                                    <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest truncate">
                                        {localWeather.weather[0].description}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-glass-border bg-white/55 px-3 py-2">
                                    <DropletsIcon size={14} className="text-cyan-glow mb-1" />
                                    <p className="text-[13px] font-black text-text-primary">{localWeather.main.humidity || 0}%</p>
                                    <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Ẩm</p>
                                </div>
                                <div className="rounded-2xl border border-glass-border bg-white/55 px-3 py-2">
                                    <WindIcon size={14} className="text-cyan-glow mb-1" />
                                    <p className="text-[13px] font-black text-text-primary">{Math.round(localWeather.wind?.speed || 0)}</p>
                                    <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">m/s</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {!isGoongPlace && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h4
                                    className="text-[10px] font-black text-text-primary uppercase tracking-[0.35em] flex items-center gap-3">
                                    <div
                                        className="w-1.5 h-4 bg-gradient-to-b from-sunset to-sunset/20 rounded-full shadow-sunset"></div>
                                    Thảo luận ({comments.length || displayLocation.comments_count || 0})
                                </h4>
                            </div>

                            {user && (
                                <motion.form
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    onSubmit={handleSendComment}
                                    className="flex gap-2"
                                >
                                    <div
                                        className="flex-1 glass-panel flex items-center px-4 py-0.5 border-glass-border bg-glass-white rounded-xl focus-within:border-cyan-glow/30 focus-within:bg-white/[0.04] transition-all duration-500">
                                        <input
                                            type="text"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            placeholder="Gửi tin nhắn..."
                                            className="bg-transparent border-none outline-none flex-1 text-[12px] text-text-primary placeholder-text-dim py-2.5 font-medium"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!commentText.trim() || isSubmittingComment}
                                            className="text-cyan-glow disabled:text-zinc-800 transition-all hover:scale-110 active:scale-90"
                                        >
                                            {isSubmittingComment ? (
                                                <SpinnerIcon size={18} className="animate-spin" />
                                            ) : (
                                                <SendIcon size={18} className="drop-shadow-neon" />
                                            )}
                                        </button>
                                    </div>
                                </motion.form>
                            )}

                            <div className="space-y-6 pb-2">
                                {loadingComments ? (
                                    <div className="space-y-4">
                                        <SkeletonTheme baseColor="rgba(255,255,255,0.05)"
                                            highlightColor="rgba(255,255,255,0.1)">
                                            {[...Array(3)].map((_, i) => (
                                                <div key={i} className="flex gap-2.5">
                                                    <Skeleton circle width={32} height={32} />
                                                    <div className="flex-1">
                                                        <div className="flex justify-between mb-1">
                                                            <Skeleton width={80} height={10} />
                                                            <Skeleton width={40} height={10} />
                                                        </div>
                                                        <Skeleton height={48} borderRadius={12} />
                                                    </div>
                                                </div>
                                            ))}
                                        </SkeletonTheme>
                                    </div>
                                ) : commentsError ? (
                                    <div className="text-center py-10 bg-white/[0.02] rounded-2xl border border-sunset/20">
                                        <CommentIcon size={20} className="text-sunset/70 mx-auto mb-3" />
                                        <p className="text-text-primary text-[9px] font-black uppercase tracking-[0.3em] mb-2">Không
                                            thể tải bình luận</p>
                                        <p className="text-text-muted text-[11px] font-medium">{commentsError}</p>
                                    </div>
                                ) : comments.length > 0 ? (
                                    comments.map((c) => (
                                        <motion.div
                                            key={c.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex gap-2.5 group cursor-pointer transition-opacity duration-300 ${c.is_optimistic ? 'opacity-50 grayscale' : ''}`}
                                            onClick={() => handleOpenProfile(c.firebase_uid)}
                                        >
                                            <UserBadge user={{ ...c, avatar_url: formatImageUrl(c.avatar_url) }} size={32} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span
                                                        className="text-[11px] font-bold text-text-primary truncate mr-2 group-hover:text-cyan-glow transition-colors">{c.name}</span>
                                                    <span
                                                        className="text-[7px] text-text-muted font-bold uppercase shrink-0">
                                                        {parseDBDate(c.created_at).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                                <div
                                                    className="bg-white/10 rounded-lg rounded-tl-none p-2.5 border border-glass-border text-[11px] text-text-secondary leading-relaxed">
                                                    {c.content}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div
                                        className="text-center py-12 bg-white/[0.01] rounded-2xl border border-glass-border border-dashed">
                                        <CommentIcon size={20} className="text-text-dim mx-auto mb-3" />
                                        <p className="text-text-muted text-[8px] font-black uppercase tracking-[0.4em]">Trống
                                            thảo luận</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div
                    className="relative shrink-0 space-y-4 border-t border-glass-border-bright bg-white/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-3xl sm:p-4">
                    <div
                        className="absolute inset-x-0 -top-6 h-6 bg-linear-to-t from-map-bg/80 to-transparent pointer-events-none"></div>

                    <div className="flex items-stretch gap-2 pt-1 sm:gap-4 sm:pt-2">
                        <ActionButton
                            onClick={() => onAddReview()}
                            variant="secondary"
                            size="lg"
                            className="flex-1 border-sunset/20 bg-sunset/5! text-sunset! shadow-sunset-sm hover:bg-sunset/10! group/review-btn"
                        >
                            <div
                                className="absolute inset-0 bg-sunset opacity-0 group-hover/review-btn:opacity-5 transition-opacity" />
                            <StarIcon size={18} className="fill-current drop-shadow-sunset" />
                            <span
                                className="hidden sm:inline uppercase text-[12px] font-black tracking-widest">
                                {isGoongPlace ? "Lưu review" : "Review"}
                            </span>
                        </ActionButton>

                        <ActionButton
                            loading={routeLoading}
                            onClick={handleGetDirections}
                            size="lg"
                            className="flex-[1.4] gap-3 overflow-hidden shadow-neon group/btn"
                        >
                            <div
                                className="absolute inset-0 bg-linear-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite]"></div>
                            <RouteIcon size={18}
                                className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform text-cyan-glow" />
                            <span className="uppercase text-[13px] font-black tracking-widest">Chỉ đường</span>
                        </ActionButton>

                        {!isGoongPlace && (
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleToggleLike}
                                className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-glass-border bg-white/80 transition-all duration-500 sm:w-auto sm:px-6 ${localLiked ? 'bg-sunset/10 text-sunset border-sunset/20 shadow-sunset' : 'text-text-muted hover:text-text-primary hover:bg-white'}`}
                                aria-label="Thích địa điểm"
                            >
                                <LikeIcon size={24} fill={localLiked ? "currentColor" : "none"}
                                    className={localLiked ? "drop-shadow-[0_0_8px_rgba(255,75,43,0.3)]" : ""} />
                            </motion.button>
                        )}
                    </div>
                </div>
            </GlassPanel>

            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-cyan-glow text-white px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-neon z-50 whitespace-nowrap"
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
