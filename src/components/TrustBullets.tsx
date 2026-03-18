import { Check } from "lucide-react";
import { motion } from "framer-motion";

const trustBullets = [
  "No account or credit card required",
  "256-bit encrypted & strictly confidential",
  "Results generated in under 60 seconds",
  "Your contractor is never notified",
];

export const TrustBullets = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.4 }}
    className="mt-6"
  >
    <div className="flex flex-col lg:grid lg:grid-cols-2 gap-y-3 gap-x-6 w-fit">
      {trustBullets.map((item) => (
        <div key={item} className="flex items-center gap-2">
          <Check size={16} className="shrink-0 text-emerald-600" strokeWidth={2.5} />
          <span className="whitespace-nowrap font-medium text-slate-950 text-xs sm:text-[13px] lg:text-sm">{item}</span>
        </div>
      ))}
    </div>
  </motion.div>
);
