import { motion } from 'framer-motion';
import { ArrowRight, Bot, Shield, UploadCloud, BrainCircuit, Activity, Sparkles, Hospital, CalendarDays, AlertTriangle, Pill, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import Hero3D from '../components/Hero3D';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } } };

export default function Landing() {
  return (
    <div className="w-full overflow-x-hidden bg-[#faf0e6]">
      {/* Ambient */}
      <div className="fixed top-[-15%] left-[-15%] w-[55vw] h-[55vw] bg-[#77DD77]/10 rounded-full blur-[180px] pointer-events-none z-0" />
      <div className="fixed bottom-[-15%] right-[-15%] w-[50vw] h-[50vw] bg-[#77DD77]/8 rounded-full blur-[180px] pointer-events-none z-0" />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-[#d0bfae]/30" style={{ background: 'rgba(250,240,230,0.8)', backdropFilter: 'blur(24px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#77DD77] to-[#4aad4a] flex items-center justify-center shadow-lg shadow-[#77DD77]/25">
              <Activity size={20} className="text-white" />
            </div>
            <span className="text-xl font-extrabold text-[#2f2a26]">MedTwin <span className="text-[#a89b8d] font-bold text-sm">AI</span></span>
          </Link>
          <Link to="/auth" className="bg-[#2f2a26] hover:bg-[#403933] text-white px-7 py-3 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95 flex items-center gap-2">
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section className="relative min-h-screen flex items-center pt-[72px] px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center w-full relative z-10 py-12">
          
          {/* Left */}
          <motion.div variants={container} initial="hidden" animate="show" className="order-2 md:order-1">
            <motion.div variants={item} className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/50 backdrop-blur-xl text-[#4aad4a] font-bold mb-10 text-sm shadow-sm border border-[#77DD77]/20">
              <Sparkles size={15} className="text-[#77DD77]" /> MedTwin AI 2.0
            </motion.div>

            <motion.h1 variants={item} className="text-[3.5rem] md:text-[4.5rem] lg:text-[5.5rem] font-black leading-[1.05] mb-8 text-[#2f2a26] tracking-[-0.03em]">
              Your Complete<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#77DD77] to-[#4aad4a]">Healthcare</span><br />
              Ecosystem.
            </motion.h1>

            <motion.p variants={item} className="text-xl text-[#a89b8d] mb-12 leading-relaxed max-w-lg font-medium">
              AI diagnostics, hospital discovery, smart appointments, symptom analysis — all in one beautiful platform.
            </motion.p>

            <motion.div variants={item} className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth" className="flex items-center justify-center gap-2 px-8 py-5 rounded-2xl font-bold text-lg text-[#2f2a26] bg-white/60 border border-[#d0bfae] hover:bg-white transition-all">
                Learn More
              </Link>
            </motion.div>
          </motion.div>

          {/* Right — 3D */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, ease: "easeOut" }}
            className="relative order-1 md:order-2 h-[350px] md:h-[550px] w-full">
            <div className="absolute inset-0 pointer-events-auto"><Hero3D /></div>
            
            {/* Floating Card */}
            <motion.div animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute bottom-8 right-4 md:right-12 bg-white/50 backdrop-blur-2xl p-5 rounded-2xl shadow-xl border border-white/60 z-30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#77DD77]/15 text-[#77DD77] flex items-center justify-center"><Shield size={22} /></div>
                <div>
                  <p className="text-[#2f2a26] font-bold text-base">Firebase Secured</p>
                  <p className="text-[#77DD77] text-sm font-semibold">Real-time Firestore</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section className="py-28 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-[#2f2a26] mb-5 tracking-tight">Everything You Need.</h2>
            <p className="text-[#a89b8d] max-w-xl mx-auto text-lg font-medium leading-relaxed">10 powerful features in one seamless healthcare platform.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: UploadCloud, title: "PDF Analysis", desc: "Upload medical reports for instant AI diagnostics." },
              { icon: BrainCircuit, title: "AI Symptom Check", desc: "Describe symptoms, get urgency levels and recommendations." },
              { icon: Hospital, title: "Hospital Finder", desc: "12+ verified hospitals with maps and ratings." },
              { icon: CalendarDays, title: "Smart Appointments", desc: "Auto-assigned to best available doctor." },
              { icon: Bot, title: "AI Chat", desc: "Voice-enabled medical assistant with memory." },
              { icon: Pill, title: "Rx Reminders", desc: "Prescription scheduler with notifications." },
              { icon: AlertTriangle, title: "Emergency SOS", desc: "One-tap nearest hospital finder." },
              { icon: Star, title: "Verified Reviews", desc: "Only completed-appointment patients review." },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
                className="bg-white/50 backdrop-blur-xl p-8 rounded-3xl border border-white/60 hover:border-[#77DD77]/30 group hover:-translate-y-2 transition-all duration-500 cursor-default">
                <div className="w-14 h-14 bg-[#faf0e6] flex items-center justify-center rounded-2xl mb-6 text-[#77DD77] group-hover:bg-[#77DD77] group-hover:text-white transition-all duration-400 shadow-sm border border-[#d0bfae]/30">
                  <f.icon size={26} strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-[#2f2a26] mb-2">{f.title}</h3>
                <p className="text-[#a89b8d] leading-relaxed text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ TERMINAL CTA ═══════ */}
      <section className="py-28 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            className="bg-[#1a1a1a] rounded-[2.5rem] shadow-2xl p-5 md:p-8 overflow-hidden">
            <div className="flex gap-2.5 mb-6 items-center">
              <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56]" />
              <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]" />
              <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f]" />
              <span className="ml-4 font-mono text-white/20 text-xs tracking-[0.2em]">MEDTWIN_OS_V2.0</span>
            </div>
            <div className="bg-[#111] rounded-[2rem] py-20 md:py-28 flex flex-col items-center text-center px-8 relative">
              <div className="absolute bottom-0 w-full h-[40%] bg-gradient-to-t from-[#77DD77]/15 to-transparent blur-[50px] pointer-events-none" />
              <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 6 }}
                className="w-24 h-24 mb-10 rounded-2xl bg-white/5 border border-[#77DD77]/20 flex items-center justify-center shadow-[0_0_60px_rgba(119,221,119,0.15)]">
                <BrainCircuit size={44} className="text-[#77DD77]" />
              </motion.div>
              <h2 className="text-4xl md:text-6xl text-white font-black tracking-tight mb-6 relative z-10">Ready to Begin?</h2>
              <p className="text-zinc-500 max-w-md relative z-10 mb-10 text-lg font-medium leading-relaxed">Access your complete healthcare dashboard — AI diagnostics, hospital finder, and more.</p>
              <Link to="/auth" className="relative z-10 bg-[#77DD77]/10 border-2 border-[#77DD77]/60 hover:bg-[#77DD77] text-white font-bold flex items-center gap-3 px-10 py-5 rounded-full transition-all duration-300 text-lg shadow-[0_0_40px_rgba(119,221,119,0.2)] hover:shadow-[0_0_60px_rgba(119,221,119,0.4)]">
                Launch Dashboard <Bot size={22} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-[#a89b8d] relative z-10 border-t border-[#d0bfae]/30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#77DD77]/15 flex items-center justify-center">
              <Activity className="text-[#77DD77]" size={18} />
            </div>
            <span className="font-bold text-xl text-[#2f2a26]">MedTwin AI</span>
          </div>
          <p className="text-sm font-semibold">© 2026 MedTwin AI Systems</p>
        </div>
      </footer>
    </div>
  );
}
