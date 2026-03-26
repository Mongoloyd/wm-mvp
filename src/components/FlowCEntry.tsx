import { motion } from 'framer-motion';

interface FlowCEntryProps { quoteStage: 'verbal' | 'appointment'; onSwitchToA: () => void; }

const track = (data: Record<string, unknown>) => { console.log({ ...data, timestamp: new Date().toISOString() }); };

const outcomes = [
  { icon: '✓', iconColor: '#2563EB', title: 'Know whether your number is fair', sub: 'Before it becomes the floor in a contract' },
  { icon: '📋', iconColor: '#F97316', title: 'Get the 5 questions to ask before anything is signed', sub: 'The questions that change what ends up in writing' },
  { icon: '🔔', iconColor: '#2563EB', title: 'Set a reminder for when the contract arrives', sub: "So you review it the moment it's in your hands" },
];

const FlowCEntry = ({ quoteStage, onSwitchToA }: FlowCEntryProps) => {
  const isAppointment = quoteStage === 'appointment';
  return (
    <motion.section id="flow-c-entry" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="bg-background pt-14 pb-16 px-4 md:pt-20 md:pb-24 md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="inline-flex items-center gap-2 mb-5 card-raised px-3.5 py-1.5 border-destructive bg-destructive/5">
          <span className="text-destructive text-sm">⚡</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }} className="text-destructive">{isAppointment ? 'CONTRACTOR VISIT APPROACHING — ACT NOW' : "YOU HAVE A NUMBER — LET'S USE IT"}</span>
        </div>
        <h2 className="text-foreground" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(42px, 5.5vw, 54px)', fontWeight: 800, lineHeight: 1.15, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{isAppointment ? 'You have a visit coming up.' : 'You have a number.'}</h2>
        <h2 className="text-destructive" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(42px, 5.5vw, 54px)', fontWeight: 800, lineHeight: 1.15, textTransform: 'uppercase', letterSpacing: '0.02em' }}>It's not in writing yet. That means you still have leverage.</h2>
        <p className="text-foreground" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, lineHeight: 1.75, maxWidth: 580, marginTop: 14 }}>The moment a contractor puts it on paper, the anchor is set. Right now, you can still change the number before the contract arrives.</p>
        <div className="card-raised" style={{ marginTop: 16, marginBottom: 32, borderLeft: '3px solid hsl(var(--destructive))', padding: 16, maxWidth: 580 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600 }} className="text-destructive">Your leverage isn't just gone when you sign. It's actively shrinking right now.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-5 max-w-[680px] mb-9">
          {outcomes.map((o, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex items-center justify-center shrink-0 w-9 h-9 card-raised"><span style={{ color: o.iconColor, fontSize: 14 }}>{o.icon}</span></div>
              <div>
                <p className="text-foreground" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600 }}>{o.title}</p>
                <p className="text-muted-foreground" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginTop: 2 }}>{o.sub}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => { track({ event: 'wm_flow_c_entry_cta_clicked', quoteStage }); document.getElementById('market-baseline')?.scrollIntoView({ behavior: 'smooth' }); }}
          className="btn-depth-primary" style={{ padding: '16px 36px', fontSize: 17 }}>
          Lock In My Leverage →
        </button>
        <p className="text-muted-foreground" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginTop: 14 }}>I do have a written quote —{' '}<span onClick={onSwitchToA} className="text-primary underline cursor-pointer" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>scan it instead →</span></p>
      </div>
    </motion.section>
  );
};

export default FlowCEntry;
