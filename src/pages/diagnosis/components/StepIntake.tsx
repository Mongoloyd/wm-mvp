import { Handshake } from 'lucide-react';
import { DIAGNOSIS_ORDER, DIAGNOSTIC_MAP } from '../constants/diagnosticMap';
import type { DiagnosisCode, DiagnosticContext } from '../types';

interface StepIntakeProps {
  context: DiagnosticContext;
  onSelectPrimary: (code: DiagnosisCode) => void;
}

export function StepIntake({ context, onSelectPrimary }: StepIntakeProps) {
  return (
    <section className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white pt-16 pb-20 px-6 relative overflow-hidden">
      <div className="max-w-3xl mx-auto relative z-10">
        {context.report_grade && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-10 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-14 h-14 rounded-lg bg-red-500/20 border border-red-400/30 flex items-center justify-center">
                <span className="text-2xl font-bold text-red-300">{context.report_grade}</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Your Audit Score
                </p>
                <p className="text-sm text-slate-300 mb-2">Here's what we flagged:</p>
                <ul className="space-y-1">
                  {context.top_insights.map((insight, i) => (
                    <li key={i} className="text-sm text-slate-200 flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Handshake className="w-4 h-4" />
            This isn't a sales form. It's a consultation.
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 leading-tight">
            Before we build your better estimate, tell us what didn't feel right.
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            You can be completely honest—we work for you, not the contractor. One tap is all it takes to start.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Root Question
          </p>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">
            What frustrated you most about the quote you received?
          </h2>
          <div className="flex flex-wrap gap-3">
            {DIAGNOSIS_ORDER.map((code) => {
              const config = DIAGNOSTIC_MAP[code];
              const Icon = config.Icon;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => onSelectPrimary(code)}
                  className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium text-sm hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Icon className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                  {config.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-5 italic">
            Tap the one that hits closest. Don't overthink it.
          </p>
        </div>
      </div>

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full overflow-hidden z-0 pointer-events-none opacity-20">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[140%] rounded-full bg-blue-600 blur-[120px]"></div>
      </div>
    </section>
  );
}
