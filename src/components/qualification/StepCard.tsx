import type { ReactNode } from "react";

interface StepCardProps {
  step: number;
  totalSteps: number;
  children: ReactNode;
}

export default function StepCard({ step, totalSteps, children }: StepCardProps) {
  const pct = (step / totalSteps) * 100;

  return (
    <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-8 backdrop-blur-sm w-full max-w-lg mx-auto">
      <div className="mb-6">
        <p className="text-xs text-zinc-500 mb-2">
          Step {step} of {totalSteps}
        </p>
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {children}
    </div>
  );
}
