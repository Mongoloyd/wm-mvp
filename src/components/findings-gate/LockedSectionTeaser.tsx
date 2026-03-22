import {
  Lock,
  MessageSquareWarning,
  Search,
  BarChart3,
  ArrowRight,
} from "lucide-react";

type TeaserVariant = "action_plan" | "evidence" | "benchmarks";

interface LockedSectionTeaserProps {
  variant: TeaserVariant;
  onUnlock?: () => void;
}

const TEASER_CONTENT: Record<
  TeaserVariant,
  {
    icon: typeof MessageSquareWarning;
    iconBg: string;
    iconColor: string;
    title: string;
    body: string;
    bullets: string[];
  }
> = {
  action_plan: {
    icon: MessageSquareWarning,
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-400",
    title: "Your Action Plan",
    body: "A personalized negotiation script, contractor questions, and do-not-sign checklist have been generated from your findings.",
    bullets: [
      "Renegotiation asks ranked by impact",
      "Exact questions to ask your contractor",
      "Do-not-sign checklist until resolved",
    ],
  },
  evidence: {
    icon: Search,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    title: "Evidence Explorer",
    body: "Full forensic source data extracted from your quote — the proof behind every finding.",
    bullets: [
      "OCR-extracted text with page references",
      "Missing item detection with proof markers",
      "Field-by-field extraction audit",
    ],
  },
  benchmarks: {
    icon: BarChart3,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    title: "Pricing Benchmarks",
    body: "Regional pricing comparison to help you understand where your quote sits relative to local market rates.",
    bullets: [
      "Price-per-opening estimate",
      "Local market range for your county",
      "Market deviation percentage",
    ],
  },
};

export function LockedSectionTeaser({ variant, onUnlock }: LockedSectionTeaserProps) {
  const content = TEASER_CONTENT[variant];
  const Icon = content.icon;

  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-900/40 ring-1 ring-white/5">
      {/* Blurred ghost content behind for depth illusion */}
      <div className="absolute inset-0 -z-10 p-5 blur-[5px] opacity-15">
        <div className="h-8 w-48 rounded-lg bg-slate-700 mb-3" />
        <div className="h-5 w-full rounded bg-slate-700 mb-2" />
        <div className="h-5 w-3/4 rounded bg-slate-700 mb-2" />
        <div className="h-10 w-full rounded-lg bg-slate-800 mb-2" />
        <div className="h-10 w-full rounded-lg bg-slate-800 mb-2" />
        <div className="h-10 w-full rounded-lg bg-slate-800" />
      </div>

      <div className="relative px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${content.iconBg}`}>
            <Icon className={`h-4 w-4 ${content.iconColor}`} />
          </div>
          <h3
            className="text-base font-bold text-white"
            style={{ letterSpacing: "-0.01em" }}
          >
            {content.title}
          </h3>
          <Lock className="h-3.5 w-3.5 text-slate-600 ml-auto" />
        </div>

        {/* Body */}
        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          {content.body}
        </p>

        {/* What's inside bullets */}
        <div className="space-y-2 mb-6">
          {content.bullets.map((bullet, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-slate-600 shrink-0" />
              <span className="text-xs text-slate-500">{bullet}</span>
            </div>
          ))}
        </div>

        {/* Unlock prompt */}
        {onUnlock && (
          <button
            onClick={onUnlock}
            className="
              inline-flex items-center gap-2
              text-sm font-semibold text-[#1A6FD4]
              transition-colors hover:text-cyan-300
            "
          >
            Verify to unlock
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
