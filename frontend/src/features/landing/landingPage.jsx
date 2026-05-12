import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowIcon,
  BrainIcon,
  CommentIcon,
  DiscoverIcon,
  GlobeIcon,
  LocateFixedIcon,
  LocateIcon,
  NextIcon,
  NotificationIcon,
  PinIcon,
  PowerIcon,
  RadarIcon,
  SecurityIcon,
  SparklesIcon,
  StarIcon,
  StyleIcon,
  UsersIcon,
} from '../../shared/components/common/icons.jsx';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/context/authStore.js';

const featureCards = [
  {
    title: 'Bản đồ xã hội sống',
    desc: 'Hiển thị địa điểm cộng đồng chia sẻ cùng ảnh, đánh giá, bình luận và thông tin tương tác ngay trên bản đồ.',
    icon: StyleIcon,
    tone: 'cyan',
  },
  {
    title: 'Khám phá địa điểm',
    desc: 'Tìm kiếm, xem vị trí, chọn tuyến đường và khám phá các điểm nổi bật xung quanh khu vực bạn quan tâm.',
    icon: DiscoverIcon,
    tone: 'sunset',
  },
  {
    title: 'Trợ lý AI EVE',
    desc: 'Hỗ trợ hỏi đáp về địa điểm, gợi ý hành trình và giúp người dùng thao tác nhanh hơn trong trải nghiệm bản đồ.',
    icon: BrainIcon,
    tone: 'slate',
  },
  {
    title: 'Kết nối cộng đồng',
    desc: 'Theo dõi người dùng, nhận thông báo mới và cập nhật hoạt động để hành trình không còn là trải nghiệm đơn lẻ.',
    icon: UsersIcon,
    tone: 'cyan',
  },
];

const stats = [
  { value: '10K+', label: 'địa điểm chia sẻ' },
  { value: '5K+', label: 'người dùng cộng đồng' },
  { value: '1M+', label: 'lượt tương tác' },
];

const journeySteps = [
  {
    title: 'Tìm nơi muốn đến',
    desc: 'Tra cứu địa điểm, xem vị trí trên bản đồ, kiểm tra thời tiết và chọn tuyến đường phù hợp.',
    icon: LocateFixedIcon,
  },
  {
    title: 'Chia sẻ trải nghiệm',
    desc: 'Đăng ảnh, mô tả, đánh giá và bình luận để địa điểm có thêm thông tin từ cộng đồng thật.',
    icon: CommentIcon,
  },
  {
    title: 'Lưu và theo dõi',
    desc: 'Lưu địa điểm yêu thích, theo dõi người dùng khác và nhận thông báo khi có hoạt động mới.',
    icon: NotificationIcon,
  },
];

const mapPins = [
  { label: 'Cafe view sông', x: '18%', y: '28%', color: 'bg-sunset' },
  { label: 'Chợ đêm', x: '58%', y: '22%', color: 'bg-cyan-glow' },
  { label: 'Góc ảnh đẹp', x: '72%', y: '56%', color: 'bg-slate' },
  { label: 'Bạn bè gần đây', x: '34%', y: '68%', color: 'bg-emerald' },
];

