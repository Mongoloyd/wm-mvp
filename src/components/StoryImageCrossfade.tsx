import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const storyImages = [
  "/images/papers.webp",              // The messy quote
  "/images/estimate-confusion.webp",  // The fine print headache
  "/images/theatrics-extraction.webp",// The AI engine scanning
  "/images/dashboard-analysis.webp",  // The forensic breakdown
  "/images/windowman-character_f4f72bf0.png", // WindowMan protection
  "/images/dashboard-reveal-bg.webp", // The final Truth Report
];

export const StoryImageCrossfade = ({ className }: { className?: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % storyImages.length);
    }, 3500); // 3.5 second interval

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={cn("relative w-full h-[300px] md:h-[450px] rounded-2xl overflow-hidden bg-secondary/10 border border-border/40 shadow-2xl", className)}>
      <AnimatePresence initial={false}>
        <motion.img
          key={currentIndex}
          src={storyImages[currentIndex]}
          alt="WindowMan Forensic Story"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
      </AnimatePresence>
      
      {/* Subtle overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
    </div>
  );
};
