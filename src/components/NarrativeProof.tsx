import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Star } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface Review {
  id: number;
  name: string;
  location: string;
  platform: string;
  stars: number;
  headline: string;
  body: string;
  savings: string;
}

const reviews: Review[] = [
  { id: 1, name: "Maria G.", location: "Miami, FL", platform: "Google Review", stars: 5, headline: "The scan showed me exactly what to say before I booked a second quote.", body: "WindowMan's Truth Report broke down every red flag in my estimate—junk fees, missing specs, inflated line items. I walked into my next appointment armed with facts and saved over $12k.", savings: "Saved $12,400 vs. first quote" },
  { id: 2, name: "Darren P.", location: "Tampa, FL", platform: "Facebook Review", stars: 5, headline: "Uploaded my quote, got every trap highlighted in minutes.", body: "I uploaded a PDF and the scan flagged junk fees and unnecessary line items immediately. The Truth Report showed me the real price range and what I should actually be paying per opening.", savings: "Saved $8,200 vs. competitor quote" },
  { id: 3, name: "Lauren & James K.", location: "Orlando, FL", platform: "Nextdoor Review", stars: 5, headline: "We showed the report to our salesman and the price dropped on the spot.", body: "We shared the WindowMan breakdown with the next contractor. Using the bullet points from the Truth Report, we got the price dropped without any confrontation. It was almost too easy.", savings: "Saved $5,150 vs. original offer" },
  { id: 4, name: "Anthony R.", location: "Fort Lauderdale, FL", platform: "Google Review", stars: 5, headline: "The scan told me my quote was actually fair. No pressure, just facts.", body: "WindowMan confirmed my quote was in range, suggested small tweaks, and didn't try to push anything. That honest grade made me trust the process—it's a neutral second opinion, not a sales pitch.", savings: "Confirmed quote within fair range" },
  { id: 5, name: "Janet L.", location: "Sarasota, FL", platform: "Facebook Review", stars: 5, headline: "Found thousands in junk 'administrative' fees buried in my estimate.", body: "The Truth Report pointed out BS charges, overpriced add-ons, and scare-tactic line items I never would have caught. I went back and forced the contractor to remove them all.", savings: "Removed $6,300 in junk fees" },
  { id: 6, name: "Kevin M.", location: "West Palm Beach, FL", platform: "Verified Scan", stars: 5, headline: "Used the Truth Report with my next company and beat the first quote by 30%.", body: "First contractor tried to rush me. WindowMan broke down the quote line by line, then I took that intelligence to another company and got a cleaner, cheaper proposal. Absolute game changer.", savings: "Beat first quote by 30%" },
];

interface NarrativeProofProps { onScanClick?: () => void; onDemoClick?: () => void; }

const NarrativeProof = ({ onScanClick, onDemoClick }: NarrativeProofProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const autoplayPlugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true }));
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { align: "start", loop: true },
    prefersReducedMotion ? [] : [autoplayPlugin.current],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", () => { setScrollSnaps(emblaApi.scrollSnapList()); onSelect(); });
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  const handleScanClick = () => {
    if (onScanClick) { onScanClick(); }
    else { document.getElementById("truth-gate")?.scrollIntoView({ behavior: "smooth" }); }
  };

  return (
    <section className="bg-transparent">
      <div ref={ref} className="mx-auto max-w-5xl px-4 md:px-8 py-20 md:py-28">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, ease: "easeOut" }} className="text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-4">REAL RESULTS FROM FLORIDA HOMEOWNERS</p>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-foreground mb-3">WHAT HAPPENS WHEN YOU KNOW THE TRUTH.</h2>
          <p className="text-base text-foreground/80">These Are Outcomes Not Reviews</p>
        </motion.div>

        {/* Review Carousel */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }} className="mb-12">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex -ml-4">
              {reviews.map((review) => (
                <div key={review.id} className="min-w-0 shrink-0 grow-0 basis-full md:basis-1/2 lg:basis-1/3 pl-4">
                  <div className="card-raised p-6 h-full border-l-4 border-l-[hsl(var(--color-emerald))] transition-transform duration-150 ease-out hover:-translate-y-[1px]">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-sm text-primary shrink-0">
                        {review.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-body font-bold text-sm text-foreground">{review.name}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{review.location}</p>
                        <p className="font-mono text-[11px] text-muted-foreground mt-0.5">{review.platform}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < review.stars ? "fill-primary text-primary" : "fill-muted text-muted"}`} />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-primary">{review.stars.toFixed(1)}</span>
                    </div>
                    <h3 className="font-body font-bold text-foreground text-[15px] leading-snug mb-2">&ldquo;{review.headline}&rdquo;</h3>
                    <p className="font-body text-sm text-muted-foreground leading-relaxed mb-4">{review.body}</p>
                    <div className="pt-3 border-t border-border/50">
                      <p className="text-sm font-bold text-[hsl(var(--color-emerald))]">💰 {review.savings}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-6" role="tablist" aria-label="Review navigation">
            {scrollSnaps.map((_, i) => (
              <button key={i} role="tab" aria-selected={selectedIndex === i} aria-label={`Go to slide ${i + 1}`} onClick={() => emblaApi?.scrollTo(i)}
                className="rounded-full transition-all duration-200 border-none cursor-pointer"
                style={{ width: selectedIndex === i ? 20 : 8, height: 8, backgroundColor: selectedIndex === i ? "hsl(var(--primary))" : "hsl(var(--border))" }} />
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default NarrativeProof;
