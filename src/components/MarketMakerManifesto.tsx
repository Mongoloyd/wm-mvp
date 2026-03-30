import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Home, Wrench, BarChart3, Scale, ArrowRight, ArrowDown } from "lucide-react";
import windowmanHero from "@/assets/windowman-truth.avif";

const listItems = [
  "Free Unbiased AI Analysis Of Your Quote",
  "Red Flags Explained in Plain English",
  "Fair-Market Price For Your Area",
  "A Negotiation Script For Your Situation",
  "An Introduction to a Qualified Contractor Who Will Improve Your Quote",
];

interface MarketMakerManifestoProps {
  onDemoClick?: () => void;
}

const MarketMakerManifesto = ({ onDemoClick }: MarketMakerManifestoProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 16 } as const,
    animate: inView ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.4, delay, ease: "easeOut" as const },
  });

  return (
    <section className="bg-card border-t border-border section-recessed">
      <div ref={ref} className="mx-auto max-w-5xl px-4 md:px-8 py-20 md:py-28">
        <motion.p {...fade(0)} className="text-center wm-eyebrow text-primary mb-5">
          HOW WINDOWMAN ACTUALLY WORKS
        </motion.p>
        <motion.h2
          {...fade(0.02)}
          className="text-center mx-auto wm-title-section mb-4"
          style={{ fontSize: "clamp(36px, 5vw, 48px)", maxWidth: 680, lineHeight: 1.12, color: "hsl(210 50% 8%)" }}
        >
          WE KEEP BOTH SIDES HONEST
        </motion.h2>
        <motion.p
          {...fade(0.04)}
          className="text-center mx-auto wm-body mb-14"
          style={{ fontSize: 18, maxWidth: 560, lineHeight: 1.7 }}
        >
          Most Services Profit From Information Asymmetry.
          <br />
          WindowMan Profits From Eliminating It.
        </motion.p>

        <motion.div
          {...fade(0.06)}
          className="mx-auto flex flex-col md:flex-row items-center justify-between mb-14"
          style={{ maxWidth: 800 }}
        >
          <div className="flex flex-col items-center" style={{ minWidth: 110 }}>
            <div className="flex items-center justify-center w-20 h-20 card-raised">
              <Home size={32} className="text-primary" />
            </div>
            <span className="font-body text-[15px] font-bold text-foreground mt-3">You</span>
          </div>
          <div className="flex flex-col items-center py-3 md:py-0 md:flex-1 md:px-3">
            <span className="wm-eyebrow text-primary mb-1 text-center">Quote + Intent</span>
            <ArrowRight size={32} className="text-primary hidden md:block" />
            <ArrowDown size={24} className="text-primary md:hidden" />
          </div>
          <div className="flex flex-col items-center" style={{ minWidth: 140, maxWidth: 280 }}>
            <img src={windowmanHero} alt="WindowMan superhero" className="w-full max-w-[260px] h-auto" />
            <span className="font-body text-[15px] font-bold text-foreground mt-2">WindowMan</span>
          </div>
          <div className="flex flex-col items-center py-3 md:py-0 md:flex-1 md:px-3">
            <span className="wm-eyebrow text-primary mb-1 text-center">Warm Lead + Intel</span>
            <ArrowRight size={32} className="text-primary hidden md:block" />
            <ArrowDown size={24} className="text-primary md:hidden" />
          </div>
          <div className="flex flex-col items-center" style={{ minWidth: 110 }}>
            <div className="flex items-center justify-center w-20 h-20 card-raised">
              <Wrench size={32} className="text-primary" />
            </div>
            <span className="font-body text-[15px] font-bold text-foreground mt-3">The Contractor</span>
          </div>
        </motion.div>

        <motion.div {...fade(0.1)} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: <span className="mr-2">✅</span>,
              title: "What Do You Get — Free",
              borderColor: "border-primary/20",
              content: listItems.map((item, i) => (
                <div
                  key={i}
                  className="flex gap-2 items-start font-body text-[13px] text-muted-foreground leading-[2.0]"
                >
                  <span className="text-primary flex-shrink-0">→</span>
                  <span>{item}</span>
                </div>
              )),
            },
            {
              icon: <Scale size={16} className="text-gold" strokeWidth={2.5} />,
              title: "​So How Do I Make Money",
              borderColor: "border-gold/20",
              content: (
                <p className="font-body text-[13px] text-muted-foreground leading-[1.9] mt-3">
                  WindowMan earns a percentage of the sale — only when you choose to work with one of our contractors
                  and your project is completed. We never charge homeowners.
                </p>
              ),
            },
            {
              icon: <BarChart3 size={16} className="text-primary" strokeWidth={2.5} />,
              title: "Why Work With Me",
              borderColor: "border-primary/20",
              content: (
                <p className="font-body text-[13px] text-muted-foreground leading-[1.9] mt-3">
                  Every homeowner we introduce already understands fair-market pricing. Our contractors walk into
                  conversations that are already halfway won.
                </p>
              ),
            },
          ].map((card, i) => (
            <div key={i} className={`card-raised p-7 border ${card.borderColor}`}>
              <div className="flex items-center gap-2.5 mb-3.5">
                <div
                  className={`flex items-center justify-center w-9 h-9 border ${card.borderColor} bg-card`}
                  style={{ borderRadius: "var(--radius-btn)" }}
                >
                  {card.icon}
                </div>
                <span className="font-body text-base font-bold text-foreground">{card.title}</span>
              </div>
              <div className="mt-3">{card.content}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default MarketMakerManifesto;
