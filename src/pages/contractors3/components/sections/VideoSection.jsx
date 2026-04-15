
import React from "react";
import { motion } from "framer-motion";
import { PlayCircle, Check } from "lucide-react";
import { PAGE_CONFIG } from "../../config/page.config.js";

export default function VideoSection() {
  const videoUrl = typeof PAGE_CONFIG.video === 'string' ? PAGE_CONFIG.video : PAGE_CONFIG.video?.url;
  const hasVideo = Boolean(videoUrl && videoUrl.trim() !== "");

  return (
    <section className="mx-auto w-full max-w-5xl py-24">
      <div className="mb-12 flex flex-col items-center text-center">
        <span className="mb-4 block text-xs font-bold uppercase tracking-widest text-white/50">The System in 30 Seconds</span>
        <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight lg:text-4xl">
          See How WindowMan Gets Homeowners After They Already Have Competitor Quotes
        </h2>
      </div>

      <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
        <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }} className="flex-[1.4] w-full shrink-0">
          {hasVideo ? (
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl">
              <video controls className="aspect-video w-full bg-black object-cover" poster={PAGE_CONFIG.video?.thumbnailUrl}>
                <source src={videoUrl} type="video/mp4" />
              </video>
            </div>
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 shadow-2xl">
              <PlayCircle className="mb-4 h-12 w-12 text-white/30" />
              <p className="mb-1 text-center text-sm font-medium text-white/60">{PAGE_CONFIG.video?.fallbackText || "System Demo Walkthrough"}</p>
              <span className="text-xs text-white/30 uppercase tracking-widest">Video coming soon</span>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }} className="flex-1 flex flex-col gap-6">
          <p className="text-base leading-relaxed text-white/70">
            In under 30 seconds, this shows exactly how WindowMan intercepts homeowners after they've received competitor estimates — and how that moment becomes an opportunity for the right contractor.
          </p>
          <ul className="flex flex-col gap-4">
            <li className="flex items-start gap-3 text-sm font-medium text-white/90"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />How the buyer arrives with a competitor quote</li>
            <li className="flex items-start gap-3 text-sm font-medium text-white/90"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />What WindowMan shows them</li>
            <li className="flex items-start gap-3 text-sm font-medium text-white/90"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />Why they become motivated to switch</li>
          </ul>
          <div className="mt-4 flex flex-col gap-4">
            <a href={PAGE_CONFIG.calendly.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-bold text-black transition-colors hover:bg-white/90 active:scale-[0.98]">
              Book a 10-Minute Walkthrough
            </a>
            <p className="text-center text-sm text-white/50">
              Or call: <a href={PAGE_CONFIG.phone.href} className="text-white hover:underline">{PAGE_CONFIG.phone.display}</a>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}