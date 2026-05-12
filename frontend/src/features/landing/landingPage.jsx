import React from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  MapPin, 
  Users, 
  Zap, 
  Layers, 
  Compass, 
  Star, 
  Bookmark, 
  Brain, 
  Activity,
  ArrowUpRight,
  Shield,
  Home,
  Bell,
  User,
  Plus,
  BookMarked
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const features = [
    {
      title: "Bản Đồ 3D",
      desc: "Hiển thị các lớp địa lý với độ chi tiết cực cao, tối ưu hóa cho phân tích không gian thực.",
      icon: <Layers className="w-6 h-6 text-cyan-glow" />,
      color: "bg-cyan-glow/10"
    },
    {
      title: "Khám Phá Thông Minh",
      desc: "Thuật toán đề xuất địa điểm dựa trên lịch sử di chuyển và sở thích cá nhân.",
      icon: <Compass className="w-6 h-6 text-sunset" />,
      color: "bg-sunset/10",
      border: "border-t-2 border-t-sunset"
    },
    {
      title: "Đánh Giá Cộng Đồng",
      desc: "Dữ liệu thực tế từ cộng đồng người dùng tin cậy trên toàn cầu.",
      icon: <Users className="w-6 h-6 text-cyan-glow" />,
      color: "bg-cyan-glow/10"
    },
    {
      title: "Bộ Sưu Tập",
      desc: "Lưu trữ và phân loại các điểm mốc quan trọng theo phong cách cá nhân.",
      icon: <BookMarked className="w-6 h-6 text-slate" />,
      color: "bg-slate/10",
      border: "border-t-2 border-t-slate"
    },
    {
      title: "Trợ Lý AI EVE",
      desc: "Hệ thống trí tuệ nhân tạo hỗ trợ điều hướng và giải đáp thông tin tức thời.",
      icon: <Brain className="w-6 h-6 text-white" />,
      color: "bg-cyan-glow shadow-neon",
      highlight: true
    },
    {
      title: "Kết Nối Real-time",
      desc: "Cập nhật trạng thái mạng lưới và tương tác với người dùng khác trong thời gian thực.",
      icon: <Zap className="w-6 h-6 text-cyan-glow" />,
      color: "bg-cyan-glow/10"
    }
  ];

  return (
    <div className="min-h-screen bg-map-bg text-text-primary font-jakarta selection:bg-cyan-glow selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 glass-panel shadow-glass border-b border-glass-border h-16 flex justify-between items-center px-6 md:px-10">
        <div className="flex items-center gap-2">
          <Globe className="w-6 h-6 text-cyan-glow" />
          <span className="text-xl font-black tracking-tighter text-text-primary uppercase">Aether <span className="text-cyan-glow">Geo</span></span>
        </div>
        
        <button 
          onClick={() => navigate('/login')}
          className="btn-primary text-xs tracking-widest uppercase py-2 px-6"
        >
          Launch Protocol
        </button>
      </nav>

      <main className="relative pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex flex-col justify-center px-6 md:px-10 overflow-hidden">
          {/* Background Map Simulation */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-map-bg/80 via-map-bg/90 to-map-bg z-10"></div>
            <img 
              src="https://lh3.googleusercontent.com/aida/ADBb0ug0XWzQXnJ4ZJMV4rEjP9adTAsdOVFrtKjy0p-_L7wRKXvBcpybSfccjJIdGXsgksCzpImT_59Q983KhS_AIo-sNuISZ2D4DLE56FIi7B5YFBLXO1NyDN31_69F6cS18KYVjqhelc55WxXscaW-6sgJ6Z5_iKfRjAEto6PZGYiu8ibsmHQ3JNsKlg9kO5BAZrOkyYOUZmHA5B4gmUmwxr0ETTFmXAlhRzf5EOqZWmdU2Q0hZq3A7kh3FnZ3dA4XH0UgIUQO_hBIAd0" 
              alt="Light Map Background"
              className="w-full h-full object-cover opacity-50 grayscale contrast-125"
            />
          </div>

          {/* HUD Accents */}
          <div className="absolute top-10 right-10 hidden lg:flex flex-col gap-2 opacity-20">
            <div className="w-24 h-1 bg-cyan-glow/50"></div>
            <div className="w-16 h-1 bg-cyan-glow/50 ml-auto"></div>
            <div className="w-8 h-1 bg-cyan-glow/50 ml-auto"></div>
          </div>

          {/* Content */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            variants={containerVariants}
            viewport={{ once: true }}
            className="z-10 max-w-2xl"
          >
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-glow/10 border border-cyan-glow/20 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-glow animate-pulse"></span>
              <span className="font-inter text-[10px] font-bold text-cyan-glow uppercase tracking-[0.2em]">v1.0.42 Live Signal</span>
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="text-5xl md:text-7xl font-black text-text-primary mb-6 leading-[1.1] tracking-tighter"
            >
              Khám Phá Bản Đồ <br/> <span className="text-cyan-glow">Xã Hội</span> Thế Hệ Mới
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-lg md:text-xl text-text-secondary mb-10 leading-relaxed max-w-xl"
            >
              Kết nối và khám phá thế giới qua lăng kính kỹ thuật số hiện đại. Trải nghiệm giao diện HUD tối tân ngay trên thiết bị của bạn.
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button 
                onClick={() => navigate('/map')}
                className="btn-primary py-4 px-10 text-base flex items-center justify-center gap-3"
              >
                Bắt đầu ngay
                <ArrowUpRight className="w-5 h-5" />
              </button>
              <button className="glass-card py-4 px-10 text-base font-bold text-text-secondary hover:bg-white transition-all border border-glass-border">
                Tìm hiểu thêm
              </button>
            </motion.div>
          </motion.div>

          {/* Floating Coordinate Pill */}
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 glass-panel shadow-neon rounded-full px-6 py-3 flex items-center gap-6 border border-cyan-glow/20"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-glow" />
              <span className="font-inter text-xs font-bold text-cyan-glow tracking-wider">10.7626° N, 106.6602° E</span>
            </div>
            <div className="h-4 w-px bg-glass-border"></div>
            <span className="font-inter text-[10px] font-bold text-text-muted uppercase tracking-widest">ALT: 12.4m</span>
          </motion.div>
        </section>

        {/* Stats Bar */}
        <section className="bg-obsidian py-8 border-y border-glass-border overflow-x-auto whitespace-nowrap scrollbar-hide">
          <div className="flex justify-around items-center min-w-[600px] max-w-7xl mx-auto px-6">
            {[
              { val: "10K+", label: "Địa điểm" },
              { val: "5K+", label: "Người dùng" },
              { val: "1M+", label: "Tương tác" }
            ].map((stat, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-black text-cyan-glow tracking-tighter">{stat.val}</span>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</span>
                </div>
                {i < 2 && <div className="w-px h-10 bg-glass-border"></div>}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-6 md:px-10 bg-map-bg">
          <div className="max-w-7xl mx-auto text-center mb-16">
            <span className="text-cyan-glow text-xs font-bold uppercase tracking-[0.3em]">Hệ Thống Phân Tích</span>
            <h2 className="text-4xl font-black text-text-primary mt-2 tracking-tighter">Tính Năng Kỹ Thuật</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card p-8 group relative overflow-hidden ${f.border || 'border border-glass-border'} ${f.highlight ? 'shadow-neon border-cyan-glow/30' : 'hover:border-cyan-glow/50'}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-black text-text-primary mb-3 tracking-tight uppercase">{f.title}</h3>
                <p className="text-text-secondary leading-relaxed text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Process Section */}
        <section className="py-24 px-6 md:px-10 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <h2 className="text-4xl font-black text-text-primary tracking-tighter uppercase">Quy Trình Khởi Chạy</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-12">
                {[
                  { title: "Thiết lập Profile", desc: "Khởi tạo danh tính số và mã hóa dữ liệu cá nhân trên nền tảng Geospatial Protocol." },
                  { title: "Quét vùng tín hiệu", desc: "Kích hoạt cảm biến để nhận dạng các điểm mốc và mạng lưới xung quanh vị trí của bạn." },
                  { title: "Trải nghiệm HUD", desc: "Đắm chìm vào giao diện Heads-Up Display với đầy đủ thông tin kỹ thuật số hiển thị trực quan." }
                ].map((step, i) => (
                  <motion.div 
                    key={i}
                    initial={{ x: -30, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.2 }}
                    className="flex gap-6 relative"
                  >
                    {i < 2 && <div className="absolute left-6 top-14 bottom-[-48px] w-px bg-glass-border"></div>}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-cyan-glow text-white flex items-center justify-center font-black z-10 shadow-neon">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-text-primary mb-2 tracking-tight">{step.title}</h4>
                      <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="relative group">
                <div className="absolute -inset-4 bg-cyan-glow/10 blur-[80px] rounded-full transition-opacity group-hover:opacity-100 opacity-50"></div>
                <div className="relative glass-panel p-2 rounded-3xl border border-glass-border shadow-floating overflow-hidden">
                  <img 
                    src="https://lh3.googleusercontent.com/aida/ADBb0ujdZXFJL2KbUgzWuKBe8mJw3ouSpTjnsCO11LaEMrMsM56Jl5t7XoRxDtYLFCeRlE7TwRl4KBw-gFtXTLbVwbbxNwQQRmmfF0LU8T8t7c5VJDLtAezkYkMfYj8wFFQVwQEUZsyJyCnq1ueVR0JsM1syIGi3UWQ53vq5v1YrZXVNPrfQySTvUPjU7ihrY3bHr2gz-zchIqYKrWYN_L2ZlZ1NFhHNaTZpMzAVMUmKcIh0I7IgjugEcWVT9nt54t7wSXxAebmCA1T3aw" 
                    alt="HUD Interface Preview"
                    className="rounded-2xl w-full h-auto object-cover aspect-[1.78]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 md:px-10 bg-cyan-glow text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             {/* Grid overlay could go here */}
          </div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter uppercase">Sẵn sàng nâng tầm trải nghiệm?</h2>
            <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto font-medium">
              Gia nhập mạng lưới Geo-Social lớn nhất và bắt đầu hành trình khám phá thế giới của bạn ngay hôm nay.
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="bg-white text-cyan-glow font-black px-12 py-5 rounded-2xl hover:scale-105 transition-transform shadow-xl text-lg uppercase tracking-widest"
            >
              Tải Ứng Dụng Ngay
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-obsidian border-t border-glass-border py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10 px-6 md:px-10">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="text-xs font-black text-slate uppercase tracking-widest">Aether Geo-Social</span>
            <span className="text-[10px] font-bold text-text-muted">© 2024 Aether Geo-Social. Geospatial Protocol v1.0.42-STABLE.</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8">
            {["Network Status", "Encryption API", "Privacy Policy", "Satellite Intel"].map((link) => (
              <a key={link} href="#" className="text-[10px] font-bold text-text-muted hover:text-cyan-glow transition-colors uppercase tracking-[0.2em]">{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
