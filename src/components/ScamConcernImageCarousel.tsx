import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import scamConcernImg from "@/assets/scam-concern.avif";
import noaLetterImg from "@/assets/noa-letter.avif";
import windowmanTruthImg from "@/assets/windowman-truth.avif";
import handScannerImg from "@/assets/hand-scanner-hero.webp";

// Image configuration with alt text
const images = [
  {
    src: scamConcernImg,
    alt: "Homeowner wondering if contractor quote is fair while being pitched by a window salesman"
  },
  {
    src: noaLetterImg,
    alt: "NOA letter document showing product approval certification for impact windows"
  },
  {
    src: windowmanTruthImg,
    alt: "WindowMan AI analyzing quote documents to reveal hidden issues and pricing concerns"
  },
  {
    src: handScannerImg,
    alt: "Hand holding smartphone scanning window quote with WindowMan AI technology"
  }
];

const ScamConcernImageCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start the carousel interval
    intervalRef.current = setInterval(() => {
      setIsTransitioning(true);

      // Wait for blur transition to complete before changing image
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setIsTransitioning(false);
      }, 250); // Half of the 0.5s transition for blur out

    }, 3500); // 3.5 seconds per image

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <section className="w-full py-8 md:py-12 px-4 flex justify-center bg-background">
      <motion.figure
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-4xl"
      >
        <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
          <AnimatePresence mode="wait">
            <motion.img
              key={currentIndex}
              src={images[currentIndex].src}
              alt={images[currentIndex].alt}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              width={1024}
              height={576}
              className="w-full h-full object-cover"
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{
                opacity: isTransitioning ? 0 : 1,
                filter: isTransitioning ? "blur(10px)" : "blur(0px)"
              }}
              exit={{ opacity: 0, filter: "blur(10px)" }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </AnimatePresence>

          {/* Dot indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                  }
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setCurrentIndex(index);
                    setIsTransitioning(false);
                  }, 250);

                  // Restart the interval
                  intervalRef.current = setInterval(() => {
                    setIsTransitioning(true);
                    setTimeout(() => {
                      setCurrentIndex((prev) => (prev + 1) % images.length);
                      setIsTransitioning(false);
                    }, 250);
                  }, 3500);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-cyan w-8"
                    : "bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <figcaption className="mt-3 text-center">
          <button
            onClick={() => {
              const target =
                document.getElementById("market-baseline") ||
                document.getElementById("truth-gate");
              target?.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-sm text-cyan hover:text-cyan/80 transition-colors cursor-pointer font-extrabold md:text-xl"
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            Don't Sign Until You've Got Your Free WindowMan AI Truth Report →
          </button>
        </figcaption>
      </motion.figure>
    </section>
  );
};

export default ScamConcernImageCarousel;
