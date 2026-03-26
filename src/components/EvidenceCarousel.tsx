import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import EvidenceImage from "./EvidenceImage";

interface Slide { image: string; caption: string; alt: string; }
interface EvidenceCarouselProps { slides: Slide[]; inView: boolean; onImageClick: (index: number) => void; }

const EvidenceCarousel = ({ slides, inView, onImageClick }: EvidenceCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const onSelect = useCallback(() => { if (!emblaApi) return; setSelectedIndex(emblaApi.selectedScrollSnap()); }, [emblaApi]);
  useEffect(() => { if (!emblaApi) return; onSelect(); emblaApi.on("select", onSelect); return () => { emblaApi.off("select", onSelect); }; }, [emblaApi, onSelect]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => { if (e.key === "ArrowLeft") { e.preventDefault(); emblaApi?.scrollPrev(); } if (e.key === "ArrowRight") { e.preventDefault(); emblaApi?.scrollNext(); } }, [emblaApi]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.5, delay: 0.2 }} className="md:hidden mb-10">
      <div ref={emblaRef} className="overflow-hidden rounded-xl" role="region" aria-roledescription="carousel" aria-label="Evidence documents" onKeyDown={handleKeyDown} tabIndex={0}>
        <div className="flex">
          {slides.map((slide, i) => (
            <div key={i} className="min-w-0 shrink-0 grow-0 basis-full relative" role="group" aria-roledescription="slide" aria-label={`Slide ${i + 1} of ${slides.length}`}>
              <div className="relative" style={{ zIndex: 0 }}><EvidenceImage src={slide.image} alt={slide.alt} className="rounded-xl" onClick={() => onImageClick(i)} /></div>
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent rounded-b-xl pointer-events-none" style={{ zIndex: 10 }} />
              <p className="absolute bottom-3 left-3 right-3 text-white font-body text-[13px]" style={{ zIndex: 20, textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>{slide.caption}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-2 mt-3" role="tablist" aria-label="Slide navigation">
        {slides.map((_, i) => <button key={i} role="tab" aria-selected={selectedIndex === i} aria-label={`Go to slide ${i + 1} of ${slides.length}`} onClick={() => scrollTo(i)} className="rounded-full transition-all duration-200 border-none cursor-pointer" style={{ width: selectedIndex === i ? 20 : 8, height: 8, backgroundColor: selectedIndex === i ? "hsl(var(--primary))" : "hsl(var(--border))" }} />)}
      </div>
    </motion.div>
  );
};

export default EvidenceCarousel;
