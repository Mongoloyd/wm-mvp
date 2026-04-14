import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { PAGE_CONFIG } from "../../config/page.config";
import CalendlyEmbed from "../ui/CalendlyEmbed";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true } as const,
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

const inputClass =
  "w-full min-h-[48px] bg-zinc-900/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors text-sm";

export default function BookingSection() {
  const [form, setForm] = useState({
    name: "",
    company: "",
    phone: "",
    serviceArea: "",
    jobSize: "",
  });

  const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log({ formData: form });
  };

  return (
    <section className="py-24 bg-black">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div {...fadeUp} className="mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
            See If Your Territory Is Open
          </h2>
          <p className="text-lg text-zinc-400 leading-relaxed">
            Takes 10 minutes. No obligation. We'll confirm availability on the
            call.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[55%_45%] gap-12">
          {/* Left — Calendly */}
          <motion.div {...fadeUp}>
            <p className="text-sm text-zinc-500 mb-4">
              Book directly below
            </p>
            <CalendlyEmbed url={PAGE_CONFIG.calendly.url} />
          </motion.div>

          {/* Right — Phone + Form */}
          <motion.div {...fadeUp} className="flex flex-col gap-8">
            <div>
              <p className="text-sm text-zinc-500 mb-4">
                Or request access by call or text
              </p>
              <a
                href={PAGE_CONFIG.phone.href}
                className="text-2xl md:text-3xl font-bold text-white hover:text-zinc-200 transition-colors"
              >
                {PAGE_CONFIG.phone.display}
              </a>
              <div className="flex gap-4 mt-3">
                <a
                  href={PAGE_CONFIG.phone.href}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Call
                </a>
                <a
                  href={PAGE_CONFIG.phone.sms}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Text
                </a>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-zinc-600">or submit below</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Company"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
                className={inputClass}
              />
              <input
                type="tel"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Service Area"
                value={form.serviceArea}
                onChange={(e) => update("serviceArea", e.target.value)}
                className={inputClass}
              />
              <select
                value={form.jobSize}
                onChange={(e) => update("jobSize", e.target.value)}
                className={`${inputClass} appearance-none`}
              >
                <option value="">Select range</option>
                <option value="under_8k">Under $8k</option>
                <option value="8k_15k">$8k – $15k</option>
                <option value="15k_25k">$15k – $25k</option>
                <option value="25k_plus">$25k+</option>
              </select>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-zinc-200 transition-colors w-full"
              >
                Request Territory Access
              </motion.button>
            </form>

            <p className="text-xs text-zinc-600 text-center">
              Prefer to talk first? Call or text directly above.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
