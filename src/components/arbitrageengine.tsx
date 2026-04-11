import React, { useState, useEffect } from 'react';
import { FileText, ScanEye, Check, Handshake, AlertTriangle, CircleDollarSign, ChevronRight, PhoneCall, ArrowLeft, X, Crown, UserCheck, CheckCircle, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  // Main App State
  const [flowState, setFlowState] = useState('idle'); // 'idle' -> 'animating' -> 'revealed' -> 'modal_open'
  const [hasCompletedFunnel, setHasCompletedFunnel] = useState(false);
  
  // Exit-Intent State
  const [isExitIntent, setIsExitIntent] = useState(false);
  
  // Breadcrumb Funnel State
  const [funnelStep, setFunnelStep] = useState('scope');
  const [stepHistory, setStepHistory] = useState([]);
  const [formData, setFormData] = useState({
    scope: '',
    installerPreference: '',
    hasEstimate: '',
    numEstimates: '',
    dealBreaker: '',
    zip: '',
    phone: '',
    name: '',
    email: '',
    callIntent: '',
    timeframe: '',
    hasConsent: false
  });

  // --- Real-time Email Validation ---
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  // Trigger modal after animation reveal
  useEffect(() => {
    if (flowState === 'revealed' && !hasCompletedFunnel) {
      const timer = setTimeout(() => {
        setFlowState('modal_open');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [flowState, hasCompletedFunnel]);

  const handleStartSequence = () => {
    if (flowState === 'idle') {
      setFlowState('animating');
    }
  };

  // Funnel Navigation Helper
  const advance = (nextStep, field = null, value = null) => {
    if (field) {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    setStepHistory(prev => [...prev, funnelStep]);
    setFunnelStep(nextStep);
  };

  const handleBack = () => {
    if (stepHistory.length === 0) return;
    const prevStep = stepHistory[stepHistory.length - 1];
    setFunnelStep(prevStep);
    setStepHistory(prev => prev.slice(0, -1));
  };

  // Intercepted Close Handler
  const handleClose = () => {
    // Context-Aware Exit Intent: Don't intercept if already on the secret steps, 
    // OR if the user has already provided a valid email (preventing redundancy),
    // OR if they've completed the funnel normally.
    if (!hasCompletedFunnel && !isExitIntent && funnelStep !== 'done' && !['secret_capture', 'secret_success'].includes(funnelStep) && !isEmailValid) {
      setIsExitIntent(true);
      return;
    }

    // Normal close logic
    setHasCompletedFunnel(true);
    setFlowState('revealed');
    
    // Delay state reset slightly to prevent content flashing while closing
    setTimeout(() => {
      setFunnelStep('scope');
      setStepHistory([]);
      setIsExitIntent(false);
    }, 300);
  };

  // State Reset for Demo Purposes
  const handleResetDemo = () => {
    setFlowState('idle');
    setHasCompletedFunnel(false);
    setIsExitIntent(false);
    setFunnelStep('scope');
    setStepHistory([]);
    setFormData({
      scope: '', installerPreference: '', hasEstimate: '', numEstimates: '',
      dealBreaker: '', zip: '', phone: '', name: '', email: '',
      callIntent: '', timeframe: '', hasConsent: false
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Progress Bar Logic
  const getProgress = () => {
    switch(funnelStep) {
      case 'scope': return 12;
      case 'intent_filter': return 25;
      case 'status': return 37;
      case 'comp_a': return 50;
      case 'comp_b': return 62;
      case 'contact': return 75;
      case 'identity': return 88;
      case 'secret_capture': return 95;
      case 'intent': case 'call': case 'timeframe': case 'done': case 'secret_success': return 100;
      default: return 0;
    }
  };

  // --- Data Sanitization & Formatting ---

  // Display-only phone formatter: (555) 555-5555
  const formatPhoneDisplay = (val) => {
    if (!val) return '';
    const cleaned = ('' + val).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      return !match[2] ? match[1] : `(${match[1]}) ${match[2]}` + (match[3] ? `-${match[3]}` : '');
    }
    return val;
  };

  // Handler to enforce clean numerical state for Webhooks
  const handlePhoneChange = (e) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: cleaned });
  };

  // Handler for strict 5-digit zip
  const handleZipChange = (e) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 5);
    setFormData({ ...formData, zip: cleaned });
  };

  // Framer Motion Sliding Variants
  const slideVariants = {
    initial: { x: 50, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { x: -50, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }
  };

  // Option Card Component for reusability
  const OptionCard = ({ text, onClick }) => (
    <button 
      type="button"
      onClick={onClick}
      className="w-full bg-[#1e273a]/60 border border-white/10 hover:border-cyan-400/80 hover:bg-cyan-900/20 backdrop-blur-md py-4 px-6 rounded-xl shadow-lg transition-all text-gray-200 hover:text-cyan-50 font-semibold text-lg flex items-center justify-between group active:scale-[0.98] shrink-0"
    >
      <span>{text}</span>
      <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
    </button>
  );

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans overflow-hidden relative flex flex-col items-center justify-center p-4 selection:bg-cyan-500/30">
      
      {/* --- Custom Scrollbar Styles for the Modal --- */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.4);
        }
      `}</style>

      {/* --- Background Effects --- */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)',
        }}
      />
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* --- Main Dashboard Content --- */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center">
        
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-10 drop-shadow-lg text-center">
          The Arbitrage Engine
        </h1>

        <div className="w-full bg-[#12192b]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl pointer-events-none" />

          <div className="text-center mb-12">
            <h2 className="text-[#8ba3c7] text-xl font-semibold tracking-widest uppercase mb-1 drop-shadow-sm">
              Transparency Flow:
            </h2>
            <p className="text-gray-400 text-sm font-medium">How It Works</p>
          </div>

          <div className="w-full overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar">
            <div className="relative w-[800px] mx-auto pt-2">
              
              <div className="absolute top-[64px] left-[64px] right-[64px] h-[3px] z-0 flex rounded-full overflow-hidden">
                <div className="w-[33.33%] bg-gradient-to-r from-amber-400 to-yellow-400" />
                <div className="w-[66.66%] flex relative">
                  <div className="absolute inset-0 flex opacity-20">
                    <div className="w-1/2 bg-gradient-to-r from-yellow-400 to-red-500" />
                    <div className="w-1/2 bg-gradient-to-r from-red-500 to-emerald-500" />
                  </div>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: flowState === 'revealed' || flowState === 'modal_open' ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex"
                  >
                    <div className="w-1/2 bg-gradient-to-r from-yellow-400 to-red-500 shadow-[0_0_8px_red]" />
                    <div className="w-1/2 bg-gradient-to-r from-red-500 to-emerald-500 shadow-[0_0_8px_#10b981]" />
                  </motion.div>
                </div>
              </div>

              {flowState === 'animating' && (
                <svg className="absolute top-0 left-0 w-[800px] h-[128px] pointer-events-none z-30 overflow-visible">
                  <motion.path
                    d="M 352 64 L 448 64 L 448 12 A 12 12 0 0 1 460 0 L 564 0 A 12 12 0 0 1 576 12 L 576 116 A 12 12 0 0 1 564 128 L 460 128 A 12 12 0 0 1 448 116 L 448 64 L 576 64 L 672 64"
                    fill="transparent"
                    stroke="#06b6d4" 
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2.5, ease: "easeInOut" }}
                    onAnimationComplete={() => setFlowState('revealed')}
                    style={{ filter: 'drop-shadow(0 0 8px #06b6d4)' }}
                  />
                </svg>
              )}

              <div className="relative z-10 flex justify-between items-start w-[800px]">
                {/* Step 1 */}
                <div className="flex flex-col items-center w-32">
                  <div className="w-32 h-32 rounded-xl border-2 border-amber-400 bg-[#1e273a] shadow-[0_0_20px_rgba(251,191,36,0.15)_inset,0_0_20px_rgba(251,191,36,0.2)] flex flex-col items-center justify-center p-4">
                    <FileText className="w-10 h-10 text-amber-400 mb-3" strokeWidth={1.5} />
                    <span className="text-[13px] font-medium leading-tight text-gray-200 text-center">Quote<br/>Uploaded</span>
                  </div>
                  <div className="w-full mt-4 flex flex-col gap-1.5 px-1">
                    <div className="flex justify-end w-full"><span className="text-[11px] font-bold text-amber-400">92%</span></div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 w-[92%] rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center w-32">
                  <div className="w-32 h-32 rounded-xl border-2 border-yellow-400 bg-[#1e273a] shadow-[0_0_20px_rgba(250,204,21,0.15)_inset,0_0_20px_rgba(250,204,21,0.2)] flex flex-col items-center justify-center p-4">
                    <ScanEye className="w-10 h-10 text-yellow-400 mb-3" strokeWidth={1.5} />
                    <span className="text-[13px] font-medium leading-tight text-gray-200 text-center">AI Risk<br/>Audit</span>
                  </div>
                  <div className="w-full mt-4 flex flex-col gap-1.5 px-1">
                    <div className="flex justify-end w-full"><span className="text-[11px] font-bold text-yellow-400">92%</span></div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 w-[92%] rounded-full shadow-[0_0_8px_rgba(250,204,21,0.8)]"></div>
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-0.5 text-[9px] font-semibold text-red-500/90 whitespace-nowrap uppercase tracking-wider">
                      <AlertTriangle size={10} strokeWidth={2.5} />
                      <span>Missing NOA</span>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center w-32">
                  <div className={`w-32 h-32 rounded-xl border-2 flex flex-col items-center justify-center p-4 transition-all duration-500 z-20 relative bg-[#1e273a]
                    ${(flowState === 'idle' || flowState === 'animating')
                      ? 'border-red-900/40 shadow-none'
                      : 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.15)_inset,0_0_20px_rgba(239,68,68,0.2)]'
                    }`}
                  >
                    <motion.div 
                      className="flex flex-col items-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ 
                        opacity: (flowState === 'revealed' || flowState === 'modal_open') ? 1 : 0, 
                        y: (flowState === 'revealed' || flowState === 'modal_open') ? 0 : 10 
                      }}
                    >
                      <Check className="w-12 h-12 text-red-500 mb-2" strokeWidth={2} />
                      <span className="text-[13px] font-medium leading-tight text-gray-200 text-center">Fair Deal<br/>Found</span>
                    </motion.div>
                  </div>
                  <motion.div 
                    className="w-full mt-4 flex flex-col gap-1.5 px-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: (flowState === 'revealed' || flowState === 'modal_open') ? 1 : 0 }}
                  >
                    <div className="flex justify-end w-full"><span className="text-[11px] font-bold text-emerald-400">78%</span></div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 w-[78%] rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                    </div>
                  </motion.div>
                </div>

                {/* Step 4 */}
                <div className="flex flex-col items-center w-32">
                  <div className={`w-32 h-32 rounded-xl border-2 flex flex-col items-center justify-center p-3 transition-all duration-700 bg-[#1e273a] z-20 relative
                    ${(flowState === 'idle' || flowState === 'animating')
                      ? 'border-emerald-900/40 shadow-none'
                      : 'border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.4)_inset,0_0_35px_rgba(52,211,153,0.6)]'
                    }`}
                  >
                    <motion.div 
                      className="flex flex-col items-center"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ 
                        opacity: (flowState === 'revealed' || flowState === 'modal_open') ? 1 : 0, 
                        y: (flowState === 'revealed' || flowState === 'modal_open') ? 0 : 15 
                      }}
                      transition={{ delay: 0.1, duration: 0.5 }}
                    >
                      <div className="relative mb-2 mt-1">
                        <Handshake className="w-11 h-11 text-emerald-400" strokeWidth={1.5} />
                        <div className="absolute -top-3 -right-2 bg-[#1e273a] rounded-full p-[1px]">
                           <CircleDollarSign className="w-5 h-5 text-emerald-400" fill="#1e273a" strokeWidth={2} />
                        </div>
                      </div>
                      <span className="text-[12px] font-medium leading-snug text-gray-200 text-center">Referral Fee Paid<br/>by Contractor</span>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Consolidated CTA Button and Static Market Maker Content */}
        <div id="audit-results" className="mt-16 text-center max-w-3xl px-4 flex flex-col items-center relative z-20 pb-16">
          <button
            onClick={handleStartSequence}
            disabled={flowState !== 'idle'}
            className={`mb-10 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform active:scale-95
              ${flowState === 'idle'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] cursor-pointer hover:-translate-y-1'
                : 'bg-gray-800 border border-gray-700 text-gray-500 cursor-not-allowed opacity-50 shadow-none'
              }`}
          >
            {flowState === 'animating' ? 'Analyzing Flow...' : flowState === 'idle' ? 'Click For a Better Estimate' : 'Estimate Unlocked'}
          </button>

          <h2 className="text-2xl md:text-[28px] font-semibold text-white mb-4 tracking-wide drop-shadow-md">
            The Market Maker Model
          </h2>
          <p className="text-[#a0abc0] text-lg leading-relaxed font-light">
            The first contractor paid for the discovery, measurements, and price anchoring. WindowMan captures the deal downstream. Our partners walk into the home knowing exactly what to beat.
          </p>

          {/* Reset Demo Button */}
          <button
            onClick={handleResetDemo}
            className="mt-12 text-gray-500 hover:text-cyan-400 text-xs tracking-wider font-semibold px-4 py-2 rounded-full border border-white/5 hover:border-cyan-500/30 bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-all"
          >
            Reset Funnel
          </button>
        </div>
      </div>

      {/* --- Breadcrumb Lead Funnel Modal --- */}
      {flowState === 'modal_open' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-[#12192b]/95 border border-white/10 rounded-2xl max-w-md w-full shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden flex flex-col min-h-[420px] max-h-[85vh]"
          >
            {/* Modal Navigation & Exit Controls */}
            {!isExitIntent && stepHistory.length > 0 && !['done', 'secret_capture', 'secret_success'].includes(funnelStep) && (
              <button 
                onClick={handleBack}
                className="absolute top-4 left-4 z-50 p-1.5 text-gray-400 hover:text-white hover:scale-110 transition-all cursor-pointer bg-black/20 hover:bg-black/40 rounded-full"
              >
                <ArrowLeft className="w-5 h-5 drop-shadow-md" />
              </button>
            )}
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 z-50 p-1.5 text-gray-400 hover:text-white hover:scale-110 transition-all cursor-pointer bg-black/20 hover:bg-black/40 rounded-full"
            >
              <X className="w-5 h-5 drop-shadow-md" />
            </button>

            {/* Glowing Neon Progress Bar */}
            {!isExitIntent && !['secret_capture', 'secret_success'].includes(funnelStep) && (
              <div className="w-full h-1.5 bg-gray-800 absolute top-0 left-0 right-0 z-10 shrink-0">
                <div 
                  className="h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] transition-all duration-500 ease-out"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
            )}

            {/* Dynamic Funnel Content Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden mt-1.5">
              <AnimatePresence mode="wait">

                {/* EXIT INTENT: Curiosity Gap */}
                {isExitIntent && (
                  <motion.div key="exit_intent" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full w-full absolute inset-0 p-8 overflow-y-auto custom-scrollbar justify-center">
                    <h2 className="text-3xl font-extrabold mb-4 text-center text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.3)] shrink-0">
                      Before you go...
                    </h2>
                    <p className="text-xl text-white font-medium text-center mb-8 leading-relaxed shrink-0 px-2">
                      Can I let you in on a little <span className="text-amber-300 italic">secret</span> on how we get you the absolute lowest priced install?
                    </p>
                    <div className="flex flex-col gap-4 pb-4">
                      <button
                        onClick={() => {
                          setIsExitIntent(false);
                          // Skip redundant capture if email is already valid
                          if (isEmailValid) {
                            advance('secret_success');
                          } else {
                            advance('secret_capture');
                          }
                        }}
                        className="w-full bg-[#1e273a]/60 border border-amber-500/50 hover:border-amber-400/80 hover:bg-amber-900/20 backdrop-blur-md p-5 rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.15)] transition-all text-left flex items-center gap-4 group active:scale-[0.98] shrink-0"
                      >
                         <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:bg-amber-500/30 transition-all">
                            <Key className="w-6 h-6 text-amber-400" />
                         </div>
                         <span className="text-amber-100 group-hover:text-amber-50 font-bold text-lg flex-1">Yes, tell me the secret.</span>
                         <ChevronRight className="w-5 h-5 text-amber-500/50 group-hover:text-amber-400 transition-colors shrink-0 ml-1" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setFlowState('revealed');
                          setHasCompletedFunnel(true);
                          setTimeout(() => {
                            setFunnelStep('scope');
                            setStepHistory([]);
                            setIsExitIntent(false);
                          }, 300);
                        }}
                        className="w-full bg-transparent border border-white/5 hover:bg-white/5 backdrop-blur-md p-4 rounded-xl transition-all text-center group active:scale-[0.98] shrink-0"
                      >
                         <span className="text-gray-500 group-hover:text-gray-400 font-medium text-sm">No thanks, I'll pay retail.</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* SECRET EMAIL CAPTURE */}
                {!isExitIntent && funnelStep === 'secret_capture' && (
                  <motion.div key="secret_capture" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full w-full absolute inset-0 p-8 overflow-y-auto custom-scrollbar justify-center">
                    <h2 className="text-[28px] font-extrabold mb-4 text-center bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(251,191,36,0.3)] shrink-0 leading-tight">
                      The 'Market for Lemons' Tactic
                    </h2>
                    <p className="text-gray-300 text-[15px] leading-relaxed mb-6 text-center shrink-0">
                      Enter your best email below and I'll share our tactic to force contractors to start with their absolute best offers. It’s based on the 'George Akerlof Law of Lemons' economic theory, and we're the <strong className="text-white">only</strong> company in the home improvement space doing it.
                    </p>
                    <form 
                      onSubmit={(e) => { 
                        e.preventDefault(); 
                        advance('secret_success');
                      }} 
                      className="flex flex-col gap-4 w-full"
                    >
                      <div className="flex flex-col gap-1">
                        <input 
                          required type="email" placeholder="Where should we send our secret strategy?" 
                          value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                          className={`w-full bg-[#070b14]/70 border rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-1 placeholder:text-gray-500 transition-all ${formData.email && !isEmailValid ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:border-amber-500/50 focus:ring-amber-500/50'}`} 
                        />
                        {formData.email && !isEmailValid && (
                          <span className="text-red-400 text-xs ml-1 font-medium">Please enter a valid email address.</span>
                        )}
                      </div>
                      <button 
                        type="submit" 
                        disabled={!isEmailValid}
                        className="w-full mt-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-95 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Send Me Our Strategy
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* SECRET SUCCESS (Payoff Preview) */}
                {!isExitIntent && funnelStep === 'secret_success' && (
                  <motion.div key="secret_success" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center h-full w-full absolute inset-0 p-8 text-center overflow-y-auto custom-scrollbar">
                    <div className="w-20 h-20 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center mb-6 shrink-0 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                      <CheckCircle className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                    </div>
                    
                    <h2 className="text-[26px] font-extrabold mb-4 shrink-0 drop-shadow-sm leading-tight">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">The Law of </span>🍋<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">s En Route!</span>
                    </h2>
                    
                    <p className="text-gray-300 text-[15px] leading-relaxed mb-8 shrink-0 px-2">
                      It's a clever tactic—why risk missing out on the full results? Click below for a quick peek at your audit findings and be sure to bookmark this page for later.
                    </p>
                    
                    <button
                      onClick={() => {
                        setHasCompletedFunnel(true);
                        setFlowState('revealed');
                        setTimeout(() => {
                          document.getElementById('audit-results')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          setFunnelStep('scope');
                          setStepHistory([]);
                        }, 300);
                      }}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all active:scale-95 shrink-0"
                    >
                      ✨ Click for a Quick Peek
                    </button>
                    
                    <p className="text-gray-500 text-[11px] mt-6 shrink-0">
                      Pro-Tip: Press <kbd className="font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10 mx-0.5 text-gray-400">CMD+D</kbd> (or <kbd className="font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10 mx-0.5 text-gray-400">Ctrl+D</kbd>) now to bookmark this audit.
                    </p>
                  </motion.div>
                )}
                
                {/* Step 1: Project Scope */}
                {!isExitIntent && funnelStep === 'scope' && (
                  <motion.div key="scope" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full w-full absolute inset-0 p-8 overflow-y-auto custom-scrollbar">
                    <h2 className="text-2xl font-bold mb-6 text-center text-white shrink-0">How many windows or doors are we auditing?</h2>
                    <div className="flex flex-col gap-3 pb-4">
                      {['1-5', '6-10', '11-15', '15+'].map(opt => (
                        <OptionCard key={opt} text={opt} onClick={() => advance('intent_filter', 'scope', opt)} />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Intent Filter */}
                {!isExitIntent && funnelStep === 'intent_filter' && (
                  <motion.div key="intent_filter" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full w-full absolute inset-0 p-8 overflow-y-auto custom-scrollbar">
                    <h2 className="text-2xl font-bold mb-6 text-center text-white shrink-0">To help us provide a better match, what is your primary goal?</h2>
                    <div className="flex flex-col gap-4 pb-4">
                      
                      {/* Premium Option */}
                      <button 
                        type="button"
                        onClick={() => advance('status', 'installerPreference', 'premium')}
                        className="w-full bg-[#1e273a]/60 border border-white/10 hover:border-cyan-400/80 hover:bg-cyan-900/20 backdrop-blur-md p-5 rounded-xl shadow-lg transition-all text-left flex items-center gap-4 group active:scale-[0.98] shrink-0"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#070b14]/50 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
                          <Crown className="w-6 h-6 text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-gray-200 group-hover:text-cyan-50 font-bold text-[17px] leading-tight">
                            I want a premium, high-end installer
                          </div>
                          <div className="text-sm text-gray-400 group-hover:text-cyan-100/70 mt-1 leading-snug">
                            I prioritize brand reputation and white-glove service.
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors shrink-0 ml-1" />
                      </button>

                      {/* Quality Pro Option */}
                      <button 
                        type="button"
                        onClick={() => advance('status', 'installerPreference', 'value')}
                        className="w-full bg-[#1e273a]/60 border border-white/10 hover:border-cyan-400/80 hover:bg-cyan-900/20 backdrop-blur-md p-5 rounded-xl shadow-lg transition-all text-left flex items-center gap-4 group active:scale-[0.98] shrink-0"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#070b14]/50 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
                          <UserCheck className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-gray-200 group-hover:text-cyan-50 font-bold text-[17px] leading-tight">
                            I want a quality, honest local pro
                          </div>
                          <div className="text-sm text-gray-400 group-hover:text-cyan-100/70 mt-1 leading-snug">
                            I prioritize reliability and getting the best fair price.
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors shrink-0 ml-1" />
                      </button>

                    </div>
                  </motion.div>
                )}

                {/* Step 3: Current Status */}
                {!isExitIntent && funnelStep === 'status' && (
                  <motion.div key="status" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full w-full absolute inset-0 p-8 overflow-y-auto custom-scrollbar">
                    <h2 className="text-2xl font-bold mb-6 text-center text-white shrink-0">Have you received a professional estimate yet?</h2>
                    <div className="flex flex-col gap-3 mt-4 pb-4">
                      <OptionCard text="Yes, I have an estimate" onClick={() => advance('comp_a', 'hasEstimate', 'Yes')} />
                      <OptionCard text="No, I'm just starting" onClick={() => advance('contact', 'hasEstimate', 'No')} />
                    </div>
                  </motion.div>
                )}

                {/* Step 3A: Comp Analysis - How Many */}
                {!isExitIntent && funnelStep === 'comp_a' && (
                  <motion.div key="comp_a" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full w-full absolute inset-0 p-8 overflow-y-auto custom-scrollbar">
                    <h2 className="text-2xl font-bold mb-6 text-center text-white shrink-0">How many estimates have you seen?</h2>
                    <div className="flex flex-col gap-3 mt-4 pb-4">
                      <OptionCard text="Just 1" onClick={() => advance('comp_b', 'numEstimates', '1')} />
                      <OptionCard text="2 or more" onClick={() => advance('comp_b', 'numEstimates', '2+')} />
                    </div>
                  </motion.div>
                )}

                {/* Step 3B: Comp Analysis - Deal-breaker */}
                {!isExitIntent && funnelStep === 'comp_b' && (
                  <motion.div key="comp_b" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full w-full absolute inset-0 p-8 overflow-y-auto custom-scrollbar">
                    <h2 className="text-2xl font-bold mb-6 text-center text-white shrink-0">What was the biggest deal-breaker?</h2>
                    <div className="flex flex-col gap-2.5 pb-4">
                      {['Price', 'Company Reputation', 'Timing', 'Financing', 'Other'].map(opt => (
                        <OptionCard key={opt} text={opt} onClick={() => advance('contact', 'dealBreaker', opt)} />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 4: The Contact Gate */}
                {!isExitIntent && funnelStep === 'contact' && (
                  <motion.div key="contact" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full w-full absolute inset-0 p-8 overflow-y-auto custom-scrollbar">
                    <h2 className="text-2xl font-bold mb-2 text-center text-white shrink-0">Almost there!</h2>
                    <p className="text-cyan-400 text-sm font-semibold text-center mb-6 shrink-0">We found 3 potential savings in your area.</p>
                    <form 
                      onSubmit={(e) => { e.preventDefault(); advance('identity'); }} 
                      className="flex flex-col gap-4 pb-4"
                    >
                      <input 
                        required 
                        type="text" 
                        inputMode="numeric"
                        maxLength={5}
                        placeholder="Zip Code" 
                        value={formData.zip} 
                        onChange={handleZipChange}
                        className="w-full bg-[#070b14]/70 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50" 
                      />
                      <input 
                        required 
                        type="tel" 
                        maxLength={14} 
                        placeholder="(555) 555-5555" 
                        value={formatPhoneDisplay(formData.phone)} 
                        onChange={handlePhoneChange}
                        className="w-full bg-[#070b14]/70 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50" 
                      />
                      
                      <div className="flex items-start gap-3 mt-1 px-1">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={formData.hasConsent}
                          onClick={() => setFormData({...formData, hasConsent: !formData.hasConsent})}
                          className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${formData.hasConsent ? 'bg-cyan-500 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-[#070b14]/70 border-white/20'}`}
                        >
                          {formData.hasConsent && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </button>
                        <label 
                          onClick={() => setFormData({...formData, hasConsent: !formData.hasConsent})}
                          className="text-xs text-gray-400 leading-tight cursor-pointer select-none"
                        >
                          I agree to receive automated texts/calls for my quote audit. Consent is not a condition of purchase.
                        </label>
                      </div>

                      <button 
                        type="submit" 
                        disabled={!formData.hasConsent || formData.zip.length < 5 || formData.phone.length < 10}
                        className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all active:scale-95 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-cyan-500 disabled:hover:to-blue-600 disabled:hover:shadow-none disabled:active:scale-100"
                      >
                        Next: See My Report
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* Step 5: Final Identity Capture */}
                {!isExitIntent && funnelStep === 'identity' && (
                  <motion.div key="identity" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full w-full absolute inset-0 p-8 overflow-y-auto custom-scrollbar">
                    <h2 className="text-3xl font-extrabold mb-8 text-center bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent drop-shadow-sm shrink-0">
                      You Got it
                    </h2>
                    <form 
                      onSubmit={(e) => { e.preventDefault(); advance('intent'); }} 
                      className="flex flex-col gap-4 pb-4"
                    >
                      <input 
                        required type="text" placeholder="What's your name?" 
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-[#070b14]/70 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 placeholder:text-gray-500" 
                      />
                      <div className="flex flex-col gap-1">
                        <input 
                          required type="email" placeholder="What's your best email?" 
                          value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                          className={`w-full bg-[#070b14]/70 border rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-1 placeholder:text-gray-500 transition-all ${formData.email && !isEmailValid ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/50'}`} 
                        />
                        {formData.email && !isEmailValid && (
                          <span className="text-red-400 text-xs ml-1 font-medium">Please enter a valid email address.</span>
                        )}
                      </div>
                      <button 
                        type="submit" 
                        disabled={!formData.name || !isEmailValid}
                        className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all active:scale-95 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next Step
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* Step 6: The Hand-off (Call Intent) */}
                {!isExitIntent && funnelStep === 'intent' && (
                  <motion.div key="intent" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full w-full absolute inset-0 p-8 overflow-y-auto custom-scrollbar">
                    <h2 className="text-2xl font-bold mb-6 text-center text-white leading-snug shrink-0">Would you like a quick phone call to review these results with a specialist?</h2>
                    <div className="flex flex-col gap-3 mt-2 pb-4">
                      <OptionCard text="Yes, I want expert advice" onClick={() => advance('call', 'callIntent', 'Yes')} />
                      <OptionCard text="No, just email me for now" onClick={() => advance('timeframe', 'callIntent', 'No')} />
                    </div>
                  </motion.div>
                )}

                {/* Path A: Tap to Call */}
                {!isExitIntent && funnelStep === 'call' && (
                  <motion.div key="call" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center h-full w-full absolute inset-0 p-8 overflow-y-auto custom-scrollbar">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 shrink-0">
                      <PhoneCall className="w-10 h-10 text-emerald-400 animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-bold mb-8 text-center text-white shrink-0">Your specialist is ready!</h2>
                    <a 
                      href="tel:18005550199" 
                      onClick={() => { setHasCompletedFunnel(true); setTimeout(handleClose, 500); }}
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold text-2xl py-5 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shrink-0"
                    >
                      Tap to Call Now
                    </a>
                  </motion.div>
                )}

                {/* Path B: Timeframe */}
                {!isExitIntent && funnelStep === 'timeframe' && (
                  <motion.div key="timeframe" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full w-full absolute inset-0 p-8 overflow-y-auto custom-scrollbar">
                    <h2 className="text-2xl font-bold mb-6 text-center text-white shrink-0">What's your timeframe for this project?</h2>
                    <div className="flex flex-col gap-3 pb-4">
                      {['1 Month', '2-3 Months', 'Just Researching'].map(opt => (
                        <OptionCard 
                          key={opt} 
                          text={opt} 
                          onClick={() => {
                            advance('done', 'timeframe', opt);
                            setHasCompletedFunnel(true);
                            setTimeout(handleClose, 3500); // Extended slightly so they can read the final message
                          }} 
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Final Done State */}
                {!isExitIntent && funnelStep === 'done' && (
                  <motion.div key="done" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center h-full w-full absolute inset-0 p-8 text-center overflow-y-auto custom-scrollbar">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mb-6 shrink-0 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                      <CheckCircle className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    </div>
                    
                    <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-500 mb-4 shrink-0 drop-shadow-sm">
                      {formData.scope === '15+' 
                        ? 'Premium Project Detected!' 
                        : 'Audit Complete & Matched!'}
                    </h2>
                    
                    <p className="text-gray-300 text-base leading-relaxed shrink-0 px-2">
                      {formData.scope === '1-5' 
                        ? "Perfect for our Quick-Response Team. We've matched you with 2 local installers specializing in smaller projects for a fast turnaround." 
                        : formData.scope === '15+' 
                        ? "We’ve prioritized your full-home audit for our Premium Installation Team to ensure maximum pricing leverage and elite craftsmanship."
                        : "Project scope confirmed. We've routed your audit to our top-rated local installation partners for immediate review."}
                    </p>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}

      {/* Watermark */}
      <div className="absolute bottom-4 right-6 text-gray-500/50 text-xs font-semibold flex items-center gap-1 z-0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
        NotebookLM
      </div>

    </div>
  );
}