const navItems = [
  { label: 'Tổng quan', href: 'overview' },
  { label: 'Tính năng', href: 'features' },
  { label: 'Cách dùng', href: 'journey' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delayChildren: 0.12, staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

const scrollToSection = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const toneClasses = {
  cyan: 'bg-cyan-glow/10 text-cyan-glow border-cyan-glow/20',
  sunset: 'bg-sunset/12 text-sunset border-sunset/25',
  slate: 'bg-slate/12 text-sky-glow border-slate/25',
};

function MapArtwork() {
  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div className="absolute -inset-6 bg-cyan-glow/10 blur-3xl" />
      <div className="landing-art-panel relative aspect-[1.02] overflow-hidden border border-glass-border bg-white/72 p-4 shadow-floating md:p-5">
        <div className="landing-grid absolute inset-0 opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_22%,rgba(0,206,209,0.22),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(212,163,115,0.22),transparent_26%),linear-gradient(135deg,rgba(244,251,250,0.86),rgba(255,255,255,0.62))]" />

        <motion.div
          aria-hidden="true"
          className="landing-orbit absolute left-1/2 top-1/2 h-[82%] w-[82%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-glow/20"
        />
        <motion.div
          aria-hidden="true"
          className="landing-orbit landing-orbit-reverse absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-sunset/25"
        />

        <div className="absolute left-[12%] top-[13%] h-[46%] w-[48%] rotate-[-12deg] rounded-[42%_58%_42%_58%] border border-cyan-glow/20 bg-cyan-glow/8 shadow-neon" />
        <div className="absolute bottom-[12%] right-[8%] h-[44%] w-[45%] rotate-[14deg] rounded-[54%_46%_58%_42%] border border-sunset/20 bg-sunset/10 shadow-sunset" />
        <div className="absolute left-[24%] top-[41%] h-[28%] w-[34%] rotate-[22deg] rounded-[48%_52%_40%_60%] border border-slate/20 bg-white/45" />

        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" role="img" aria-label="Tuyến khám phá trên bản đồ Aether">
          <path
            className="landing-route-draw"
            d="M18 28 C31 20, 42 34, 49 43 S65 49, 72 56 C80 65, 58 77, 34 68"
            fill="none"
            stroke="rgba(0, 206, 209, 0.72)"
            strokeLinecap="round"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />
        </svg>

        {mapPins.map((pin) => (
          <motion.div
            key={pin.label}
            initial={{ opacity: 0, scale: 0.78 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="absolute z-10"
            style={{ left: pin.x, top: pin.y }}
          >
            <div className="relative">
              <span className={`absolute -inset-2 rounded-full ${pin.color}/20 animate-ping`} />
              <span className={`relative flex h-4 w-4 rounded-full ${pin.color} ring-4 ring-white shadow-glass`} />
              <span className="absolute left-5 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-glass-border bg-white/86 px-2 py-1 text-[10px] font-black uppercase text-text-secondary shadow-glass backdrop-blur md:block">
                {pin.label}
              </span>
            </div>
          </motion.div>
        ))}

        <div className="absolute bottom-5 left-5 right-5 grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            ['Live', '42ms'],
            ['Weather', '29°C'],
            ['Route', '4.8km'],
            ['Trust', '98%'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-glass-border bg-white/74 p-3 backdrop-blur">
              <p className="text-[9px] font-black uppercase tracking-normal text-text-muted">{label}</p>
              <p className="mt-1 font-space text-sm font-bold text-text-primary">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Redirect to map if URL contains location parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('lat') || params.has('lng') || params.has('locationId')) {
      navigate(`/map${window.location.search}`, { replace: true });
    }
  }, [navigate]);

  const enterApp = () => navigate(user ? '/map' : '/login');

  return (
    <div className="min-h-screen overflow-x-hidden bg-map-bg font-jakarta text-text-primary selection:bg-cyan-glow selection:text-white">
      <nav className="fixed left-0 top-0 z-50 w-full border-b border-glass-border bg-map-bg/78 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <button onClick={() => scrollToSection('top')} className="flex items-center gap-2" aria-label="Aether Geo trang chủ">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-glow/20 bg-cyan-glow/10 text-cyan-glow shadow-neon">
              <GlobeIcon size={20} />
            </span>
            <span className="text-sm font-black uppercase tracking-normal text-text-primary sm:text-base">
              Aether <span className="text-cyan-glow">Geo</span>
            </span>
          </button>

          <div className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollToSection(item.href)}
                className="text-xs font-black uppercase tracking-normal text-text-muted transition-colors hover:text-text-primary"
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={enterApp}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-glow px-4 py-2 text-xs font-black uppercase tracking-normal text-white shadow-neon transition-all hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0"
          >
            {user ? 'Vào bản đồ' : 'Bắt đầu'}
            <NextIcon size={15} />
          </button>
        </div>
      </nav>

      <main id="top" className="relative pt-16">
        <section className="relative overflow-hidden px-4 pb-12 pt-10 md:px-8 md:pb-16 md:pt-16">
          <div className="absolute inset-0 landing-grid opacity-60" />
          <div className="absolute left-1/2 top-8 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-glow/10 blur-3xl" />
          <div className="absolute bottom-10 right-[-120px] h-[360px] w-[360px] rounded-full bg-sunset/15 blur-3xl" />

          <div className="relative mx-auto grid min-h-[calc(100svh-7rem)] max-w-7xl items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
            <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-3xl">
              <motion.div
                variants={itemVariants}
                className="mb-6 inline-flex items-center gap-2 rounded-lg border border-cyan-glow/20 bg-white/72 px-3 py-2 text-[10px] font-black uppercase tracking-normal text-cyan-glow shadow-glass backdrop-blur"
              >
                <RadarIcon size={14} />
                Nền tảng bản đồ cộng đồng
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="max-w-4xl text-5xl font-black leading-[0.98] tracking-normal text-text-primary sm:text-6xl lg:text-7xl"
              >
                Khám phá và chia sẻ địa điểm theo cách thông minh hơn.
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="mt-6 max-w-2xl text-base font-medium leading-8 text-text-secondary md:text-lg"
              >
                Aether Geo là web bản đồ xã hội giúp người dùng tìm địa điểm, đăng trải nghiệm, xem thông tin thời tiết, kết nối cộng đồng và nhận hỗ trợ từ AI EVE.
              </motion.p>

              <motion.div variants={itemVariants} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={enterApp}
                  className="inline-flex items-center justify-center gap-3 rounded-lg bg-text-primary px-6 py-4 text-sm font-black uppercase tracking-normal text-white shadow-floating transition-all hover:-translate-y-0.5 hover:bg-cyan-glow active:translate-y-0"
                >
                  {user ? 'Mở bản đồ của bạn' : 'Khám phá ngay'}
                  <LocateIcon size={18} />
                </button>
                <button
                  onClick={() => scrollToSection('features')}
                  className="inline-flex items-center justify-center gap-3 rounded-lg border border-glass-border bg-white/74 px-6 py-4 text-sm font-black uppercase tracking-normal text-text-primary shadow-glass backdrop-blur transition-all hover:border-cyan-glow/30 hover:bg-white"
                >
                  Xem tổng quan
                  <ArrowIcon size={18} />
                </button>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-10 grid max-w-2xl grid-cols-3 border-y border-glass-border bg-white/45 backdrop-blur">
                {stats.map((stat) => (
                  <div key={stat.label} className="px-3 py-4 first:pl-0 last:pr-0 md:px-5">
                    <p className="font-space text-2xl font-bold tracking-normal text-cyan-glow md:text-3xl">{stat.value}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-normal text-text-muted">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.7, ease: 'easeOut' }}
              className="relative"
            >
              <MapArtwork />
            </motion.div>
          </div>
        </section>

        <section id="overview" className="relative px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.74fr_1.26fr] lg:items-end">
              <div>
                <p className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-normal text-cyan-glow">
                  <SparklesIcon size={15} />
                  Tổng quan
                </p>
                <h2 className="text-3xl font-black leading-tight tracking-normal text-text-primary md:text-5xl">
                  Một web bản đồ dành cho khám phá, chia sẻ và kết nối địa điểm.
                </h2>
              </div>
              <p className="max-w-2xl text-base font-medium leading-8 text-text-secondary lg:ml-auto">
                Aether Geo kết hợp bản đồ tương tác, bài đăng địa điểm, hồ sơ người dùng, thông báo, thời tiết và chatbot AI trong một trải nghiệm thống nhất. Người dùng có thể khám phá khu vực mới, lưu lại điểm đáng nhớ và đóng góp dữ liệu thực tế cho cộng đồng.
              </p>
            </div>

            <div id="features" className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {featureCards.map((feature, index) => {
                const Icon = feature.icon;

                return (
                  <motion.article
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ delay: index * 0.08, duration: 0.45 }}
                    className="group rounded-lg border border-glass-border bg-white/70 p-5 shadow-glass backdrop-blur transition-all hover:-translate-y-1 hover:border-cyan-glow/35 hover:bg-white"
                  >
                    <div className={`mb-8 inline-flex h-11 w-11 items-center justify-center rounded-lg border ${toneClasses[feature.tone]}`}>
                      <Icon size={21} />
                    </div>
                    <h3 className="text-xl font-black leading-tight tracking-normal text-text-primary">{feature.title}</h3>
                    <p className="mt-3 text-sm font-medium leading-7 text-text-secondary">{feature.desc}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="journey" className="relative overflow-hidden bg-white px-4 py-16 md:px-8 md:py-24">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-glow/40 to-transparent" />
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="relative min-h-[430px] overflow-hidden rounded-lg border border-glass-border bg-map-bg shadow-floating">
              <div className="landing-grid absolute inset-0 opacity-80" />
              <div className="absolute left-8 top-8 flex items-center gap-2 rounded-lg border border-glass-border bg-white/78 px-3 py-2 text-[10px] font-black uppercase tracking-normal text-text-muted backdrop-blur">
                <SecurityIcon size={15} className="text-cyan-glow" />
                lớp dữ liệu cộng đồng
              </div>
              <div className="absolute left-[10%] top-[28%] w-[78%] rounded-lg border border-glass-border bg-white/82 p-4 shadow-glass backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-normal text-cyan-glow">Đang nổi gần bạn</p>
                    <h3 className="mt-2 text-2xl font-black tracking-normal text-text-primary">Cafe ven sông</h3>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg bg-sunset/10 px-2 py-1 text-xs font-black text-sunset">
                    <StarIcon size={14} fill="currentColor" />
                    4.9
                  </div>
                </div>
                <p className="mt-4 text-sm font-medium leading-7 text-text-secondary">
                  128 lượt ghé, 34 lượt lưu, thời tiết đẹp trong 2 giờ tới.
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {['Ảnh', 'Tuyến', 'EVE'].map((item) => (
                    <div key={item} className="rounded-lg border border-glass-border bg-white/70 px-3 py-2 text-center text-[10px] font-black uppercase tracking-normal text-text-muted">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute bottom-8 right-8 flex h-16 w-16 items-center justify-center rounded-lg border border-cyan-glow/20 bg-cyan-glow text-white shadow-neon">
                <CommentIcon size={26} />
              </div>
            </div>

            <div>
              <p className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-normal text-sunset">
                <PinIcon size={15} />
                Cách hoạt động
              </p>
              <h2 className="text-3xl font-black leading-tight tracking-normal text-text-primary md:text-5xl">
                Từ tìm kiếm địa điểm đến chia sẻ trải nghiệm chỉ trong vài bước.
              </h2>
              <div className="mt-8 space-y-4">
                {journeySteps.map((step, index) => {
                  const Icon = step.icon;

                  return (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, x: 24 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-80px' }}
                      transition={{ delay: index * 0.08, duration: 0.45 }}
                      className="grid grid-cols-[48px_1fr] gap-4 rounded-lg border border-glass-border bg-map-bg/70 p-4"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-glow/10 text-cyan-glow">
                        <Icon size={22} />
                      </div>
                      <div>
                        <h3 className="font-black tracking-normal text-text-primary">{step.title}</h3>
                        <p className="mt-1 text-sm font-medium leading-7 text-text-secondary">{step.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="vision" className="relative overflow-hidden px-4 py-16 md:px-8 md:py-24">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,206,209,0.10),transparent_42%,rgba(212,163,115,0.12))]" />
          <div className="relative mx-auto max-w-7xl rounded-lg border border-glass-border bg-text-primary px-5 py-10 text-white shadow-floating md:px-10 md:py-14">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-center">
              <div>
                <p className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-normal text-cyan-glow">
                  <PowerIcon size={15} />
                  Bắt đầu trải nghiệm
                </p>
                <h2 className="max-w-4xl text-3xl font-black leading-tight tracking-normal text-white md:text-5xl">
                  Mở bản đồ, khám phá khu vực xung quanh và để Aether Geo lưu lại hành trình của bạn.
                </h2>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/8 p-5 backdrop-blur">
                <p className="text-sm font-medium leading-7 text-white/76">
                  Tài khoản của bạn đồng bộ địa điểm đã lưu, thông báo cộng đồng, hồ sơ cá nhân và các hoạt động khám phá trên toàn hệ thống.
                </p>
                <button
                  onClick={enterApp}
                  className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-lg bg-cyan-glow px-5 py-4 text-sm font-black uppercase tracking-normal text-white shadow-neon transition-all hover:brightness-105"
                >
                  {user ? 'Đi tới dashboard' : 'Khởi chạy Aether'}
                  <NextIcon size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-glass-border bg-white/70 px-4 py-10 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-normal text-text-primary">Aether Geo-Social</p>
            <p className="mt-1 text-xs font-bold text-text-muted">Geospatial Protocol v1.0.42-STABLE</p>
          </div>
          <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-normal text-text-muted">
            <span>Network status</span>
            <span>Privacy layer</span>
            <span>AI companion</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
