import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import hiddenContractImg from "@/assets/hidden-contract-terms.avif";
import forensicReportImg from "@/assets/forensic-analysis-report.avif";
import excludesLaborImg from "@/assets/excludes-labor.avif";
import EvidenceImage from "./EvidenceImage";
import EvidenceCarousel from "./EvidenceCarousel";
import EvidenceLightbox from "./EvidenceLightbox";

const blocks = [
  {
    icon: "💰",
    heading: "Hidden Fee Structure",
    copy: "Permit costs, debris removal, and installation method often aren't line-itemed.",
    badge: "Creates negotiation leverage when caught",
    badgeColor: "#2563EB",
    image: excludesLaborImg,
    caption: "Good vs. bad — can you tell?",
    alt: "Comparison of a good and bad impact window Notice of Acceptance letter",
  },
  {
    icon: "⚠️",
    heading: "Vague Warranty Language",
    copy: "A warranty that says '1 year labor' protects the contractor, not you.",
    badge: "Found in 61% of quotes we analyze",
    badgeColor: "#F97316",
    image: forensicReportImg,
    caption: "What our forensic scanner finds",
    alt: "AI forensic analysis report highlighting hidden window warranty flaws",
  },
  {
    icon: "📝",
    heading: "Unspecified Brands",
    copy: "When no brand is named in your contract, your contractor can legally install any window at any quality level — while charging premium prices.",
    badge: "Most common red flag we find",
    badgeColor: "#F97316",
    image: hiddenContractImg,
    caption: "What fine print really looks like",
    alt: "Close-up of confusing window contract fine print",
  },
];

interface IndustryTruthProps {
  onScanClick?: () => void;
  onDemoClick?: () => void;
}

const IndustryTruth = ({ onScanClick, onDemoClick }: IndustryTruthProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const handleScanClick = () => {
    if (onScanClick) {
      onScanClick();
    } else {
      document.getElementById("truth-gate")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="bg-transparent">
      <div ref={ref} className="mx-auto max-w-5xl px-4 md:px-8 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-center"
        >
          <div className="mx-auto mb-6 w-10 h-px bg-primary" />
          <p className="wm-eyebrow text-primary mb-5">HERE'S WHAT NO CONTRACTOR WILL TELL YOU BEFORE YOU SIGN.</p>
          <h2
            className="text-3xl font-extrabold text-foreground tracking-tight mb-4 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] mx-auto"
            style={{ maxWidth: 700 }}
          >
            THE IMPACT WINDOW INDUSTRY HAS NO PRICING STANDARD.
          </h2>
          <p className="wm-body mx-auto mb-14" style={{ fontSize: 17, maxWidth: 640, lineHeight: 1.75 }}>
            That means the contractor who wrote your quote decided what to include, how to describe it, and whether to
            specify the brand.
          </p>
        </motion.div>

        <EvidenceCarousel
          slides={blocks.map((b) => ({ image: b.image, caption: b.caption, alt: b.alt }))}
          inView={inView}
          onImageClick={(i) => setLightboxIndex(i)}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blocks.map((block, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08, ease: "easeOut" }}
            >
              <div className="hidden md:block mb-4">
                <EvidenceImage src={block.image} alt={block.alt} onClick={() => setLightboxIndex(i)} />
              </div>
              <div className="flex items-center justify-center w-12 h-12 card-raised">
                <span className="text-2xl leading-none">{block.icon}</span>
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mt-4 uppercase tracking-[0.02em]">
                {block.heading}
              </h3>
              <p className="wm-body mt-2">{block.copy}</p>
              <span
                className={`inline-block mt-3 px-2.5 py-0.5 font-body text-[11px] font-semibold ${block.badgeColor === "#2563EB" ? "text-primary bg-primary/10 border border-primary/20" : "text-destructive bg-destructive/10 border border-destructive/20"}`}
                style={{ borderRadius: "var(--radius-input)" }}
              >
                {block.badge}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.15, delay: 0.2 }}
          className="text-center mt-16 card-raised p-7 md:p-8"
        >
          <p
            className="font-display text-foreground tracking-[0.01em] uppercase mb-4 opacity-75 font-extrabold text-2xl"
            style={{ fontSize: "clamp(22px, 3vw, 30px)" }}
          >
            MOST HOMEOWNERS ASSUME THE QUOTE REFLECTS THE MARKET RATE.
          </p>
          <p
            className="font-display text-destructive tracking-[0.01em] uppercase font-semibold text-4xl"
            style={{ fontSize: "clamp(22px, 3vw, 30px)" }}
          >
            IT USUALLY DOESN'T.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8">
          <button onClick={handleScanClick} className="btn-depth-primary" style={{ padding: "16px 32px" }}>
            Scan My Quote — It's Free
          </button>
          {onDemoClick && (
            <button onClick={onDemoClick} className="btn-depth-destructive" style={{ padding: "12px 24px" }}>
              See the AI in Action — No Upload Needed
            </button>
          )}
        </div>
      </div>
      <EvidenceLightbox
        open={lightboxIndex !== null}
        onOpenChange={(open) => !open && setLightboxIndex(null)}
        images={blocks.map((b) => ({ src: b.image, alt: b.alt }))}
        currentIndex={lightboxIndex ?? 0}
        onIndexChange={setLightboxIndex}
      />
    </section>
  );
};

export default IndustryTruth;
