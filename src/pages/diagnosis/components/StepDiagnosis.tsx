import { ArrowLeft, ArrowRight } from 'lucide-react';
import { WINDOW_STYLES, WINDOW_CONCERNS, FRAME_MATERIALS } from '../constants/windowOptions';
import type { DiagnosisCode, DiagnosticConfig } from '../types';

interface StepDiagnosisProps {
  activeConfig: DiagnosticConfig;
  primaryDiagnosis: DiagnosisCode;
  secondaryClarifiers: string[];
  otherFreeText: string;
  windowStyles: string[];
  windowConcerns: string[];
  frameMaterial: string;
  canAdvanceFromDiagnosis: boolean;
  onBack: () => void;
  onAdvance: () => void;
  setOtherFreeText: (v: string) => void;
  setFrameMaterial: (v: string) => void;
  toggleInArray: (
    arr: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => void;
  setSecondaryClarifiers: React.Dispatch<React.SetStateAction<string[]>>;
  setWindowStyles: React.Dispatch<React.SetStateAction<string[]>>;
  setWindowConcerns: React.Dispatch<React.SetStateAction<string[]>>;
}

export function StepDiagnosis({
  activeConfig,
  primaryDiagnosis,
  secondaryClarifiers,
  otherFreeText,
  windowStyles,
  windowConcerns,
  frameMaterial,
  canAdvanceFromDiagnosis,
  onBack,
  onAdvance,
  setOtherFreeText,
  setFrameMaterial,
  toggleInArray,
  setSecondaryClarifiers,
  setWindowStyles,
  setWindowConcerns,
}: StepDiagnosisProps) {
  return (
    <section className="bg-slate-50 py-12 px-6 min-h-[calc(100vh-160px)]">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Change my answer
        </button>

        {/* Therapeutic Reflection Panel */}
        <div className={`${activeConfig.accentBg} ${activeConfig.accentBorder} border-2 rounded-2xl p-6 md:p-8 mb-8 shadow-sm`}>
          <div className="flex items-start gap-4">
            <div className={`shrink-0 w-12 h-12 rounded-xl bg-white ${activeConfig.accentBorder} border-2 flex items-center justify-center`}>
              <activeConfig.Icon className={`w-6 h-6 ${activeConfig.accent}`} />
            </div>
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${activeConfig.accent} mb-3`}>
                {activeConfig.reflectionTitle}
              </h2>
              <p className="text-slate-800 text-base leading-relaxed">
                {activeConfig.reflectionBody}
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-600 text-sm mb-6 italic">
          A few quick questions so we can shape your prescription. All taps, no typing.
        </p>

        {/* Question 1: Secondary Clarifier */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 mb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Diagnostic
            </p>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            {activeConfig.secondaryQuestion}
          </h3>

          {primaryDiagnosis === 'other' ? (
            <textarea
              value={otherFreeText}
              onChange={(e) => setOtherFreeText(e.target.value)}
              rows={4}
              placeholder="Tell us what felt off. There's no wrong answer."
              className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none text-slate-900"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeConfig.secondaryOptions.map((option) => {
                const isSelected = secondaryClarifiers.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      toggleInArray(secondaryClarifiers, setSecondaryClarifiers, option)
                    }
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Question 2: Window Styles */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 mb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Window Types
            </p>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Which window styles are part of this project?
          </h3>
          <p className="text-sm text-slate-500 mb-4">Tap any that apply.</p>
          <div className="flex flex-wrap gap-2">
            {WINDOW_STYLES.map((style) => {
              const isSelected = windowStyles.includes(style);
              return (
                <button
                  key={style}
                  type="button"
                  onClick={() => toggleInArray(windowStyles, setWindowStyles, style)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {style}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question 3: Concerns */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 mb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Priorities
            </p>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            What matters most to you?
          </h3>
          <p className="text-sm text-slate-500 mb-4">Tap everything that's important.</p>
          <div className="flex flex-wrap gap-2">
            {WINDOW_CONCERNS.map((concern) => {
              const isSelected = windowConcerns.includes(concern);
              return (
                <button
                  key={concern}
                  type="button"
                  onClick={() => toggleInArray(windowConcerns, setWindowConcerns, concern)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
                    isSelected
                      ? 'bg-green-600 border-green-600 text-white shadow-sm'
                      : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {concern}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question 4: Frame Material (single-select chips) */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">4</div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Frame Material
            </p>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Frame material preference?
          </h3>
          <p className="text-sm text-slate-500 mb-4">Pick one. "Not sure" is fine.</p>
          <div className="flex flex-wrap gap-2">
            {FRAME_MATERIALS.map(({ value, label }) => {
              const isSelected = frameMaterial === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFrameMaterial(isSelected ? '' : value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
                    isSelected
                      ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                      : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Advance */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8">
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            {activeConfig.prescriptionSetup}
          </p>
          <button
            onClick={onAdvance}
            disabled={!canAdvanceFromDiagnosis}
            className={`w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-lg font-bold text-white transition-all ${
              !canAdvanceFromDiagnosis
                ? 'bg-slate-700 cursor-not-allowed opacity-50'
                : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.99] shadow-lg'
            }`}
          >
            See How We'll Fix This <ArrowRight className="w-5 h-5" />
          </button>
          {!canAdvanceFromDiagnosis && (
            <p className="text-xs text-slate-400 text-center mt-3">
              {primaryDiagnosis === 'other'
                ? 'Tell us a little more so we can tailor the prescription.'
                : 'Pick at least one option from question 1 to continue.'}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
