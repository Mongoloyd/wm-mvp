
import React from "react";

export default function StepCard({ step, totalSteps, children }) {
  const progress = (step / totalSteps) * 100;
  return (
    <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111111] shadow-2xl">
      <div className="h-1 w-full bg-white/[0.08]">
        <div className="h-full bg-white transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
      </div>
      <div className="p-6 md:p-8">
        <div className="mb-6 flex justify-end">
          <span className="text-xs font-medium uppercase tracking-wider text-white/40">Step {step} of {totalSteps}</span>
        </div>
        {children}
      </div>
    </div>
  );
}