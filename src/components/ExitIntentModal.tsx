import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTickerStats } from '@/hooks/useTickerStats';

interface ExitIntentModalProps { stepsCompleted: number; flowMode: 'A' | 'B' | 'C'; leadCaptured: boolean; flowBLeadCaptured: boolean; county: string; answers: { windowCount: string | null; projectType: string | null; county: string | null; quoteStage: string | null; firstName: string | null; email: string | null; phone: string | null }; onClose: () => void; onCTAClick: () => void; onLeadSubmit?: (data: { email: string; phone: string }) => void; onReminderSet?: (data: { date: string; time: string }) => void; }

const COUNTY_STATS: Record<string, { scanned: number; savings: number }> = { 'Miami-Dade': { scanned: 312, savings: 4800 }, 'Broward': { scanned: 287, savings: 4200 }, 'Palm Beach': { scanned: 241, savings: 5100 } };
const FLORIDA_FALLBACK = { scanned: 2400, savings: 4500 };

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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9500] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.15 }}
            className="relative w-[92%] max-w-[520px] p-9 glass-card-strong rounded-2xl" style={{ boxShadow: 'var(--wm-shadow-float)' }}>
            <button onClick={dismiss} className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center bg-transparent border-none cursor-pointer text-muted-foreground"><X size={16} /></button>
            <div className="text-center">
              <h2 className="display-secondary text-foreground mt-2" style={{ fontSize: 26, lineHeight: 1.15 }}>Before you go — one question.</h2>
              <p className="font-body text-base text-muted-foreground leading-relaxed mt-3">Homeowners {locationLabel} saved an average of <span className="font-mono font-bold text-wm-orange">${stats.savings.toLocaleString()}</span> after scanning with WindowMan. Yours takes 60 seconds.</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" /></span>
                <span className="font-body text-xs text-muted-foreground">{liveViewers} homeowners checking right now</span>
              </div>
              <button onClick={handleCTA} className="btn-depth-primary rounded-xl w-full mt-6 py-3.5 font-body text-base font-bold">Check My Quote — It's Free</button>
              <p className="font-body text-xs text-muted-foreground mt-3 cursor-pointer" onClick={dismiss}>I'll risk overpaying →</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentModal;
