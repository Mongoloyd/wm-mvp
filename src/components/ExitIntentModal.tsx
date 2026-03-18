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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9500] flex items-center justify-center" style={{ background: 'rgba(10,20,35,0.75)', backdropFilter: 'blur(4px)' }} onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="relative w-[92%] max-w-[520px] rounded-[20px] bg-card p-9 md:p-9" style={{ boxShadow: '0 24px 80px rgba(10,20,35,0.35)' }}>
            <button onClick={dismiss} className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-muted border-none cursor-pointer text-muted-foreground hover:text-foreground"><X size={16} /></button>
            <div className="text-center">
              <h2 className="font-display text-[26px] font-extrabold text-navy mt-2 leading-[1.15]">Before you go — one question.</h2>
              <p className="font-body text-[16px] text-foreground leading-[1.7] mt-3">We've analyzed <span className="font-mono font-bold text-amber-text">{stats.scanned.toLocaleString()}</span> quotes {locationLabel} this year. Average overcharge: <span className="font-mono font-bold text-destructive">${stats.overcharge.toLocaleString()}</span>. Yours takes 60 seconds.</p>
              <div className="flex items-center justify-center gap-2 mt-4"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" /></span><span className="font-body text-[12px] text-muted-foreground">{liveViewers} homeowners checking right now</span></div>
              <button onClick={handleCTA} className="mt-6 w-full rounded-[10px] bg-gold py-3.5 font-body text-[16px] font-bold text-navy border-none cursor-pointer">Check My Quote — It's Free</button>
              <p className="font-body text-[12px] text-muted-foreground mt-3 cursor-pointer" onClick={dismiss}>I'll risk overpaying →</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentModal;
