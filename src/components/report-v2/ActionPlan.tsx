import { useState } from "react";
import {
  MessageSquareWarning,
  HelpCircle,
  OctagonX,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react";
import type { ActionPlan as ActionPlanType, ReportMode } from "@/types/report-v2";

interface ActionPlanProps {
  actionPlan?: ActionPlanType;
  mode: ReportMode;
}

function ActionSection({
  title,
  icon: Icon,
  items,
  accentColor,
  defaultOpen = false,
}: {
  title: string;
  icon: typeof MessageSquareWarning;
  items: Array<{ id: string; label: string; priority: string }>;
  accentColor: string;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (items.length === 0) return null;

  return (
    <div className="rounded-xl bg-slate-900/40 ring-1 ring-white/5 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <Icon className={`h-4 w-4 shrink-0 ${accentColor}`} />
        <span className="flex-1 text-sm font-semibold text-white">{title}</span>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400">
          {items.length}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-white/5 px-5 py-4 space-y-3">
          {items.map((item, i) => (
            <div key={item.id} className="flex items-start gap-3">
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-800 text-[10px] font-bold text-slate-400">
                {i + 1}
              </span>
              <p className="text-sm leading-snug text-slate-300">{item.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ActionPlan({ actionPlan, mode }: ActionPlanProps) {
  // Preview teaser
  if (mode === "partial_reveal" || !actionPlan) {
    return (
      <section className="relative">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
            <MessageSquareWarning className="h-4 w-4 text-orange-400" />
          </div>
          <h2
            className="text-lg font-bold tracking-tight text-white"
            style={{ letterSpacing: "-0.02em" }}
          >
            Your Action Plan
          </h2>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-slate-900/40 ring-1 ring-white/5">
          <div className="px-6 py-8 text-center">
            <Lock className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-3 text-sm font-medium text-slate-400">
              Your personalized negotiation script, contractor questions, and
              do-not-sign checklist are ready.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Verify your identity to unlock the full action plan.
            </p>
          </div>
          {/* Blurred fake content behind */}
          <div className="absolute inset-0 -z-10 flex flex-col gap-2 p-5 blur-[6px] opacity-30">
            <div className="h-10 rounded-lg bg-slate-800" />
            <div className="h-10 rounded-lg bg-slate-800" />
            <div className="h-10 rounded-lg bg-slate-800" />
          </div>
        </div>
      </section>
    );
  }

  // Full mode
  return (
    <section>
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
          <MessageSquareWarning className="h-4 w-4 text-orange-400" />
        </div>
        <h2
          className="text-lg font-bold tracking-tight text-white"
          style={{ letterSpacing: "-0.02em" }}
        >
          Your Action Plan
        </h2>
      </div>

      <div className="space-y-2">
        <ActionSection
          title="Renegotiation Asks"
          icon={MessageSquareWarning}
          items={actionPlan.renegotiationAsks}
          accentColor="text-red-400"
          defaultOpen={true}
        />
        <ActionSection
          title="Questions for Your Contractor"
          icon={HelpCircle}
          items={actionPlan.contractorQuestions}
          accentColor="text-amber-400"
          defaultOpen={actionPlan.renegotiationAsks.length === 0}
        />
        <ActionSection
          title="Do Not Sign Until..."
          icon={OctagonX}
          items={actionPlan.doNotSignChecklist}
          accentColor="text-red-400"
        />
      </div>

      {/* Next step options */}
      {actionPlan.nextStepOptions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {actionPlan.nextStepOptions.includes("renegotiate") && (
            <button className="inline-flex items-center gap-2 rounded-lg bg-orange-500/15 px-4 py-2.5 text-sm font-semibold text-orange-400 ring-1 ring-orange-500/20 transition-all hover:bg-orange-500/20">
              <ArrowRight className="h-4 w-4" />
              Use This to Renegotiate
            </button>
          )}
          {actionPlan.nextStepOptions.includes("get_another_quote") && (
            <button className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-400 ring-1 ring-cyan-500/20 transition-all hover:bg-cyan-500/15">
              <ArrowRight className="h-4 w-4" />
              Get a Second Quote
            </button>
          )}
          {actionPlan.nextStepOptions.includes("proceed_carefully") && (
            <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-400 ring-1 ring-emerald-500/20 transition-all hover:bg-emerald-500/15">
              <ArrowRight className="h-4 w-4" />
              Proceed with Confidence
            </button>
          )}
        </div>
      )}
    </section>
  );
}
