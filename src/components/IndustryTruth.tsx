import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import hiddenContractImg from "@/assets/hidden-contract-terms.avif";
import forensicReportImg from "@/assets/forensic-analysis-report.avif";
import noaLetterImg from "@/assets/noa-letter.avif";
import EvidenceImage from "./EvidenceImage";
import EvidenceCarousel from "./EvidenceCarousel";
import EvidenceLightbox from "./EvidenceLightbox";

const blocks = [
  { iconBg: "#E8F7FB", icon: "📄", iconColor: "#0099BB", heading: "Unspecified Brands", copy: "When no brand is named in your contract, your contractor can legally install any window at any quality level — while charging premium prices.", badge: "Most common red flag we find", badgeBg: "#FEF2F2", badgeColor: "#DC2626", image: hiddenContractImg, caption: "What fine print really looks like", alt: "Close-up of confusing window contract fine print" },
  { iconBg: "#FEF2F2", icon: "⚠", iconColor: "#DC2626", heading: "Vague Warranty Language", copy: "A warranty that says '1 year labor' protects the contractor, not you.", badge: "Found in 61% of quotes we analyze", badgeBg: "#FDF3E3", badgeColor: "#C8952A", image: forensicReportImg, caption: "What our forensic scanner finds", alt: "AI forensic analysis report highlighting hidden window warranty flaws" },
  { iconBg: "#ECFDF5", icon: "$", iconColor: "#059669", heading: "Hidden Fee Structure", copy: "Permit costs, debris removal, and installation method often aren't line-itemed.", badge: "Creates negotiation leverage when caught", badgeBg: "#ECFDF5", badgeColor: "#059669", image: noaLetterImg, caption: "Good vs. bad — can you tell?", alt: "Comparison of a good and bad impact window Notice of Acceptance letter" },
];

interface IndustryTruthProps { onScanClick?: () => void; onDemoClick?: () => void; }

const IndustryTruth = ({ onScanClick, onDemoClick }: IndustryTruthProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handleScanClick = () => { onScanClick ? onScanClick() : document.getElementById("truth-gate")?.scrollIntoView({ behavior: "smooth" }); };

  return (
    <section style={{ backgroundColor: "#FFFFFF" }}>
      <div ref={ref} className="mx-auto max-w-5xl px-4 md:px-8 py-20 md:py-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-center">
          <div className="mx-auto mb-6" style={{ width: 40, height: 2, backgroundColor: "#C8952A" }} />
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#0099BB", letterSpacing: "0.1em", marginBottom: 20 }}>HERE'S WHAT NO CONTRACTOR WILL TELL YOU BEFORE YOU SIGN.</p>
          <h2 className="mx-auto" style={{ fontFamily: "'Jost', sans-serif", fontSize: "clamp(34px, 5vw, 44px)", color: "#0F1F35", fontWeight: 800, letterSpacing: "-0.02em", maxWidth: 700, marginBottom: 16, lineHeight: 1.2 }}>The Impact Window Industry Has No Pricing Standard.</h2>
          <p className="mx-auto" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: "#374151", maxWidth: 640, lineHeight: 1.75, marginBottom: 60 }}>That means the contractor who wrote your quote decided what to include, how to describe it, and whether to specify the brand.</p>
        </motion.div>
        <EvidenceCarousel slides={blocks.map((b) => ({ image: b.image, caption: b.caption, alt: b.alt }))} inView={inView} onImageClick={(i) => setLightboxIndex(i)} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blocks.map((block, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.45, delay: i * 0.15 }}>
              <div className="hidden md:block mb-4"><EvidenceImage src={block.image} alt={block.alt} onClick={() => setLightboxIndex(i)} /></div>
              <div className="flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: block.iconBg }}><span style={{ fontSize: 24, color: block.iconColor, lineHeight: 1 }}>{block.icon}</span></div>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, color: "#0F1F35", marginTop: 16 }}>{block.heading}</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#374151", lineHeight: 1.7, marginTop: 8 }}>{block.copy}</p>
              <span style={{ display: "inline-block", marginTop: 12, background: block.badgeBg, color: block.badgeColor, borderRadius: 999, padding: "3px 10px", fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600 }}>{block.badge}</span>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.5 }} className="text-center mt-16" style={{ backgroundColor: "#0F1F35", borderRadius: 16, padding: "clamp(40px, 5vw, 48px) clamp(32px, 5vw, 56px)" }}>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "clamp(22px, 3vw, 28px)", color: "#F3F4F6", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 16 }}>Most Homeowners Assume the Quote Reflects The Market Rate.</p>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "clamp(22px, 3vw, 28px)", color: "#C8952A", fontWeight: 800, letterSpacing: "-0.02em" }}>It usually doesn't.</p>
        </motion.div>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-12">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleScanClick} style={{ background: "#C8952A", color: "#FFFFFF", fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, padding: "16px 32px", borderRadius: 10, border: "none", boxShadow: "0 4px 14px rgba(200, 149, 42, 0.35)", cursor: "pointer" }}>Scan My Quote — It's Free</motion.button>
          {onDemoClick && (<motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onDemoClick} style={{ background: "transparent", color: "#0891B2", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: "12px 28px", borderRadius: 10, border: "2px solid #0891B2", cursor: "pointer" }}>See the AI in Action — No Upload Needed</motion.button>)}
        </div>
      </div>
      <EvidenceLightbox open={lightboxIndex !== null} onOpenChange={(open) => !open && setLightboxIndex(null)} images={blocks.map((b) => ({ src: b.image, alt: b.alt }))} currentIndex={lightboxIndex ?? 0} onIndexChange={setLightboxIndex} />
    </section>
  );
};

export default IndustryTruth;
