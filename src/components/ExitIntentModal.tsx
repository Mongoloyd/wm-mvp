import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck } from 'lucide-react';
import { useTickerStats } from '@/hooks/useTickerStats';

interface ExitIntentModalProps { stepsCompleted: number; flowMode: 'A' | 'B' | 'C'; leadCaptured: boolean; flowBLeadCaptured: boolean; county: string; answers: { windowCount: string | null; projectType: string | null; county: string | null; quoteStage: string | null; firstName: string | null; email: string | null; phone: string | null }; onClose: () => void; onCTAClick: () => void; onLeadSubmit?: (data: { email: string; phone: string }) => void; onReminderSet?: (data: { date: string; time: string }) => void; }

const COUNTY_STATS: Record<string, { scanned: number; savings: number }> = { 'Miami-Dade': { scanned: 312, savings: 4800 }, 'Broward': { scanned: 287, savings: 4200 }, 'Palm Beach': { scanned: 241, savings: 5100 } };
const FLORIDA_FALLBACK = { scanned: 2400, savings: 4500 };

const ExitIntentModal = ({ leadCaptured, county, onClose, onCTAClick }: ExitIntentModalProps) => {
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9500] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="relative w-[92%] max-w-[520px] glass-card-strong p-8 md:p-10"
          >
            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="text-center">
              {/* Live viewers badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-5">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="font-mono text-wm-body-soft font-bold text-primary">
                  {liveViewers} homeowners checking right now
                </span>
              </div>

              <h2
                className="font-display font-black uppercase leading-tight tracking-wide mb-4"
                style={{ fontSize: 'clamp(22px, 4vw, 28px)', color: '#E5E5E5', letterSpacing: '0.02em' }}
              >
                Before you go — one question.
              </h2>

              {/* Offer box with holographic pulse */}
              <div className="relative overflow-hidden bg-primary/5 border border-primary/10 p-6 mb-6"
                style={{ borderRadius: 0 }}>
                {/* Holographic sweep — uses background-position animation to avoid layout distortion */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(105deg, transparent 40%, rgba(37,99,235,0.06) 50%, transparent 60%)',
                    backgroundSize: '200% 100%',
                    animation: 'holo-pulse 3s ease-in-out infinite',
                  }}
                />
                {/* 18px bold primary offer */}
                <p className="font-body text-wm-label text-foreground mb-2">
                  Your county baseline is ready.
                </p>
                {/* 15px secondary */}
                <p className="font-body text-wm-body-soft text-muted-foreground leading-relaxed">
                  Homeowners {locationLabel} saved an average of{' '}
                  <span className="font-mono font-bold" style={{ color: '#F97316' }}>
                    ${stats.savings.toLocaleString()}
                  </span>{' '}
                  after scanning. Yours takes 60 seconds.
                </p>
              </div>

              {/* Depth CTA button */}
              <button
                onClick={handleCTA}
                className="btn-depth-primary w-full py-4"
              >
                Check My Quote — It's Free
              </button>

              {/* Dismiss microcopy — 13px is acceptable here as secondary disclaimer */}
              <p
                className="font-body text-[13px] text-muted-foreground mt-4 cursor-pointer hover:text-foreground transition-colors"
                onClick={dismiss}
              >
                I'll risk overpaying →
              </p>

              {/* Social proof */}
              <p className="font-mono text-wm-body-soft text-muted-foreground mt-5">
                Joined by {tickerTotal.toLocaleString()}+ Florida Homeowners
              </p>

              {/* Trust footer */}
              <div className="flex items-start gap-3 mt-5 pt-5 border-t border-border/50 text-left">
                <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="font-body text-[13px] text-muted-foreground leading-snug">
                  We never contact your contractor. No sales calls. Your report is yours.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentModal;
