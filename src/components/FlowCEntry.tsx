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
    <motion.section id="flow-c-entry" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} style={{ backgroundColor: '#0A0A0A' }} className="pt-14 pb-16 px-4 md:pt-20 md:pb-24 md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="inline-flex items-center gap-2 mb-5" style={{ border: '1px solid #F97316', background: 'rgba(249,115,22,0.08)', borderRadius: 0, padding: '5px 14px' }}>
          <span style={{ color: '#F97316', fontSize: 14 }}>⚡</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, color: '#F97316', letterSpacing: '0.08em' }}>{isAppointment ? 'CONTRACTOR VISIT APPROACHING — ACT NOW' : "YOU HAVE A NUMBER — LET'S USE IT"}</span>
        </div>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(42px, 5.5vw, 54px)', fontWeight: 800, color: '#E5E5E5', lineHeight: 1.15, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{isAppointment ? 'You have a visit coming up.' : 'You have a number.'}</h2>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(42px, 5.5vw, 54px)', fontWeight: 800, color: '#F97316', lineHeight: 1.15, textTransform: 'uppercase', letterSpacing: '0.02em' }}>It's not in writing yet. That means you still have leverage.</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: '#E5E7EB', lineHeight: 1.75, maxWidth: 580, marginTop: 14 }}>The moment a contractor puts it on paper, the anchor is set. Right now, you can still change the number before the contract arrives.</p>
        <div style={{ marginTop: 16, marginBottom: 32, borderLeft: '3px solid #F97316', background: 'rgba(249,115,22,0.06)', padding: 16, maxWidth: 580 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: '#F97316' }}>Your leverage isn't just gone when you sign. It's actively shrinking right now.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-5 max-w-[680px] mb-9">
          {outcomes.map((o, i) => (
            <div key={i} className="flex items-start gap-3">
              <div style={{ width: 36, height: 36, borderRadius: 0, background: '#111111', border: '1px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ color: o.iconColor, fontSize: 14 }}>{o.icon}</span></div>
              <div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#E5E5E5' }}>{o.title}</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#E5E7EB', marginTop: 2 }}>{o.sub}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => { track({ event: 'wm_flow_c_entry_cta_clicked', quoteStage }); document.getElementById('market-baseline')?.scrollIntoView({ behavior: 'smooth' }); }}
          style={{ borderRadius: 0, background: '#2563EB', padding: '16px 36px', fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 700, color: '#FFFFFF', boxShadow: '0 4px 16px rgba(37,99,235,0.35)', cursor: 'pointer', border: 'none' }}>
          Lock In My Leverage →
        </button>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6B7280', marginTop: 14 }}>I do have a written quote —{' '}<span onClick={onSwitchToA} style={{ color: '#2563EB', textDecoration: 'underline', cursor: 'pointer' }}>scan it instead →</span></p>
      </div>
    </motion.section>
  );
};

export default FlowCEntry;
