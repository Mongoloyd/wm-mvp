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
      <div ref={ref} className="mx-auto max-w-5xl px-4 md:px-8 py-20 md:py-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15 }} className="text-center">
          <div className="mx-auto mb-6" style={{ width: 40, height: 1, backgroundColor: "#2563EB" }} />
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#2563EB", letterSpacing: "0.1em", marginBottom: 20 }}>
            HERE'S WHAT NO CONTRACTOR WILL TELL YOU BEFORE YOU SIGN.
          </p>
          <h2 className="mx-auto" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(34px, 5vw, 48px)", color: "#E5E5E5", fontWeight: 800, letterSpacing: "0.01em", maxWidth: 700, marginBottom: 16, lineHeight: 1.15, textTransform: "uppercase" }}>
            THE IMPACT WINDOW INDUSTRY HAS NO PRICING STANDARD.
          </h2>
          <p className="mx-auto" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: "#E5E7EB", maxWidth: 640, lineHeight: 1.75, marginBottom: 60 }}>
            That means the contractor who wrote your quote decided what to include, how to describe it, and whether to specify the brand.
          </p>
        </motion.div>

        <EvidenceCarousel slides={blocks.map((b) => ({ image: b.image, caption: b.caption, alt: b.alt }))} inView={inView} onImageClick={(i) => setLightboxIndex(i)} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blocks.map((block, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: i * 0.05 }}>
              <div className="hidden md:block mb-4">
                <EvidenceImage src={block.image} alt={block.alt} onClick={() => setLightboxIndex(i)} />
              </div>
              <div className="flex items-center justify-center" style={{ width: 48, height: 48, backgroundColor: "rgba(37,99,235,0.1)" }}>
                <span style={{ fontSize: 24, lineHeight: 1 }}>{block.icon}</span>
              </div>
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: "#E5E5E5", marginTop: 16, textTransform: "uppercase", letterSpacing: "0.02em" }}>{block.heading}</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#E5E7EB", lineHeight: 1.7, marginTop: 8 }}>{block.copy}</p>
              <span style={{ display: "inline-block", marginTop: 12, background: "rgba(249,115,22,0.1)", color: block.badgeColor, padding: "3px 10px", fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, border: `1px solid ${block.badgeColor}33` }}>{block.badge}</span>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.15, delay: 0.2 }} className="text-center mt-16" style={{ backgroundColor: "#111111", border: "1px solid #1A1A1A", padding: "clamp(40px, 5vw, 48px) clamp(32px, 5vw, 56px)" }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(22px, 3vw, 30px)", color: "#E5E5E5", fontWeight: 700, letterSpacing: "0.01em", marginBottom: 16, textTransform: "uppercase" }}>
            MOST HOMEOWNERS ASSUME THE QUOTE REFLECTS THE MARKET RATE.
          </p>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(22px, 3vw, 30px)", color: "#F97316", fontWeight: 900, letterSpacing: "0.01em", textTransform: "uppercase" }}>
            IT USUALLY DOESN'T.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-12">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleScanClick}
            style={{ background: "#2563EB", color: "#FFFFFF", fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, padding: "16px 32px", border: "none", boxShadow: "0 4px 24px rgba(37,99,235,0.35)", cursor: "pointer" }}>
            Scan My Quote — It's Free
          </motion.button>
          {onDemoClick && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onDemoClick}
              style={{ background: "transparent", color: "#2563EB", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: "12px 28px", border: "1px solid rgba(37,99,235,0.3)", cursor: "pointer" }}>
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
