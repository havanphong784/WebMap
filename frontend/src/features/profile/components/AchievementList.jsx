import {memo} from "react";
import {motion} from "framer-motion";
import {CheckIcon, DiscoverIcon, PhotoIcon, StarIcon} from "../../../shared/components/common/icons.jsx";
import GlassPanel from "../../../shared/components/common/glassPanel.jsx";

const categoryIcons = {
  contribution: PhotoIcon,
  exploration: DiscoverIcon,
  general: StarIcon,
};

const rarityStyles = {
  common: {
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    glow: 'bg-emerald-500/5',
    iconBg: 'bg-emerald-500',
    text: 'text-emerald-400',
    progress: 'bg-emerald-500',
    label: 'Common'
  },
  rare: {
    bg: 'bg-cyan-500/10 border-cyan-500/30',
    glow: 'bg-cyan-500/10',
    iconBg: 'bg-cyan-500',
    text: 'text-cyan-400',
    progress: 'bg-cyan-500',
    label: 'Rare'
  },
  epic: {
    bg: 'bg-purple-500/10 border-purple-500/40',
    glow: 'bg-purple-500/15',
    iconBg: 'bg-purple-500',
    text: 'text-purple-400',
    progress: 'bg-purple-500',
    label: 'Epic'
  },
  legendary: {
    bg: 'bg-gradient-to-br from-sunset/20 to-amber-500/10 border-sunset/50',
    glow: 'bg-sunset/20',
    iconBg: 'bg-gradient-to-br from-sunset to-amber-500',
    text: 'text-sunset',
    progress: 'bg-gradient-to-r from-sunset to-amber-500',
    label: 'Legendary',
    special: 'animate-pulse'
  }
};

import { isMobile } from "../../../shared/utils/deviceUtils.js";

const AchievementList = memo(function AchievementList({achievements, dailyTasks, loading}) {
  const mobile = isMobile();
  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-24 bg-white/5 animate-pulse rounded-2xl"/>
      ))}
    </div>
  );

  return (
    <div className="space-y-12 mt-10">
      <section>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-5 bg-sunset rounded-full shadow-sunset"></div>
            <h3 className="text-sm font-jakarta font-black uppercase tracking-widest text-text-primary">
              Nhiệm vụ hàng ngày
            </h3>
          </div>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Làm mới sau 24h</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {dailyTasks?.map((task) => {
            const progressPercent = Math.min(100, (task.current_progress / task.requirement_value) * 100);
            return (
              <GlassPanel
                key={task.id}
                className={`p-5 border-glass-border flex flex-col gap-4 transition-all duration-500 relative overflow-hidden group ${
                  task.is_completed ? 'bg-sunset/10 border-sunset/30' : 'bg-white/20'
                }`}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl transition-all duration-500 ${task.is_completed ? 'bg-sunset text-white shadow-sunset' : 'bg-black/5 text-text-dim'}`}>
                      {task.is_completed ? <CheckIcon size={20}/> : <StarIcon size={20}/>}
                    </div>
                    <div>
                      <h4
                        className={`text-[13px] font-bold tracking-tight ${task.is_completed ? 'text-sunset' : 'text-text-primary'}`}>
                        {task.title_vi}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                                                <span
                                                  className={`text-[12px] font-black ${task.is_completed ? 'text-sunset' : 'text-cyan-glow'}`}>
                                                    +{task.xp_reward} XP
                                                </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                                        <span
                                          className={`text-[10px] font-mono font-bold ${task.is_completed ? 'text-sunset' : 'text-text-muted'}`}>
                                            {task.current_progress}/{task.requirement_value}
                                        </span>
                  </div>
                </div>

                <div className="relative h-1.5 w-full bg-black/5 rounded-full overflow-hidden z-10">
                  <motion.div
                    initial={!mobile ? {width: 0} : {}}
                    animate={!mobile ? {width: `${progressPercent}%`} : {}}
                    style={mobile ? {width: `${progressPercent}%`} : {}}
                    className={`h-full transition-all duration-700 ${task.is_completed ? 'bg-sunset shadow-sunset' : 'bg-cyan-glow/60 shadow-neon'}`}
                  />
                </div>

                {task.is_completed && (
                  <div
                    className="absolute -top-10 -right-10 w-24 h-24 bg-sunset/5 blur-[30px] rounded-full pointer-events-none"/>
                )}
              </GlassPanel>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-5 bg-cyan-glow rounded-full shadow-neon"></div>
          <h3 className="text-sm font-jakarta font-black uppercase tracking-widest text-text-primary">
            Thành tựu trọn đời
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements?.map((ach) => {
            const Icon = categoryIcons[ach.category] || StarIcon;
            const progressPercent = Math.min(100, (ach.current_progress / ach.requirement_value) * 100);
            const style = rarityStyles[ach.rarity] || rarityStyles.common;

            return (
              <motion.div
                key={ach.id}
                whileHover={!mobile ? {y: -5} : {}}
                className="relative"
              >
                <GlassPanel
                  className={`p-6 h-full border-glass-border overflow-hidden group transition-all duration-700 flex flex-col ${
                    ach.is_unlocked ? `${style.bg} ${style.special || ''}` : 'bg-white/10 opacity-70 grayscale-[0.8]'
                  }`}
                >
                  <div className="relative z-10 flex-1">
                    <div className="flex justify-between items-start mb-5">
                      <div
                        className={`p-3.5 rounded-2xl transition-all duration-500 ${ach.is_unlocked ? `${style.iconBg} text-white shadow-lg scale-110` : 'bg-white/10 text-text-muted'}`}>
                        <Icon size={24}/>
                      </div>
                      <div className="text-right">
                                                <span
                                                  className={`text-[12px] font-black block ${ach.is_unlocked ? style.text : 'text-text-dim'}`}>
                                                    +{ach.xp_reward} XP
                                                </span>
                        <span className="text-[8px] font-bold text-text-muted uppercase tracking-tighter mt-1 block">
                                                    {style.label}
                                                </span>
                      </div>
                    </div>
                    <h4
                      className={`text-sm font-jakarta font-black mb-1.5 tracking-tight ${ach.is_unlocked ? 'text-text-primary' : 'text-text-muted'}`}>
                      {ach.title_vi}
                    </h4>
                    <p
                      className={`text-[11px] leading-relaxed mb-6 font-medium ${ach.is_unlocked ? 'text-text-dim' : 'text-text-muted/60'}`}>
                      {ach.description_vi}
                    </p>
                  </div>

                  <div className="space-y-2 relative z-10">
                    <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-wider mb-1">
                      <span className="text-text-muted/70">Tiến độ</span>
                      <span className={`text-[12px] font-mono ${ach.is_unlocked ? style.text : 'text-text-primary'}`}>
                                                {ach.current_progress} <span
                        className="text-[10px] text-text-muted">/ {ach.requirement_value}</span>
                                            </span>
                    </div>
                    <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        initial={!mobile ? {width: 0} : {}}
                        animate={!mobile ? {width: `${progressPercent}%`} : {}}
                        style={mobile ? {width: `${progressPercent}%`} : {}}
                        className={`h-full transition-all duration-1000 ${ach.is_unlocked ? `${style.progress} shadow-lg` : 'bg-zinc-700/50'}`}
                      />
                    </div>
                  </div>

                  {ach.is_unlocked && (
                    <div
                      className={`absolute -bottom-10 -right-10 w-40 h-40 ${style.glow} blur-[50px] rounded-full group-hover:scale-110 transition-all duration-700`}/>
                  )}
                </GlassPanel>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
});

AchievementList.displayName = "AchievementList";

export default AchievementList;
