import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Lock,
  ShieldCheck,
  Edit3,
  PhoneCall,
  Target,
  BadgeCheck,
  MessageSquareQuote,
} from 'lucide-react';
import { BRANCH_DYNAMIC_CHIPS, generateConditionalStatement } from '../constants/branchChips';
import { DIAGNOSTIC_MAP } from '../constants/diagnosticMap';
import { getSLAPromise } from '../lib/sla';
import { maskPhone, maskEmail } from '../lib/formatters';
import type { DiagnosisCode, DiagnosticConfig, DiagnosticContext } from '../types';

interface StepPrescriptionProps {
  activeConfig: DiagnosticConfig;
  primaryDiagnosis: DiagnosisCode;
  context: DiagnosticContext;
  secondaryClarifiers: string[];
  otherFreeText: string;
  windowStyles: string[];
  windowConcerns: string[];
  frameMaterial: string;
  counterOfferTerms: string[];
  counterOfferFreeText: string;
  hasCounterOffer: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onContactEdit: () => void;
  onSubmit: (e: React.FormEvent) => void;
  setCounterOfferFreeText: (v: string) => void;
  setCounterOfferTerms: React.Dispatch<React.SetStateAction<string[]>>;
  toggleInArray: (
    arr: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => void;
}

export function StepPrescription({
  activeConfig,
  primaryDiagnosis,
  context,
  secondaryClarifiers,
  otherFreeText,
  windowStyles,
  windowConcerns,
  frameMaterial,
  counterOfferTerms,
  counterOfferFreeText,
  hasCounterOffer,
  isSubmitting,
  onBack,
  onContactEdit,
  onSubmit,
  setCounterOfferFreeText,
  setCounterOfferTerms,
  toggleInArray,
}: StepPrescriptionProps) {
  return (
    <section className="bg-slate-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Dynamic Headline */}
        <div className="mb-8 text-center">
          <div className={`inline-flex items-center gap-2 ${activeConfig.accentBg} ${activeConfig.accent} px-4 py-1.5 rounded-full text-sm font-medium mb-5 border ${activeConfig.accentBorder}`}>
            <activeConfig.Icon className="w-4 h-4" />
            Prescribed For You
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
            {activeConfig.prescriptionHeadline}
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {activeConfig.prescriptionSubhead}
          </p>
        </div>

        {/* Prescribed Guarantee */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <ShieldCheck className={`w-7 h-7 ${activeConfig.accent}`} />
            <h3 className="text-xl font-bold text-slate-900">{activeConfig.guaranteeTitle}</h3>
          </div>
          <ul className="space-y-3">
            {activeConfig.guarantees.map((g, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className={`w-5 h-5 ${activeConfig.accent} shrink-0 mt-0.5`} />
                <span className="text-slate-700 text-base">{g}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* MIRROR PANEL — reflects everything they told us */}
        <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Here's what we heard</h3>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded-md hover:bg-white/60"
              aria-label="Edit your selections"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Your frustration
              </p>
              <p className="text-slate-800 font-medium">{activeConfig.label}</p>
            </div>

            {secondaryClarifiers.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Specifically
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {secondaryClarifiers.map((c) => (
                    <span key={c} className="inline-block px-3 py-1 bg-white border border-blue-200 rounded-full text-xs font-medium text-slate-700">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {otherFreeText && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  In your words
                </p>
                <p className="text-slate-700 italic">"{otherFreeText}"</p>
              </div>
            )}

            {windowStyles.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Window styles
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {windowStyles.map((s) => (
                    <span key={s} className="inline-block px-3 py-1 bg-white border border-blue-200 rounded-full text-xs font-medium text-slate-700">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {windowConcerns.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  What matters
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {windowConcerns.map((c) => (
                    <span key={c} className="inline-block px-3 py-1 bg-white border border-green-200 rounded-full text-xs font-medium text-slate-700">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {frameMaterial && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Frame material
                </p>
                <span className="inline-block px-3 py-1 bg-white border border-purple-200 rounded-full text-xs font-medium text-slate-700">
                  {frameMaterial}
                </span>
              </div>
            )}
          </div>

          <p className="text-sm text-slate-600 mt-6 pt-5 border-t border-blue-200">
            Your advisor gets all of this upfront—so your next conversation starts where this one left off.
          </p>
        </div>

        {/* NO-FORM VERIFIED PROFILE BADGE */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border-2 border-slate-900">
          {/* Verified Profile Header */}
          <div className="flex items-center justify-between gap-3 p-4 mb-6 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                <BadgeCheck className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-green-700 mb-0.5">
                  Verified Profile
                </p>
                <p className="text-sm text-slate-800 truncate">
                  <span className="font-semibold">{context.first_name}</span>
                  <span className="text-slate-400 mx-1.5">•</span>
                  <span className="font-mono">{maskPhone(context.phone)}</span>
                  <span className="text-slate-400 mx-1.5">•</span>
                  <span>{maskEmail(context.email)}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onContactEdit}
              className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-900 px-2 py-1 rounded-md hover:bg-white/60 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>

          {/* COUNTER-OFFER PANEL — The Money Question */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                The Money Question
              </p>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              What would get you to "yes"?
            </h3>
            <p className="text-sm text-slate-600 mb-5">
              Tap everything that would make you move forward. Your advisor walks into the contractor call with these as non-negotiables on your behalf.
            </p>

            <div className="flex flex-wrap gap-2 mb-5">
              {BRANCH_DYNAMIC_CHIPS[primaryDiagnosis].map((term) => {
                const isSelected = counterOfferTerms.includes(term);
                return (
                  <button
                    key={term}
                    type="button"
                    onClick={() => toggleInArray(counterOfferTerms, setCounterOfferTerms, term)}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-500 ${
                      isSelected
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-amber-300 hover:bg-amber-50/30'
                    }`}
                  >
                    {term}
                  </button>
                );
              })}
            </div>

            {/* LIVE CONDITIONAL STATEMENT — updates as chips toggle */}
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <MessageSquareQuote className="w-3.5 h-3.5" />
                Here's what you're saying
              </p>
              <blockquote
                className={`border-l-4 pl-5 pr-4 py-4 rounded-r-lg text-base leading-relaxed transition-all ${
                  hasCounterOffer
                    ? 'border-amber-500 bg-amber-50/70 text-slate-900 italic'
                    : 'border-slate-300 bg-slate-50 text-slate-400 italic'
                }`}
              >
                {generateConditionalStatement(
                  DIAGNOSTIC_MAP[primaryDiagnosis].label,
                  counterOfferTerms
                )}
              </blockquote>
            </div>

            {/* Optional free-text — advisor context only, not part of the statement */}
            <details className="group">
              <summary className="text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer select-none list-none inline-flex items-center gap-1">
                <span className="group-open:rotate-90 transition-transform inline-block">›</span>
                Anything specific your advisor should know? (optional)
              </summary>
              <textarea
                value={counterOfferFreeText}
                onChange={(e) => setCounterOfferFreeText(e.target.value)}
                rows={3}
                placeholder="Example: 'If you can beat $18,400 with the same warranty, I'll sign this week.'"
                className="mt-3 w-full px-4 py-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none text-sm"
              />
            </details>
          </div>

          {/* SLA PROMISE — Trust Guardrail */}
          <div className="flex items-start gap-3 p-4 mb-5 rounded-xl bg-blue-50 border border-blue-200">
            <div className="shrink-0 w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
              <PhoneCall className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900">
                {getSLAPromise().text}
              </p>
              <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                Your advisor sees everything: your diagnosis, window preferences, and counter-offer terms. No repeating yourself.
              </p>
            </div>
          </div>

          {/* SINGLE-TAP CONFIRMATION */}
          <form onSubmit={onSubmit}>
            <button
              type="submit"
              disabled={!hasCounterOffer || isSubmitting}
              className={`w-full flex items-center justify-center gap-2 py-5 px-6 rounded-lg font-bold text-white text-lg transition-all ${
                !hasCounterOffer || isSubmitting
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-700 active:scale-[0.99] shadow-lg hover:shadow-amber-600/25'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Notifying your advisor...
                </>
              ) : (
                <>
                  Yes, have someone call me
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            {!hasCounterOffer && !isSubmitting && (
              <p className="text-xs text-slate-500 text-center mt-3 italic">
                Tap what would get you to yes.
              </p>
            )}
            {hasCounterOffer && !isSubmitting && (
              <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500 text-center mt-3">
                <Lock className="w-3 h-3" />
                No obligation. No contract. Just a real conversation.
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
