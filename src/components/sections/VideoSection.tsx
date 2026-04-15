import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { PAGE_CONFIG } from "../../config/page.config";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true } as const,
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

export default function VideoSection() {
  const hasVideo = PAGE_CONFIG.video.url.trim().length > 0;

  return (
    <section className="py-24 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div {...fadeUp} className="mb-12">
          <span className="text-sm font-semibold tracking-widest uppercase text-slate-300 mb-3 block">
            The System in 30 Seconds
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6">
            See How WindowMan Gets Homeowners After They Already Have Competitor
            Quotes
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left — Video or placeholder */}
          <motion.div {...fadeUp}>
            {hasVideo ? (
              <video
                controls
                className="w-full rounded-2xl border border-white/10"
                poster={
                  PAGE_CONFIG.video.thumbnailUrl || undefined
                }
              >
                <source src={PAGE_CONFIG.video.url} />
              </video>
            ) : (
              <div className="bg-zinc-900/40 border border-white/10 rounded-2xl aspect-video flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center">
                  <Play className="w-7 h-7 text-white ml-1" />
                </div>
                <p className="text-lg text-slate-200 leading-relaxed text-center max-w-xs px-4">
                  {PAGE_CONFIG.video.fallbackText}
                </p>
                <p className="text-xs text-slate-300">Video coming soon</p>
              </div>
            )}
          </motion.div>

          {/* Right — Copy */}
          <motion.div {...fadeUp} className="flex flex-col gap-6">
            <p className="text-lg text-slate-200 leading-relaxed">
              In under 30 seconds, this shows exactly how WindowMan intercepts
              homeowners after they've received competitor estimates — and how
              that moment becomes an opportunity for the right contractor.
            </p>

            <ul className="space-y-3">
              {[
                "How the buyer arrives with a competitor quote",
                "What WindowMan shows them",
                "Why they become motivated to switch",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-slate-200"
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
              <motion.a
                href={PAGE_CONFIG.calendly.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-zinc-200 transition-colors"
              >
                Book a 10-Minute Walkthrough
              </motion.a>
              <a
                href={PAGE_CONFIG.phone.href}
                className="text-slate-300 hover:text-white transition-colors text-sm pt-3 sm:pt-4"
              >
                Or call {PAGE_CONFIG.phone.display}
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
