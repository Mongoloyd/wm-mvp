
import React from "react";
import { Check } from "lucide-react";

export default function QualificationStripSection({ onOpenQualification }) {
  return (
    <section className="mx-auto w-full max-w-2xl py-16">
      <div className="flex flex-col items-center rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 shadow-2xl lg:p-12">
        <h2 className="mb-10 text-center text-2xl font-bold tracking-tight text-white lg:text-3xl">This Works Best For Contractors Who:</h2>
        <ul className="mb-10 flex w-full flex-col gap-5 text-left">
          {["Can call a new opportunity within the same day","Handle mid-to-high ticket window or door jobs","Want fewer, better buyers — not raw volume","Are ready to move when the right situation appears"].map((item, i) => (
            <li key={i} className="flex items-start gap-4">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"><Check size={14} strokeWidth={3} /></div>
              <span className="text-base font-medium text-white/90">{item}</span>
            </li>
          ))}
        </ul>
        <div className="h-px w-full bg-white/[0.06] mb-8" />
        <div className="flex w-full flex-col items-center justify-between gap-6 sm:flex-row sm:gap-4">
          <span className="text-sm font-medium text-white/70">Think this is you?</span>
          <button onClick={onOpenQualification} className="w-full rounded-full bg-white/10 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20 active:scale-[0.98] sm:w-auto">Check Your Territory</button>
        </div>
      </div>
    </section>
  );
}