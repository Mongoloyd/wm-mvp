import { PhoneCall } from 'lucide-react';
import { getSLAPromise } from '../lib/sla';
import { maskPhone } from '../lib/formatters';
import type { DiagnosticConfig, DiagnosticContext } from '../types';

interface SuccessScreenProps {
  context: DiagnosticContext;
  activeConfig: DiagnosticConfig | null;
  onReturn: () => void;
}

export function SuccessScreen({ context, activeConfig, onReturn }: SuccessScreenProps) {
  const sla = getSLAPromise();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-10 rounded-2xl shadow-sm max-w-md w-full border border-slate-100">
        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <PhoneCall className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Your Advisor Has Been Notified</h2>
        <p className="text-slate-600 mb-6">
          We sent your full brief—diagnosis, preferences, and counter-offer terms—to your dedicated WindowMan advisor right now.
        </p>

        {/* Committed callback time */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 mb-6 text-left">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center">
              <PhoneCall className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">
                Calling You At
              </p>
              <p className="text-base font-semibold text-slate-900 leading-snug">
                {maskPhone(context.phone)}
              </p>
              <p className="text-sm text-amber-900 mt-1.5">{sla.text}</p>
            </div>
          </div>
        </div>

        {activeConfig && (
          <div className={`${activeConfig.accentBg} ${activeConfig.accentBorder} border rounded-lg p-4 mb-6 text-left`}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
              Your prescribed path
            </p>
            <p className="font-semibold text-slate-900">{activeConfig.guaranteeTitle}</p>
          </div>
        )}
        <p className="text-slate-600 mb-8 text-sm">
          If we miss our callback window, we'll text an apology and a reschedule link. That's the guarantee.
        </p>
        <button
          onClick={onReturn}
          className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
        >
          Return to your audit report
        </button>
      </div>
    </div>
  );
}
