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
    copy: "Permit Costs, Debris Removal, and Installation Method Often Aren't Line-Itemed.",
    badge: "Creates Negotiation Leverage When Caught",
    badgeColor: "#2563EB",
    image: excludesLaborImg,
    caption: "Good vs. Bad — Can You Tell?",
    alt: "Comparison of a Good and Bad Impact Window Notice of Acceptance letter",
  },
  {
    icon: "⚠️",
    heading: "Vague Warranty Language",
    copy: "A Warranty That Says '1 Year Labor' Protects The Contractor, Not You.",
    badge: "Found in 61% of Quotes we Analyze",
    badgeColor: "#F97316",
    image: forensicReportImg,
    caption: "What Our Forensic Scanner Finds",
    alt: "AI Forensic Analysis Report Highlighting Hidden Window Warranty Flaws",
  },
  {
    icon: "📝",
    heading: "Unspecified Brands",
    copy: "When No Brand is Named in Your Contract, Your Contractor Can Legally Install Any Window At Any Quality Level — While Charging Premium Prices.",
    badge: "Most Common Red Flag We Find",
    badgeColor: "#F97316",
    image: hiddenContractImg,
    caption: "What Fine Print Really Looks Like",
    alt: "Close-Up Of Confusing Window Contract Fine Print",
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
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-5">
            HERE'S WHAT NO CONTRACTOR WILL TELL YOU BEFORE YOU SIGN.
          </p>
          <h2
            className="font-display text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-foreground mb-4 mx-auto"
            style={{ maxWidth: 700 }}
          >
            THE IMPACT WINDOW INDUSTRY HAS NO PRICING STANDARD.
          </h2>
          <p
            className="text-base md:text-lg leading-relaxed text-foreground/80 mx-auto mb-14"
            style={{ maxWidth: 640 }}
          >
            That Means The Contractor Who Wrote Your Quote Decided What to Include, How to dDescribe It, and Whether To
            Specify The Brand.
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
              <h3 className="font-display text-xl font-bold text-foreground mt-4 uppercase tracking-tight">
                {block.heading}
              </h3>
              <p className="text-sm leading-relaxed text-foreground/80 mt-2">{block.copy}</p>
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
