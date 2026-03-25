import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import hiddenContractImg from "@/assets/hidden-contract-terms.avif";
import forensicReportImg from "@/assets/forensic-analysis-report.avif";
import excludesLaborImg from "@/assets/excludes-labor.avif";
import EvidenceImage from "./EvidenceImage";
import EvidenceCarousel from "./EvidenceCarousel";
import EvidenceLightbox from "./EvidenceLightbox";

const blocks = [
  { icon: "📄", heading: "Unspecified Brands", copy: "When no brand is named in your contract, your contractor can legally install any window at any quality level — while charging premium prices.", badge: "Most common red flag we find", badgeColor: "#F97316", image: hiddenContractImg, caption: "What fine print really looks like", alt: "Close-up of confusing window contract fine print" },
  { icon: "⚠", heading: "Vague Warranty Language", copy: "A warranty that says '1 year labor' protects the contractor, not you.", badge: "Found in 61% of quotes we analyze", badgeColor: "#F97316", image: forensicReportImg, caption: "What our forensic scanner finds", alt: "AI forensic analysis report highlighting hidden window warranty flaws" },
  { icon: "$", heading: "Hidden Fee Structure", copy: "Permit costs, debris removal, and installation method often aren't line-itemed.", badge: "Creates negotiation leverage when caught", badgeColor: "#2563EB", image: excludesLaborImg, caption: "Good vs. bad — can you tell?", alt: "Comparison of a good and bad impact window Notice of Acceptance letter" },
];

interface IndustryTruthProps { onScanClick?: () => void; onDemoClick?: () => void; }

const IndustryTruth = ({ onScanClick, onDemoClick }: IndustryTruthProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const handleScanClick = () => { onScanClick ? onScanClick() : document.getElementById("truth-gate")?.scrollIntoView({ behavior: "smooth" }); };

  return (
    <section style={{ backgroundColor: "#0A0A0A" }}>
      <div ref={ref} className="mx-auto max-w-5xl px-4 md:px-8 py-24 md:py-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="text-center">
          <div className="mx-auto mb-8" style={{ width: 50, height: 2, background: "linear-gradient(90deg, transparent, #2563EB, transparent)" }} />
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#2563EB", letterSpacing: "0.12em", marginBottom: 24, fontWeight: 700 }}>
            HERE'S WHAT NO CONTRACTOR WILL TELL YOU BEFORE YOU SIGN.
          </p>
          <h2 className="mx-auto" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(36px, 5.5vw, 54px)", color: "#FFFFFF", fontWeight: 800, letterSpacing: "-0.01em", maxWidth: 700, marginBottom: 20, lineHeight: 1.1, textTransform: "uppercase" }}>
            THE IMPACT WINDOW INDUSTRY HAS NO PRICING STANDARD.
          </h2>
          <p className="mx-auto" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "rgba(229,231,235,0.85)", maxWidth: 640, lineHeight: 1.7, marginBottom: 64 }}>
            That means the contractor who wrote your quote decided what to include, how to describe it, and whether to specify the brand.
          </p>
        </motion.div>

        <EvidenceCarousel slides={blocks.map((b) => ({ image: b.image, caption: b.caption, alt: b.alt }))} inView={inView} onImageClick={(i) => setLightboxIndex(i)} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blocks.map((block, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.3, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}>
              <div className="hidden md:block mb-5">
                <EvidenceImage src={block.image} alt={block.alt} onClick={() => setLightboxIndex(i)} />
              </div>
              <div className="flex items-center justify-center" style={{ width: 52, height: 52, backgroundColor: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.2)" }}>
                <span style={{ fontSize: 26, lineHeight: 1 }}>{block.icon}</span>
              </div>
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#FFFFFF", marginTop: 18, textTransform: "uppercase", letterSpacing: "0.01em" }}>{block.heading}</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "rgba(229,231,235,0.85)", lineHeight: 1.7, marginTop: 10 }}>{block.copy}</p>
              <span style={{ display: "inline-block", marginTop: 14, background: "rgba(249,115,22,0.12)", color: block.badgeColor, padding: "4px 12px", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, border: `1px solid ${block.badgeColor}40` }}>{block.badge}</span>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.3, delay: 0.25, ease: [0.16, 1, 0.3, 1] }} className="text-center mt-20" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "clamp(44px, 5vw, 52px) clamp(36px, 5vw, 60px)", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(24px, 3vw, 32px)", color: "#FFFFFF", fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 18, textTransform: "uppercase" }}>
            MOST HOMEOWNERS ASSUME THE QUOTE REFLECTS THE MARKET RATE.
          </p>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(24px, 3vw, 32px)", color: "#F97316", fontWeight: 900, letterSpacing: "-0.01em", textTransform: "uppercase", textShadow: "0 2px 20px rgba(249,115,22,0.3)" }}>
            IT USUALLY DOESN'T.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-14">
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98, y: 0 }}
            onClick={handleScanClick}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{
              background: "#2563EB",
              color: "#FFFFFF",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 16,
              fontWeight: 700,
              padding: "16px 36px",
              border: "none",
              boxShadow: "0 4px 24px rgba(37,99,235,0.4), 0 2px 8px rgba(0,0,0,0.3)",
              cursor: "pointer",
            }}
            className="hover:shadow-[0_6px_32px_rgba(37,99,235,0.5),0_2px_12px_rgba(0,0,0,0.4)] transition-shadow"
          >
            Scan My Quote — It's Free
          </motion.button>
          {onDemoClick && (
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98, y: 0 }}
              onClick={onDemoClick}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{
                background: "transparent",
                color: "#2563EB",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                padding: "14px 32px",
                border: "1px solid rgba(37,99,235,0.35)",
                cursor: "pointer",
              }}
              className="hover:shadow-[0_4px_20px_rgba(37,99,235,0.15)] hover:border-[rgba(37,99,235,0.5)] transition-all"
            >
              See the AI in Action — No Upload Needed
            </motion.button>
          )}
        </div>
      </div>
      <EvidenceLightbox open={lightboxIndex !== null} onOpenChange={(open) => !open && setLightboxIndex(null)} images={blocks.map((b) => ({ src: b.image, alt: b.alt }))} currentIndex={lightboxIndex ?? 0} onIndexChange={setLightboxIndex} />
    </section>
  );
};

export default IndustryTruth;
