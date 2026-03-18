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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 w-fit">
      {trustBullets.map((item) => (
        <div key={item} className="flex items-start gap-2">
          <Check size={16} className="shrink-0 mt-0.5 text-emerald-600" strokeWidth={2.5} />
          <span className="text-sm text-slate-500 font-medium">{item}</span>
        </div>
      ))}
    </div>
  </motion.div>
);
