import React from 'react';
import {
  ScanSearch,
  Target,
  Flag,
  Diamond,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';

const steps = [
  {
    num: '01',
    title: 'Answer 4 quick questions',
    desc: 'County, scope, project type, and quote stage. No account required.',
  },
  {
    num: '02',
    title: 'Upload your quote',
    desc: 'PDF or image. Any format from any Florida contractor.',
  },
  {
    num: '03',
    title: 'AI scans every line',
    desc: 'Pricing, brands, warranties, permits, payment terms, and installation specs.',
  },
  {
    num: '04',
    title: 'Your grade is calculated',
    desc: 'Compared against real contracts in your county and scope.',
  },
  {
    num: '05',
    title: 'You decide what to do',
    desc: 'Use your negotiation script, request a better quote, or simply know you signed fairly.',
  },
];

const takeaways = [
  {
    icon: Target,
    text: 'Whether your price is above, below, or at fair market for your specific county',
  },
  {
    icon: Flag,
    text: 'Which line items are vague, missing, or potentially inflated',
  },
  {
    icon: Diamond,
    text: 'What window brand — if any — your contractor actually specified',
  },
  {
    icon: CheckCircle2,
    text: 'A letter grade: A through F',
  },
];

interface ProcessStepsProps {
  onScanClick?: () => void;
  onDemoClick?: () => void;
}

const ProcessSteps = ({ onScanClick, onDemoClick }: ProcessStepsProps) => {
  const handleScanClick = () => {
    if (onScanClick) {
      onScanClick();
    } else {
      document.getElementById("truth-gate")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="how-it-works" className="bg-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-50 border border-cyan-100 mb-5 shadow-sm">
            <ScanSearch className="w-8 h-8 text-cyan-600" strokeWidth={1.8} />
          </div>
          <div className="font-mono text-[11px] tracking-[0.18em] text-cyan-600 uppercase mb-4">
            How it works
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F1419] tracking-[-0.02em] leading-[1.08]">
            What Happens When You Scan
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-7">
            Upload Your Quote. In Under 60 Seconds, You'll Know Exactly Where
            You Stand — Before You Sign.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-7 relative">
            <div className="hidden sm:block absolute left-[22px] top-6 bottom-6 w-px bg-gradient-to-b from-cyan-200 via-slate-200 to-slate-200" />
            <div className="space-y-5 sm:space-y-6">
              {steps.map((step) => (
                <div
                  key={step.num}
                  className="relative z-10 flex items-start gap-4 sm:gap-5 group"
                >
                  <div className="shrink-0 w-11 h-11 rounded-full bg-white border-2 border-[#F59E0B] text-[#F59E0B] flex items-center justify-center shadow-sm">
                    <span className="font-mono text-sm font-bold tracking-wide">
                      {step.num}
                    </span>
                  </div>
                  <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-[0_10px_30px_rgba(15,20,25,0.06)] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_14px_36px_rgba(15,20,25,0.10)]">
                    <h3 className="text-lg sm:text-xl font-semibold text-[#0F1419]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm sm:text-[15px] leading-7 text-slate-600 max-w-[42ch]">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="rounded-[28px] border border-slate-200 bg-[#F8FAFC] shadow-[0_18px_50px_rgba(15,20,25,0.08)] overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-700" />
              <div className="relative p-6 sm:p-8">
                <FileCheck className="absolute right-4 bottom-4 w-32 h-32 text-slate-100 pointer-events-none" strokeWidth={1.25} />
                <div className="relative z-10">
                  <h3 className="text-2xl sm:text-[30px] leading-tight font-bold text-[#0F1419] pb-5 border-b border-slate-200">
                    You'll walk away{' '}
                    <span className="text-blue-600">knowing:</span>
                  </h3>
                  <ul className="mt-6 space-y-5 sm:space-y-6">
                    {takeaways.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <li key={index} className="flex items-start gap-4">
                          <div className="w-11 h-11 shrink-0 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                            <Icon className="w-5 h-5 text-blue-600" strokeWidth={2} />
                          </div>
                          <p className="text-[15px] sm:text-base font-medium leading-7 text-slate-700">
                            {item.text}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-8 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/60 p-4 sm:p-5 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white border border-blue-100 text-blue-600 flex items-center justify-center shadow-sm shrink-0 font-bold text-lg">
                      A–F
                    </div>
                    <div>
                      <p className="font-semibold text-[#0F1419]">
                        Clear action plan
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        Grade, flags, and negotiation direction in one report
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white border border-slate-200 px-4 py-3">
                      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
                        Includes
                      </div>
                      <div className="mt-1 text-sm font-semibold text-[#0F1419]">
                        Dollar delta vs market
                      </div>
                    </div>
                    <div className="rounded-xl bg-white border border-slate-200 px-4 py-3">
                      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
                        Includes
                      </div>
                      <div className="mt-1 text-sm font-semibold text-[#0F1419]">
                        Red flags explained
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <button onClick={handleScanClick} className="btn-depth-primary" style={{ padding: "16px 32px" }}>
            Scan My Quote — It's Free
          </button>
          {onDemoClick && (
            <button
              onClick={onDemoClick}
              className="block mx-auto mt-4 btn-secondary-tactile"
              style={{ padding: "12px 24px" }}
            >
              See the AI in Action — No Upload Needed
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProcessSteps;
