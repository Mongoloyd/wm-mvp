import { useState, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import homeownerImg from "@/assets/what-are-you-missing.avif";
import scamImg from "@/assets/scam-concern.avif";
import reportSalesmanImg from "@/assets/windowman_report_and_salesman.avif";
import cellphonesImg from "@/assets/cellphones.avif";
import windowScanImg from "@/assets/window-scan.avif";
import reportSalesman2Img from "@/assets/windowman-report-salesman.avif";

const forensicImages = [homeownerImg, scamImg, reportSalesmanImg, cellphonesImg, windowScanImg, reportSalesman2Img];

const CtaButton = memo(() => (
  <figcaption className="mt-3 text-center">
    <button
      onClick={() => {
        const target = document.getElementById("market-baseline") || document.getElementById("truth-gate");
        target?.scrollIntoView({ behavior: "smooth" });
      }}
      className="font-display text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer font-extrabold md:text-xl"
    >
      Don't Sign Until You've Got Your Free WindowMan AI Truth Report →
    </button>
  </figcaption>
));
CtaButton.displayName = "CtaButton";

const ScamConcernImage = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((p) => (p + 1) % forensicImages.length), 5500);
    return () => clearInterval(t);
  }, []);

  return (
    <section ref={ref} className="w-full py-8 md:py-12 px-4 flex justify-center">
      <motion.figure
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-5xl"
      >
        <div
          className="relative overflow-hidden aspect-[4/3] md:aspect-video"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={idx}
              src={forensicImages[idx]}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.8, ease: "circOut" }}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
              decoding="async"
              width={768}
              height={512}
              alt="WindowMan Forensic Audit showing what is missing from a standard window quote"
            />
          </AnimatePresence>
          {/* Preload next image */}
          <img
            src={forensicImages[(idx + 1) % forensicImages.length]}
            className="hidden"
            alt=""
          />
        </div>
        <CtaButton />
      </motion.figure>
    </section>
  );
};

export default ScamConcernImage;
