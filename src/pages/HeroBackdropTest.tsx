import { motion } from "framer-motion";

const MASCOT_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/87108037/YjBTWCdi7jZwa5GFcxbLnp/windowmanwithtruthreportonthephone_be309c26.avif";

const SampleContent = () => (
  <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
    <div className="flex flex-col md:flex-row items-center gap-8">
      <div className="md:flex-1 flex flex-col items-center md:items-start">
        <div className="inline-flex items-center gap-2 mb-5 rounded-lg px-3 py-1 bg-primary/5 border border-primary/10">
          <span className="text-primary text-sm">🛡️</span>
          <span className="text-primary text-xs font-semibold tracking-widest uppercase">Forensic Quote Intelligence</span>
        </div>
        <h2 className="font-display uppercase leading-tight mb-5 text-foreground" style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900 }}>
          YOUR QUOTE LOOKS LEGITIMATE.<br />
          THAT'S EXACTLY WHAT <span className="text-destructive">THEY'RE COUNTING ON.</span>
        </h2>
        <p className="font-body mb-6 text-muted-foreground" style={{ fontSize: "clamp(14px, 1.5vw, 16px)", lineHeight: 1.7 }}>
          The Impact Window Industry Has No Pricing Transparency Standard.
          WindowMan Built One — and It Audits Your Quote In <strong className="text-foreground">under 60 seconds</strong>.
        </p>
        <button className="btn-depth-primary whitespace-nowrap" style={{ fontSize: 16, padding: "16px 32px" }}>
          Scan My Quote — It's Free
        </button>
      </div>
      <div className="md:flex-1 flex justify-center">
        <img src={MASCOT_URL} alt="WindowMan" className="w-48 md:w-64 h-auto object-contain" />
      </div>
    </div>
  </div>
);

/* ── Idea 1: Soft Spotlight Cone ── */
const Idea1 = () => (
  <section className="relative overflow-hidden" style={{ background: "linear-gradient(168deg, hsl(214 35% 95%) 0%, hsl(216 38% 93%) 40%, hsl(218 32% 94%) 100%)" }}>
    <div className="absolute inset-0 pointer-events-none" style={{
      background: "radial-gradient(ellipse 80% 60% at 50% -5%, hsl(210 40% 88% / 0.7) 0%, transparent 70%)"
    }} />
    <div className="absolute inset-0 pointer-events-none" style={{
      background: "radial-gradient(ellipse 50% 80% at 30% 50%, hsl(214 50% 90% / 0.5) 0%, transparent 60%)"
    }} />
    <SampleContent />
  </section>
);

/* ── Idea 2: Frosted Glass Pane ── */
const Idea2 = () => (
  <section className="relative overflow-hidden" style={{
    background: "linear-gradient(168deg, hsl(214 35% 95%) 0%, hsl(216 38% 93%) 40%, hsl(218 32% 94%) 100%)"
  }}>
    {/* Subtle pattern texture */}
    <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
    }} />
    {/* Frosted pane behind text */}
    <div className="absolute top-8 left-4 right-[45%] bottom-8 rounded-2xl pointer-events-none"
      style={{
        background: "hsl(210 30% 97% / 0.6)",
        backdropFilter: "blur(24px)",
        border: "1px solid hsl(210 30% 90% / 0.5)",
        boxShadow: "0 8px 32px hsl(210 30% 50% / 0.06)"
      }}
    />
    <SampleContent />
  </section>
);

/* ── Idea 3: Radial Glow Ring ── */
const Idea3 = () => (
  <section className="relative overflow-hidden" style={{
    background: "linear-gradient(168deg, hsl(214 35% 95%) 0%, hsl(216 38% 93%) 40%, hsl(218 32% 94%) 100%)"
  }}>
    {/* Glow ring behind mascot area */}
    <motion.div
      className="absolute pointer-events-none"
      style={{
        top: "10%", right: "8%", width: "500px", height: "500px",
        background: "radial-gradient(circle, hsl(25 95% 53% / 0.06) 20%, hsl(210 60% 60% / 0.08) 50%, transparent 70%)",
        borderRadius: "50%",
      }}
      animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    />
    {/* Secondary subtle ring */}
    <div className="absolute pointer-events-none" style={{
      top: "20%", right: "15%", width: "300px", height: "300px",
      background: "radial-gradient(circle, transparent 40%, hsl(210 50% 80% / 0.15) 60%, transparent 80%)",
      borderRadius: "50%",
    }} />
    <SampleContent />
  </section>
);

/* ── Idea 4: Diagonal Light Wash ── */
const Idea4 = () => (
  <section className="relative overflow-hidden" style={{
    background: "linear-gradient(168deg, hsl(214 35% 95%) 0%, hsl(216 38% 93%) 40%, hsl(218 32% 94%) 100%)"
  }}>
    {/* Diagonal band of light */}
    <div className="absolute inset-0 pointer-events-none" style={{
      background: "linear-gradient(135deg, transparent 20%, hsl(210 40% 97% / 0.8) 35%, hsl(210 50% 95% / 0.9) 50%, hsl(25 80% 95% / 0.3) 65%, transparent 80%)",
    }} />
    {/* Soft edge glow */}
    <div className="absolute inset-0 pointer-events-none" style={{
      background: "radial-gradient(ellipse 100% 50% at 0% 100%, hsl(214 40% 88% / 0.4) 0%, transparent 50%)"
    }} />
    <SampleContent />
  </section>
);

