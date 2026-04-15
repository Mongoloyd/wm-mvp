import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true } as const,
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

interface Props {
  onOpenQualification: () => void;
}

const bullets = [
  "Can call a new opportunity within the same day",
  "Handle mid-to-high ticket window or door jobs",
  "Want fewer, better buyers — not raw volume",
  "Are ready to move when the right situation appears",
];

export default function QualificationStripSection({ onOpenQualification }: Props) {
  return (
    <section className="py-24 bg-zinc-950">
      <div className="max-w-2xl mx-auto px-6">
        <motion.div {...fadeUp} className="text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-8">
            This Works Best For Contractors Who:
          </h2>

          <ul className="space-y-4 text-left mb-10">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-lg text-slate-200 leading-relaxed">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
                {b}
              </li>
            ))}
          </ul>

          <div className="h-px bg-white/10 mb-8" />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <span className="text-slate-200">Think this is you?</span>
            <motion.button
              onClick={onOpenQualification}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center bg-white text-black px-6 py-3 rounded-full font-bold text-base hover:bg-zinc-200 transition-colors"
            >
              Check Your Territory
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
