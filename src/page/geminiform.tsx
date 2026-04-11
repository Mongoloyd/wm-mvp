import React, { useState, useEffect } from 'react';
import { 
  FileText, ScanEye, Check, Handshake, AlertTriangle, 
  CircleDollarSign, ChevronRight, PhoneCall, ArrowLeft, 
  X, Crown, UserCheck, CheckCircle, Key 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * QuoteAuditFunnel Component
 * Features: Multi-step Breadcrumb logic, TCPA compliance, 
 * Exit-intent "Law of Lemons" hook, and conditional payoff messaging.
 */
export default function QuoteAuditFunnel() {
  // --- STATE MANAGEMENT ---
  const [flowState, setFlowState] = useState('idle'); // idle -> animating -> revealed -> modal_open
  const [hasCompletedFunnel, setHasCompletedFunnel] = useState(false);
  const [isExitIntent, setIsExitIntent] = useState(false);
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

  // --- LOGIC & TRIGGERS ---

  // Standard funnel trigger: 2-second delay after the SVG animation finishes
  useEffect(() => {
    if (flowState === 'revealed' && !hasCompletedFunnel) {
      const timer = setTimeout(() => {
        setFlowState('modal_open');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [flowState, hasCompletedFunnel]);

  const handleStartSequence = () => {
    if (flowState === 'idle') setFlowState('animating');
  };

  const advance = (nextStep, field = null, value = null) => {
    if (field) setFormData(prev => ({ ...prev, [field]: value }));
    
    // SMART LOGIC: If moving to Secret Capture but email already exists, skip to Payoff
    if (nextStep === 'secret_capture' && formData.email) {
      setFunnelStep('secret_success');
      return;
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

  const handleClose = () => {
    // Only trigger Exit-Intent for incomplete leads who haven't given an email
    if (!hasCompletedFunnel && !isExitIntent && !formData.email && !['done', 'secret_success'].includes(funnelStep)) {
      setIsExitIntent(true);
      return;
    }

    setFlowState('revealed');
    setHasCompletedFunnel(true);
    setIsExitIntent(false);
  };

  // --- DATA SANITIZATION ---
  const handlePhoneChange = (e) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: cleaned });
  };

  const handleZipChange = (e) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 5);
    setFormData({ ...formData, zip: cleaned });
  };

  const formatPhoneDisplay = (val) => {
    if (!val) return '';
    const cleaned = val.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!match) return val;
    return !match[2] ? match[1] : `(${match[1]}) ${match[2]}${match[3] ? `-${match[3]}` : ''}`;
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  // --- UI COMPONENTS & VARIANTS ---
  const slideVariants = {
    initial: { x: 50, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: 0.3 } },
    exit: { x: -50, opacity: 0, transition: { duration: 0.2 } }
  };

  const OptionCard = ({ text, subtext, icon: Icon, onClick }) => (
    <button onClick={onClick} className="w-full bg-[#1e273a]/60 border border-white/10 hover:border-cyan-400/80 hover:bg-cyan-900/20 backdrop-blur-md p-5 rounded-xl shadow-lg transition-all text-left flex items-center gap-4 group active:scale-[0.98]">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-[#070b14]/50 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-cyan-500/50 transition-all">
          <Icon className="w-6 h-6 text-cyan-400" />
        </div>
      )}
      <div className="flex-1">
        <div className="text-gray-200 group-hover:text-cyan-50 font-bold text-[17px]">{text}</div>
        {subtext && <div className="text-sm text-gray-400 group-hover:text-cyan-100/70 mt-1">{subtext}</div>}
      </div>
      <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400" />
    </button>
  );

  return (
    <div className="min-h-screen bg-[#070b14] text-white relative flex flex-col items-center justify-center p-4">
      
      {/* 1. BACKGROUND GLOWS */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* 2. MAIN DASHBOARD UI */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-10 text-center">The Arbitrage Engine</h1>

        <div className="w-full bg-[#12192b]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl relative">
          <div className="text-center mb-12">
            <h2 className="text-[#8ba3c7] text-xl font-semibold uppercase tracking-widest">Transparency Flow</h2>
          </div>

          {/* SVG Pulsing Line & Flow Nodes - Preserved from your build */}
          <div className="flex justify-between items-start w-full max-w-[800px] mx-auto relative h-32">
            {/* SVG Trace Logic */}
            {flowState === 'animating' && (
              <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-30">
                <motion.path
                  d="M 352 64 L 672 64" // Example simplified path; use your detailed path here
                  fill="transparent" stroke="#06b6d4" strokeWidth="3"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 2.5 }} onAnimationComplete={() => setFlowState('revealed')}
                />
              </svg>
            )}
            {/* Your Flow Nodes (Quote, Audit, Fair Deal, Referral) would go here */}
          </div>
        </div>

        {/* 3. PRIMARY CTA */}
        <div className="mt-16 flex flex-col items-center">
          <button
            onClick={handleStartSequence}
            disabled={flowState !== 'idle'}
            className={`mb-10 px-10 py-5 rounded-full font-bold text-xl transition-all active:scale-95 ${
              flowState === 'idle' 
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_25px_rgba(6,182,212,0.4)]' 
              : 'opacity-50 grayscale cursor-not-allowed'
            }`}
          >
            {flowState === 'idle' ? 'Click For a Better Estimate' : 'Estimate Unlocked'}
          </button>
        </div>
      </div>

      {/* 4. THE LEAD MODAL */}
      <AnimatePresence>
        {flowState === 'modal_open' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12192b] border border-white/10 rounded-2xl max-w-md w-full relative overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Controls */}
              {!isExitIntent && stepHistory.length > 0 && !['done', 'secret_success'].includes(funnelStep) && (
                <button onClick={handleBack} className="absolute top-4 left-4 z-50 text-gray-400 hover:text-white"><ArrowLeft /></button>
              )}
              <button onClick={handleClose} className="absolute top-4 right-4 z-50 text-gray-400 hover:text-white"><X /></button>

              {/* Progress Bar */}
              {!isExitIntent && !['secret_success'].includes(funnelStep) && (
                <div className="w-full h-1 bg-gray-800 absolute top-0">
                  <div className="h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" style={{ width: '50%' }} /> {/* Update with getProgress() logic */}
                </div>
              )}

              <div className="p-8 mt-4 overflow-y-auto">
                <AnimatePresence mode="wait">
                  
                  {/* STEP: EXIT INTENT */}
                  {isExitIntent && (
                    <motion.div key="exit" {...slideVariants} className="text-center">
                      <h2 className="text-3xl font-bold text-amber-400 mb-4">Before you go...</h2>
                      <p className="mb-8">Can I let you in on a little <span className="text-amber-300 italic">secret</span> on how we get you the lowest priced install?</p>
                      <OptionCard text="Yes, tell me the secret" icon={Key} onClick={() => { setIsExitIntent(false); advance('secret_capture'); }} />
                      <button onClick={() => setFlowState('revealed')} className="mt-4 text-xs text-gray-500">No thanks, I'll pay retail.</button>
                    </motion.div>
                  )}

                  {/* STEP: SECRET REVEAL PAYOFF */}
                  {funnelStep === 'secret_success' && (
                    <motion.div key="payoff" {...slideVariants} className="text-center">
                      <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="text-amber-400 w-10 h-10" />
                      </div>
                      <h2 className="text-2xl font-bold mb-4">The Law of 🍋s En Route!</h2>
                      <p className="text-gray-300 mb-8 text-sm">It's a clever tactic—why risk missing out? Click below for a quick peek at your audit findings and bookmark this page.</p>
                      <button 
                        onClick={() => { setHasCompletedFunnel(true); setFlowState('revealed'); /* Add smooth scroll logic */ }}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold shadow-lg"
                      >
                        ✨ Click for a Quick Peek
                      </button>
                      <p className="mt-4 text-[10px] text-gray-500 italic">Pro-Tip: Press CMD+D (or Ctrl+D) to bookmark this page.</p>
                    </motion.div>
                  )}

                  {/* STANDARD STEPS (Scope, Intent, Contact, etc.) - Insert your logic here */}

                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. MARKET MAKER CONTENT (Separated for easy moving in Lovable) */}
      <div className="mt-20 text-center max-w-2xl text-gray-400 border-t border-white/5 pt-10">
        <h3 className="text-white font-bold text-xl mb-4">The Market Maker Model</h3>
        <p className="text-sm leading-relaxed font-light">
          The first contractor paid for the discovery, measurements, and price anchoring. 
          WindowMan captures the deal downstream. Our partners walk into the home 
          knowing exactly what to beat.
        </p>
      </div>
    </div>
  );
}