/* ── Idea 5: Subtle Caustic Mesh ── */
const Idea5 = () => (
  <section className="relative overflow-hidden" style={{
    background: "linear-gradient(168deg, hsl(214 35% 95%) 0%, hsl(216 38% 93%) 40%, hsl(218 32% 94%) 100%)"
  }}>
    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
      <defs>
        <filter id="caustic-blur">
          <feGaussianBlur stdDeviation="60" />
        </filter>
      </defs>
      <ellipse cx="25%" cy="30%" rx="300" ry="200" fill="hsl(210 60% 85% / 0.35)" filter="url(#caustic-blur)" />
      <ellipse cx="70%" cy="60%" rx="250" ry="180" fill="hsl(25 80% 88% / 0.2)" filter="url(#caustic-blur)" />
      <ellipse cx="50%" cy="20%" rx="350" ry="150" fill="hsl(210 40% 92% / 0.3)" filter="url(#caustic-blur)" />
      <ellipse cx="80%" cy="35%" rx="200" ry="250" fill="hsl(200 50% 88% / 0.25)" filter="url(#caustic-blur)" />
    </svg>
    <SampleContent />
  </section>
);

/* ── Idea 6: Layered Depth Planes ── */
const Idea6 = () => (
  <section className="relative overflow-hidden" style={{
    background: "linear-gradient(168deg, hsl(214 35% 95%) 0%, hsl(216 38% 93%) 40%, hsl(218 32% 94%) 100%)"
  }}>
    {/* Back plane */}
    <div className="absolute pointer-events-none" style={{
      top: "-10%", left: "-5%", width: "60%", height: "120%",
      background: "hsl(210 35% 93% / 0.5)",
      transform: "rotate(-3deg)",
      borderRadius: "24px",
      boxShadow: "0 4px 60px hsl(210 30% 50% / 0.04)"
    }} />
    {/* Mid plane */}
    <div className="absolute pointer-events-none" style={{
      top: "5%", right: "-8%", width: "55%", height: "110%",
      background: "hsl(25 40% 95% / 0.3)",
      transform: "rotate(2deg)",
      borderRadius: "24px",
      boxShadow: "0 4px 60px hsl(25 30% 50% / 0.03)"
    }} />
    {/* Accent line */}
    <div className="absolute pointer-events-none" style={{
      top: "15%", left: "10%", width: "45%", height: "2px",
      background: "linear-gradient(90deg, transparent, hsl(210 50% 80% / 0.3), transparent)",
    }} />
    <SampleContent />
  </section>
);

/* ── Idea 7: Top Rim Light + Vignette ── */
const Idea7 = () => (
  <section className="relative overflow-hidden" style={{
    background: "linear-gradient(168deg, hsl(214 35% 95%) 0%, hsl(216 38% 93%) 40%, hsl(218 32% 94%) 100%)"
  }}>
    {/* Top rim light */}
    <div className="absolute inset-x-0 top-0 h-32 pointer-events-none" style={{
      background: "linear-gradient(180deg, hsl(0 0% 100% / 0.8) 0%, transparent 100%)"
    }} />
    {/* Outer vignette */}
    <div className="absolute inset-0 pointer-events-none" style={{
      background: "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, hsl(214 30% 88% / 0.5) 100%)"
    }} />
    {/* Warm accent at bottom-right */}
    <div className="absolute pointer-events-none" style={{
      bottom: 0, right: 0, width: "50%", height: "50%",
      background: "radial-gradient(ellipse at 100% 100%, hsl(25 60% 90% / 0.25) 0%, transparent 60%)"
    }} />
    <SampleContent />
  </section>
);

const ideas = [
  { id: 1, title: "Soft Spotlight Cone", desc: "Radial gradient from top-center creates a focal spotlight", Component: Idea1 },
  { id: 2, title: "Frosted Glass Pane", desc: "Backdrop-blur panel behind text over subtle texture", Component: Idea2 },
  { id: 3, title: "Radial Glow Ring", desc: "Animated halo behind the mascot area", Component: Idea3 },
  { id: 4, title: "Diagonal Light Wash", desc: "Angled gradient band simulating a shaft of light", Component: Idea4 },
  { id: 5, title: "Subtle Caustic Mesh", desc: "Overlapping SVG ellipses mimicking refracted light", Component: Idea5 },
  { id: 6, title: "Layered Depth Planes", desc: "Offset rotated panels creating physical depth", Component: Idea6 },
  { id: 7, title: "Top Rim Light + Vignette", desc: "Bright top edge with soft outer vignette", Component: Idea7 },
];

const HeroBackdropTest = () => (
  <div className="bg-background min-h-screen">
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground mb-2">Hero Background Concepts</h1>
      <p className="text-muted-foreground mb-10">7 ideas — scroll to compare. All maintain a light theme.</p>
    </div>
    <div className="flex flex-col gap-16 pb-20">
      {ideas.map(({ id, title, desc, Component }) => (
        <div key={id}>
          <div className="max-w-5xl mx-auto px-4 mb-4">
            <span className="text-xs font-mono text-muted-foreground">#{id}</span>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
          <Component />
        </div>
      ))}
    </div>
  </div>
);

export default HeroBackdropTest;
