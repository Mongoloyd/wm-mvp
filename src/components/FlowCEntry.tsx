import { motion } from 'framer-motion';

interface FlowCEntryProps { quoteStage: 'verbal' | 'appointment'; onSwitchToA: () => void; }

const track = (data: Record<string, unknown>) => { console.log({ ...data, timestamp: new Date().toISOString() }); };

const outcomes = [
  { bg: 'bg-emerald-light', icon: '✓', iconColor: 'text-emerald-text', title: 'Know whether your number is fair', sub: 'Before it becomes the floor in a contract' },
  { bg: 'bg-gold-light', icon: '📋', iconColor: 'text-amber-text', title: 'Get the 5 questions to ask before anything is signed', sub: 'The questions that change what ends up in writing' },
  { bg: 'bg-cyan-light', icon: '🔔', iconColor: 'text-cyan-text', title: 'Set a reminder for when the contract arrives', sub: "So you review it the moment it's in your hands" },
];

const FlowCEntry = ({ quoteStage, onSwitchToA }: FlowCEntryProps) => {
  const isAppointment = quoteStage === 'appointment';
  return (
    <motion.section id="flow-c-entry" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-card pt-14 pb-16 px-4 md:pt-20 md:pb-24 md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="inline-flex items-center gap-2 rounded-md border border-gold bg-gold-light px-3.5 py-1.5 mb-5">
          <span className="text-amber-text text-sm">⚡</span>
          <span className="font-mono text-[11px] font-bold text-amber-text tracking-[0.08em]">{isAppointment ? 'CONTRACTOR VISIT APPROACHING — ACT NOW' : "YOU HAVE A NUMBER — LET'S USE IT"}</span>
        </div>
        <h2 className="font-display text-[42px] md:text-[54px] font-extrabold text-navy leading-[1.15]">{isAppointment ? 'You have a visit coming up.' : 'You have a number.'}</h2>
        <h2 className="font-display text-[42px] md:text-[54px] font-extrabold text-amber-text leading-[1.15]">It's not in writing yet. That means you still have leverage.</h2>
        <p className="font-body text-[17px] text-foreground leading-[1.75] max-w-[580px] mt-3.5">The moment a contractor puts it on paper, the anchor is set. Right now, you can still change the number before the contract arrives.</p>
        <div className="mt-4 mb-8 rounded-md border-l-[3px] border-l-danger bg-danger-light p-4 max-w-[580px]">
          <p className="font-body text-[15px] font-semibold text-danger">Your leverage isn't just gone when you sign. It's actively shrinking right now.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-5 max-w-[680px] mb-9">
          {outcomes.map((o, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`${o.bg} flex h-9 w-9 shrink-0 items-center justify-center rounded-full`}><span className={`${o.iconColor} text-sm`}>{o.icon}</span></div>
              <div>
                <p className="font-body text-[14px] font-semibold text-navy">{o.title}</p>
                <p className="font-body text-[13px] text-muted-foreground mt-0.5">{o.sub}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => { track({ event: 'wm_flow_c_entry_cta_clicked', quoteStage }); document.getElementById('market-baseline')?.scrollIntoView({ behavior: 'smooth' }); }}
          className="rounded-[10px] bg-gold px-9 py-4 font-body text-[17px] font-bold text-navy shadow-[0_4px_16px_rgba(245,158,11,0.35)] cursor-pointer border-none">
          Lock In My Leverage →
        </button>
        <p className="font-body text-[13px] text-muted-foreground mt-3.5">I do have a written quote —{' '}<span onClick={onSwitchToA} className="text-cyan-text underline cursor-pointer">scan it instead →</span></p>
      </div>
    </motion.section>
  );
};

export default FlowCEntry;
