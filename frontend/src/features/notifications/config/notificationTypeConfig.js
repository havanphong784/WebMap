import {
  CommentIcon,
  FollowIcon,
  LikeIcon,
  MapIcon,
  PinIcon
} from "../../../shared/components/common/icons.jsx";

export const notificationTypeConfig = {
  LIKE: {
    icon: LikeIcon,
    color: "text-white",
    bg: "bg-pink-500 border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.4)]",
    label: "THICH"
  },
  COMMENT: {
    icon: CommentIcon,
    color: "text-white",
    bg: "bg-cyan-glow border-cyan-glow/50 shadow-[0_0_15px_rgba(0,243,255,0.4)]",
    label: "BINH LUAN"
  },
  DISCOVERY: {
    icon: PinIcon,
    color: "text-emerald",
    bg: "bg-emerald/20 border-emerald/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]",
    label: "KHAM PHA"
  },
  FOLLOW: {
    icon: FollowIcon,
    color: "text-white",
    bg: "bg-sunset border-sunset/50 shadow-[0_0_15px_rgba(255,75,43,0.4)]",
    label: "THEO DOI"
  },
  NEW_POST: {
    icon: MapIcon,
    color: "text-purple-400",
    bg: "bg-purple-500/20 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.3)]",
    label: "BAI VIET MOI"
  }
};

