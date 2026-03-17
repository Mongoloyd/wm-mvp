import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface EvidenceLightboxProps { open: boolean; onOpenChange: (open: boolean) => void; images: Array<{ src: string; alt: string }>; currentIndex: number; onIndexChange: (index: number) => void; }

const EvidenceLightbox = ({ open, onOpenChange, images = [], currentIndex, onIndexChange }: EvidenceLightboxProps) => {
  const count = images.length;
  const goNext = useCallback(() => { if (count === 0) return; onIndexChange((currentIndex + 1) % count); }, [currentIndex, count, onIndexChange]);
  const goPrev = useCallback(() => { if (count === 0) return; onIndexChange((currentIndex - 1 + count) % count); }, [currentIndex, count, onIndexChange]);
  useEffect(() => { if (!open) return; const handler = (e: KeyboardEvent) => { if (e.key === "ArrowRight") goNext(); else if (e.key === "ArrowLeft") goPrev(); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [open, goNext, goPrev]);
  useEffect(() => { if (!open || count < 2) return; const next = (currentIndex + 1) % count; const prev = (currentIndex - 1 + count) % count; [next, prev].forEach((i) => { const img = new Image(); img.src = images[i].src; }); }, [open, currentIndex, count, images]);
  if (count === 0) return null;
  const current = images[currentIndex] ?? images[0];
  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] p-2 sm:p-4 bg-black/95 border-none" aria-label="Evidence image gallery">
        <DialogTitle className="sr-only">{current.alt}</DialogTitle>
        <DialogDescription className="sr-only">Full-size view of evidence document. Use arrows to navigate.</DialogDescription>
        <div className="relative select-none">
          <button onClick={goPrev} className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 items-center justify-center bg-black/20 hover:bg-black/50 text-white p-3 rounded-full transition-colors" aria-label="Previous image"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={goNext} className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 items-center justify-center bg-black/20 hover:bg-black/50 text-white p-3 rounded-full transition-colors" aria-label="Next image"><ChevronRight className="h-5 w-5" /></button>
          <AnimatePresence mode="wait">
            <motion.img key={currentIndex} src={current.src} alt={current.alt} className="w-full h-auto rounded-md object-contain max-h-[85vh]" decoding="async" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.2 }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.3} onDragEnd={(_, info) => { if (info.offset.x < -50) goNext(); else if (info.offset.x > 50) goPrev(); }} />
          </AnimatePresence>
        </div>
        <p className="text-white/70 text-sm font-mono mt-2 text-center">{currentIndex + 1} / {count}</p>
      </DialogContent>
    </Dialog>
  );
};

export default EvidenceLightbox;
