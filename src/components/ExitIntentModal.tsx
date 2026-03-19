import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTickerStats } from '@/hooks/useTickerStats';

interface ExitIntentModalProps { stepsCompleted: number; flowMode: 'A' | 'B' | 'C'; leadCaptured: boolean; flowBLeadCaptured: boolean; county: string; answers: { windowCount: string | null; projectType: string | null; county: string | null; quoteStage: string | null; firstName: string | null; email: string | null; phone: string | null }; onClose: () => void; onCTAClick: () => void; onLeadSubmit?: (data: { email: string; phone: string }) => void; onReminderSet?: (data: { date: string; time: string }) => void; }

const COUNTY_STATS: Record<string, { scanned: number; overcharge: number; redFlags: number }> = { 'Miami-Dade': { scanned: 312, overcharge: 5200, redFlags: 2.4 }, 'Broward': { scanned: 287, overcharge: 4800, redFlags: 2.1 }, 'Palm Beach': { scanned: 241, overcharge: 5600, redFlags: 2.3 } };
const FLORIDA_FALLBACK = { scanned: 2400, overcharge: 4800, redFlags: 2.1 };

const ExitIntentModal = ({ stepsCompleted, flowMode, leadCaptured, flowBLeadCaptured, county, answers, onClose, onCTAClick }: ExitIntentModalProps) => {
  const [open, setOpen] = useState(false);
  const [liveViewers] = useState(() => 8 + Math.floor(Math.random() * 12));
  const { total: tickerTotal } = useTickerStats();
  const resolvedCounty = county && county !== 'your county' ? county : null;
  const stats = resolvedCounty && COUNTY_STATS[resolvedCounty] ? COUNTY_STATS[resolvedCounty] : FLORIDA_FALLBACK;
  const locationLabel = resolvedCounty ? `in ${resolvedCounty} County` : 'across Florida';

  const show = useCallback(() => { if (leadCaptured || sessionStorage.getItem('wm_exit_shown') === 'true') return; sessionStorage.setItem('wm_exit_shown', 'true'); setOpen(true); }, [leadCaptured]);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => { if (e.clientY < 20) show(); };
    const handleVisibility = () => { if (document.hidden) show(); };
    document.addEventListener('mouseleave', handleMouse);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => { document.removeEventListener('mouseleave', handleMouse); document.removeEventListener('visibilitychange', handleVisibility); };
  }, [show]);

  const dismiss = () => { setOpen(false); onClose(); };
  const handleCTA = () => { setOpen(false); onCTAClick(); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="fixed inset-0 z-[9500] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }} onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.15 }} className="relative w-[92%] max-w-[520px] p-9 md:p-9" style={{ background: '#111111', border: '1px solid #1A1A1A', borderRadius: 0, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
            <button onClick={dismiss} className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center bg-transparent border-none cursor-pointer" style={{ color: '#E5E7EB' }}><X size={16} /></button>
            <div className="text-center">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: '#E5E5E5', marginTop: 8, lineHeight: 1.15, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Before you go — one question.</h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: '#E5E7EB', lineHeight: 1.7, marginTop: 12 }}>We've analyzed <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: '#F97316' }}>{tickerTotal.toLocaleString()}</span> quotes {locationLabel} this year. Average overcharge: <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: '#F97316' }}>${stats.overcharge.toLocaleString()}</span>. Yours takes 60 seconds.</p>
              <div className="flex items-center justify-center gap-2 mt-4"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" /></span><span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#E5E7EB' }}>{liveViewers} homeowners checking right now</span></div>
              <button onClick={handleCTA} style={{ marginTop: 24, width: '100%', borderRadius: 0, background: '#2563EB', padding: '14px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: '#FFFFFF', border: 'none', cursor: 'pointer' }}>Check My Quote — It's Free</button>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#E5E7EB', marginTop: 12, cursor: 'pointer' }} onClick={dismiss}>I'll risk overpaying →</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentModal;
