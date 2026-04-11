import React, { useState, useEffect } from 'react';
import { FileText, ScanEye, Check, Handshake, AlertTriangle, CircleDollarSign, ChevronRight, PhoneCall, ArrowLeft, X, Crown, UserCheck, CheckCircle, Key, Shield, Ruler, DollarSign, FileSearch, ShieldCheck, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { getUtmData } from '@/lib/useUtmCapture';
import { toE164 } from '@/utils/formatPhone';

// ── Mock 5-Pillar Analysis Data ──────────────────────────────────────────────
const MOCK_ANALYSIS = {
  grade: 'C+',
  gradeScore: 58,
  pillars: [
    { key: 'safety', label: 'Safety & Code', score: 62, status: 'fail' as const, icon: Shield },
    { key: 'install', label: 'Install Scope', score: 78, status: 'pass' as const, icon: Ruler },
    { key: 'price', label: 'Price Fairness', score: 45, status: 'fail' as const, icon: DollarSign },
    { key: 'fine_print', label: 'Fine Print', score: 71, status: 'pass' as const, icon: FileSearch },
    { key: 'warranty', label: 'Warranty', score: 55, status: 'warn' as const, icon: ShieldCheck },
  ],
  redFlags: [
    'No NOA (Notice of Acceptance) referenced for impact products',
    'Missing DP rating specification on 3 of 8 openings',
    'No permit handling or inspection timeline mentioned',
  ],
  amberFlags: [
    'Warranty terms reference "limited lifetime" without defining coverage scope',
    'No line-item breakdown for labor vs. materials',
  ],
};

const statusColor = (s: 'pass' | 'fail' | 'warn') =>
  s === 'pass' ? 'text-emerald-400' : s === 'fail' ? 'text-red-400' : 'text-amber-400';
const barColor = (s: 'pass' | 'fail' | 'warn') =>
  s === 'pass' ? 'bg-emerald-400' : s === 'fail' ? 'bg-red-400' : 'bg-amber-400';
const gradeColor = (g: string) => {
  if (g.startsWith('A')) return 'text-emerald-400 border-emerald-400/50 bg-emerald-500/10';
  if (g.startsWith('B')) return 'text-cyan-400 border-cyan-400/50 bg-cyan-500/10';
  if (g.startsWith('C')) return 'text-amber-400 border-amber-400/50 bg-amber-500/10';
  return 'text-red-400 border-red-400/50 bg-red-500/10';
};

export default function App() {
  // Main App State
  const [flowState, setFlowState] = useState('idle');
  const [hasCompletedFunnel, setHasCompletedFunnel] = useState(false);
  
  // Exit-Intent State
  const [isExitIntent, setIsExitIntent] = useState(false);

  // Lead capture state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Breadcrumb Funnel State
  const [funnelStep, setFunnelStep] = useState('scope');
  const [stepHistory, setStepHistory] = useState<string[]>([]);
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

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

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

  const advance = (nextStep: string, field: string | null = null, value: string | null = null) => {
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

  // ── Supabase Lead Capture ──────────────────────────────────────────────────
  const handleLeadSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const utm = getUtmData();
      const sessionId = crypto.randomUUID();
      const phoneE164 = toE164(formData.phone);

      // Parse window count from scope
      const scopeMap: Record<string, number> = { '1-5': 3, '6-10': 8, '11-15': 13, '15+': 20 };
      const windowCount = scopeMap[formData.scope] ?? null;

      const { error } = await supabase.from('leads').insert({
        session_id: sessionId,
        first_name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone_e164: phoneE164,
        zip: formData.zip,
        source: 'arbitrage-engine',
        window_count: windowCount,
        has_estimate: formData.hasEstimate === 'Yes',
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        utm_term: utm.utm_term,
        utm_content: utm.utm_content,
        fbclid: utm.fbclid,
        gclid: utm.gclid,
        fbc: utm.fbc,
        landing_page_url: utm.landing_page,
        status: 'new',
      });

      if (error) throw error;

      // Success — advance to next funnel step
      advance('intent');
    } catch (err: any) {
      console.error('[ArbitrageEngine] Lead insert failed:', err);
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!hasCompletedFunnel && !isExitIntent && funnelStep !== 'done' && !['secret_capture', 'secret_success'].includes(funnelStep) && !isEmailValid) {
      setIsExitIntent(true);
      return;
    }
    setHasCompletedFunnel(true);
    setFlowState('revealed');
    setTimeout(() => {
      setFunnelStep('scope');
      setStepHistory([]);
      setIsExitIntent(false);
    }, 300);
  };

  const handleResetDemo = () => {
    setFlowState('idle');
    setHasCompletedFunnel(false);
    setIsExitIntent(false);
    setFunnelStep('scope');
    setStepHistory([]);
    setSubmitError(null);
    setFormData({
      scope: '', installerPreference: '', hasEstimate: '', numEstimates: '',
      dealBreaker: '', zip: '', phone: '', name: '', email: '',
      callIntent: '', timeframe: '', hasConsent: false
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const formatPhoneDisplay = (val: string) => {
    if (!val) return '';
    const cleaned = ('' + val).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      return !match[2] ? match[1] : `(${match[1]}) ${match[2]}` + (match[3] ? `-${match[3]}` : '');
    }
    return val;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: cleaned });
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 5);
    setFormData({ ...formData, zip: cleaned });
  };

  const slideVariants = {
    initial: { x: 50, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" as const } },
    exit: { x: -50, opacity: 0, transition: { duration: 0.2, ease: "easeIn" as const } }
  };

  const OptionCard = ({ text, onClick }: { text: string; onClick: () => void }) => (
    <button 
      type="button"
      onClick={onClick}
      className="w-full bg-slate-800/60 border border-white/10 hover:border-cyan-400/80 hover:bg-cyan-900/20 backdrop-blur-md py-4 px-6 rounded-xl shadow-lg transition-all text-gray-200 hover:text-cyan-50 font-semibold text-lg flex items-center justify-between group active:scale-[0.98] shrink-0"
    >
      <span>{text}</span>
      <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-hidden relative flex flex-col items-center justify-center p-4 selection:bg-cyan-500/30">
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.4); }
      `}</style>

      {/* Background Effects */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)',
        }}
      />
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Main Dashboard Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center">
        
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-10 drop-shadow-lg text-center">
          The Arbitrage Engine
        </h1>

        <div className="w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl pointer-events-none" />

          <div className="text-center mb-12">
            <h2 className="text-slate-400 text-xl font-semibold tracking-widest uppercase mb-1 drop-shadow-sm">
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
                  <div className="w-32 h-32 rounded-xl border-2 border-amber-400 bg-slate-800 shadow-[0_0_20px_rgba(251,191,36,0.15)_inset,0_0_20px_rgba(251,191,36,0.2)] flex flex-col items-center justify-center p-4">
                    <FileText className="w-10 h-10 text-amber-400 mb-3" strokeWidth={1.5} />
                    <span className="text-[13px] font-medium leading-tight text-gray-200 text-center">Quote<br/>Uploaded</span>
                  </div>
                  <div className="w-full mt-4 flex flex-col gap-1.5 px-1">
                    <div className="flex justify-end w-full"><span className="text-[11px] font-bold text-amber-400">92%</span></div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 w-[92%] rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center w-32">
                  <div className="w-32 h-32 rounded-xl border-2 border-yellow-400 bg-slate-800 shadow-[0_0_20px_rgba(250,204,21,0.15)_inset,0_0_20px_rgba(250,204,21,0.2)] flex flex-col items-center justify-center p-4">
                    <ScanEye className="w-10 h-10 text-yellow-400 mb-3" strokeWidth={1.5} />
                    <span className="text-[13px] font-medium leading-tight text-gray-200 text-center">AI Risk<br/>Audit</span>
                  </div>
                  <div className="w-full mt-4 flex flex-col gap-1.5 px-1">
                    <div className="flex justify-end w-full"><span className="text-[11px] font-bold text-yellow-400">92%</span></div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 w-[92%] rounded-full shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-0.5 text-[9px] font-semibold text-red-500/90 whitespace-nowrap uppercase tracking-wider">
                      <AlertTriangle size={10} strokeWidth={2.5} />
                      <span>Missing NOA</span>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center w-32">
                  <div className={`w-32 h-32 rounded-xl border-2 flex flex-col items-center justify-center p-4 transition-all duration-500 z-20 relative bg-slate-800
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
                      <div className="h-full bg-emerald-400 w-[78%] rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    </div>
                  </motion.div>
                </div>

                {/* Step 4 */}
                <div className="flex flex-col items-center w-32">
                  <div className={`w-32 h-32 rounded-xl border-2 flex flex-col items-center justify-center p-3 transition-all duration-700 bg-slate-800 z-20 relative
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
                        <div className="absolute -top-3 -right-2 bg-slate-800 rounded-full p-[1px]">
                           <CircleDollarSign className="w-5 h-5 text-emerald-400" strokeWidth={2} />
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

        {/* CTA Button and Market Maker Content */}
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
          <p className="text-slate-400 text-lg leading-relaxed font-light">
            The first contractor paid for the discovery, measurements, and price anchoring. WindowMan captures the deal downstream. Our partners walk into the home knowing exactly what to beat.
          </p>

          {/* ── Mock 5-Pillar Analysis Reveal ─────────────────────────────── */}
          {hasCompletedFunnel && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="w-full mt-12"
            >
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl pointer-events-none" />

                {/* Grade Badge */}
                <div className="relative z-10 flex flex-col items-center mb-8">
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Sample Truth Report™ Grade</span>
                  <div className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center text-3xl font-black ${gradeColor(MOCK_ANALYSIS.grade)}`}>
                    {MOCK_ANALYSIS.grade}
                  </div>
                  <span className="text-slate-400 text-sm mt-2">Overall Score: {MOCK_ANALYSIS.gradeScore}/100</span>
                </div>

                {/* 5 Pillar Bars */}
                <div className="relative z-10 space-y-4 mb-8">
                  {MOCK_ANALYSIS.pillars.map((p) => (
                    <div key={p.key} className="flex items-center gap-3">
                      <p.icon className={`w-5 h-5 shrink-0 ${statusColor(p.status)}`} strokeWidth={1.5} />
                      <span className="text-sm text-gray-300 w-28 shrink-0 text-left">{p.label}</span>
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor(p.status)}`} style={{ width: `${p.score}%` }} />
                      </div>
                      <span className={`text-sm font-bold w-10 text-right ${statusColor(p.status)}`}>{p.score}</span>
                    </div>
                  ))}
                </div>

                {/* Red Flags */}
                <div className="relative z-10 mb-6">
                  <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Red Flags ({MOCK_ANALYSIS.redFlags.length})
                  </h3>
                  <ul className="space-y-2">
                    {MOCK_ANALYSIS.redFlags.map((f, i) => (
                      <li key={i} className="text-sm text-gray-300 pl-5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:rounded-full before:bg-red-500/80">
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Amber Flags */}
                <div className="relative z-10 mb-8">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Warnings ({MOCK_ANALYSIS.amberFlags.length})
                  </h3>
                  <ul className="space-y-2">
                    {MOCK_ANALYSIS.amberFlags.map((f, i) => (
                      <li key={i} className="text-sm text-gray-300 pl-5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:rounded-full before:bg-amber-500/80">
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="relative z-10">
                  <button
                    onClick={() => window.location.href = '/'}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Your Real Quote
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Breadcrumb Lead Funnel Modal ───────────────────────────────────── */}
      {flowState === 'modal_open' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-slate-900/95 border border-white/10 rounded-2xl max-w-md w-full shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden flex flex-col min-h-[420px] max-h-[85vh]"
          >
            {/* Modal Navigation */}
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

            {/* Progress Bar */}
            {!isExitIntent && !['secret_capture', 'secret_success'].includes(funnelStep) && (
              <div className="w-full h-1.5 bg-gray-800 absolute top-0 left-0 right-0 z-10 shrink-0">
                <div 
                  className="h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] transition-all duration-500 ease-out"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
            )}

            {/* Dynamic Funnel Content */}
            <div className="flex-1 flex flex-col relative overflow-hidden mt-1.5">
              <AnimatePresence mode="wait">

                {/* EXIT INTENT */}
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
                          if (isEmailValid) {
                            advance('secret_success');
                          } else {
                            advance('secret_capture');
                          }
                        }}
                        className="w-full bg-slate-800/60 border border-amber-500/50 hover:border-amber-400/80 hover:bg-amber-900/20 backdrop-blur-md p-5 rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.15)] transition-all text-left flex items-center gap-4 group active:scale-[0.98] shrink-0"
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
                      Enter your best email below and I'll share our tactic to force contractors to start with their absolute best offers. It's based on the 'George Akerlof Law of Lemons' economic theory, and we're the <strong className="text-white">only</strong> company in the home improvement space doing it.
                    </p>
                    <form 
                      onSubmit={(e) => { e.preventDefault(); advance('secret_success'); }} 
                      className="flex flex-col gap-4 w-full"
                    >
                      <div className="flex flex-col gap-1">
                        <input 
                          required type="email" placeholder="Where should we send our secret strategy?" 
                          value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                          className={`w-full bg-slate-950/70 border rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-1 placeholder:text-gray-500 transition-all ${formData.email && !isEmailValid ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:border-amber-500/50 focus:ring-amber-500/50'}`} 
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

                {/* SECRET SUCCESS */}
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
                      <button 
                        type="button"
                        onClick={() => advance('status', 'installerPreference', 'premium')}
                        className="w-full bg-slate-800/60 border border-white/10 hover:border-cyan-400/80 hover:bg-cyan-900/20 backdrop-blur-md p-5 rounded-xl shadow-lg transition-all text-left flex items-center gap-4 group active:scale-[0.98] shrink-0"
                      >
                        <div className="w-12 h-12 rounded-full bg-slate-950/50 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
                          <Crown className="w-6 h-6 text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-gray-200 group-hover:text-cyan-50 font-bold text-[17px] leading-tight">I want a premium, high-end installer</div>
                          <div className="text-sm text-gray-400 group-hover:text-cyan-100/70 mt-1 leading-snug">I prioritize brand reputation and white-glove service.</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors shrink-0 ml-1" />
                      </button>

                      <button 
                        type="button"
                        onClick={() => advance('status', 'installerPreference', 'value')}
                        className="w-full bg-slate-800/60 border border-white/10 hover:border-cyan-400/80 hover:bg-cyan-900/20 backdrop-blur-md p-5 rounded-xl shadow-lg transition-all text-left flex items-center gap-4 group active:scale-[0.98] shrink-0"
                      >
                        <div className="w-12 h-12 rounded-full bg-slate-950/50 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
                          <UserCheck className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-gray-200 group-hover:text-cyan-50 font-bold text-[17px] leading-tight">I want a quality, honest local pro</div>
                          <div className="text-sm text-gray-400 group-hover:text-cyan-100/70 mt-1 leading-snug">I prioritize reliability and getting the best fair price.</div>
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

                {/* Step 3A */}
                {!isExitIntent && funnelStep === 'comp_a' && (
                  <motion.div key="comp_a" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full w-full absolute inset-0 p-8 overflow-y-auto custom-scrollbar">
                    <h2 className="text-2xl font-bold mb-6 text-center text-white shrink-0">How many estimates have you seen?</h2>
                    <div className="flex flex-col gap-3 mt-4 pb-4">
                      <OptionCard text="Just 1" onClick={() => advance('comp_b', 'numEstimates', '1')} />
                      <OptionCard text="2 or more" onClick={() => advance('comp_b', 'numEstimates', '2+')} />
                    </div>
                  </motion.div>
                )}

                {/* Step 3B */}
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

                {/* Step 4: Contact Gate */}
                {!isExitIntent && funnelStep === 'contact' && (
                  <motion.div key="contact" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full w-full absolute inset-0 p-8 overflow-y-auto custom-scrollbar">
                    <h2 className="text-2xl font-bold mb-2 text-center text-white shrink-0">Almost there!</h2>
                    <p className="text-cyan-400 text-sm font-semibold text-center mb-6 shrink-0">We found 3 potential savings in your area.</p>
                    <form 
                      onSubmit={(e) => { e.preventDefault(); advance('identity'); }} 
                      className="flex flex-col gap-4 pb-4"
                    >
                      <input 
                        required type="text" inputMode="numeric" maxLength={5} placeholder="Zip Code" 
                        value={formData.zip} onChange={handleZipChange}
                        className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50" 
                      />
                      <input 
                        required type="tel" maxLength={14} placeholder="(555) 555-5555" 
                        value={formatPhoneDisplay(formData.phone)} onChange={handlePhoneChange}
                        className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50" 
                      />
                      
                      <div className="flex items-start gap-3 mt-1 px-1">
                        <button
                          type="button" role="checkbox" aria-checked={formData.hasConsent}
                          onClick={() => setFormData({...formData, hasConsent: !formData.hasConsent})}
                          className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${formData.hasConsent ? 'bg-cyan-500 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-slate-950/70 border-white/20'}`}
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

                {/* Step 5: Identity Capture (triggers Supabase insert) */}
                {!isExitIntent && funnelStep === 'identity' && (
                  <motion.div key="identity" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full w-full absolute inset-0 p-8 overflow-y-auto custom-scrollbar">
                    <h2 className="text-3xl font-extrabold mb-8 text-center bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent drop-shadow-sm shrink-0">
                      You Got it
                    </h2>
                    <form 
                      onSubmit={async (e) => { e.preventDefault(); await handleLeadSubmit(); }} 
                      className="flex flex-col gap-4 pb-4"
                    >
                      <input 
                        required type="text" placeholder="What's your name?" 
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 placeholder:text-gray-500" 
                      />
                      <div className="flex flex-col gap-1">
                        <input 
                          required type="email" placeholder="What's your best email?" 
                          value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                          className={`w-full bg-slate-950/70 border rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-1 placeholder:text-gray-500 transition-all ${formData.email && !isEmailValid ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/50'}`} 
                        />
                        {formData.email && !isEmailValid && (
                          <span className="text-red-400 text-xs ml-1 font-medium">Please enter a valid email address.</span>
                        )}
                      </div>
                      {submitError && (
                        <p className="text-red-400 text-sm text-center font-medium">{submitError}</p>
                      )}
                      <button 
                        type="submit" 
                        disabled={!formData.name || !isEmailValid || isSubmitting}
                        className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all active:scale-95 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Saving…' : 'Next Step'}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* Step 6: Call Intent */}
                {!isExitIntent && funnelStep === 'intent' && (
                  <motion.div key="intent" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col h-full w-full absolute inset-0 p-8 overflow-y-auto custom-scrollbar">
                    <h2 className="text-2xl font-bold mb-6 text-center text-white leading-snug shrink-0">Would you like a quick phone call to review these results with a specialist?</h2>
                    <div className="flex flex-col gap-3 mt-2 pb-4">
                      <OptionCard text="Yes, I want expert advice" onClick={() => advance('call', 'callIntent', 'Yes')} />
                      <OptionCard text="No, just email me for now" onClick={() => advance('timeframe', 'callIntent', 'No')} />
                    </div>
                  </motion.div>
                )}

                {/* Path A: Call */}
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
                          key={opt} text={opt}
                          onClick={() => {
                            advance('done', 'timeframe', opt);
                            setHasCompletedFunnel(true);
                            setTimeout(handleClose, 3500);
                          }} 
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Final Done */}
                {!isExitIntent && funnelStep === 'done' && (
                  <motion.div key="done" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center h-full w-full absolute inset-0 p-8 text-center overflow-y-auto custom-scrollbar">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mb-6 shrink-0 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                      <CheckCircle className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-500 mb-4 shrink-0 drop-shadow-sm">
                      {formData.scope === '15+' ? 'Premium Project Detected!' : 'Audit Complete & Matched!'}
                    </h2>
                    <p className="text-gray-300 text-base leading-relaxed shrink-0 px-2">
                      {formData.scope === '1-5' 
                        ? "Perfect for our Quick-Response Team. We've matched you with 2 local installers specializing in smaller projects for a fast turnaround." 
                        : formData.scope === '15+' 
                        ? "We've prioritized your full-home audit for our Premium Installation Team to ensure maximum pricing leverage and elite craftsmanship."
                        : "Project scope confirmed. We've routed your audit to our top-rated local installation partners for immediate review."}
                    </p>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
