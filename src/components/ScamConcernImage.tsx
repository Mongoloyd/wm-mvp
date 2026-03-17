import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import homeownerImg from "@/assets/scam-concern.avif";

const ScamConcernImage = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <section ref={ref} className="w-full py-8 md:py-12 px-4 flex justify-center bg-background">
      <motion.figure initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: "easeOut" }} className="w-full max-w-4xl">
        <img src={homeownerImg} alt="Homeowner wondering if contractor quote is fair while being pitched by a window salesman" loading="lazy" decoding="async" fetchPriority="low" width={1024} height={576} className="w-full h-auto rounded-lg" style={{ aspectRatio: "16 / 9", objectFit: "cover" }} />
        <figcaption className="mt-3 text-center">
          <button onClick={() => { const target = document.getElementById("market-baseline") || document.getElementById("truth-gate"); target?.scrollIntoView({ behavior: "smooth" }); }} className="text-sm text-cyan hover:text-cyan/80 transition-colors cursor-pointer font-extrabold md:text-xl" style={{ fontFamily: "'Jost', sans-serif" }}>
            Don't Sign Until You've Got Your Free WindowMan AI Truth Report →
          </button>
        </figcaption>
      </motion.figure>
    </section>
  );
};

export default ScamConcernImage;
