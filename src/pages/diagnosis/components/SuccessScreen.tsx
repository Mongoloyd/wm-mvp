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
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden"
      style={{ background: 'linear-gradient(170deg, #dce8f4 0%, #e4edf6 30%, #eaeff8 60%, #dde6f2 100%)' }}
    >
      {/* Soft cobalt ambient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 30% 20%, rgba(30,80,180,0.08) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(6,182,212,0.06) 0%, transparent 55%)',
        }}
      />

      <div className="card-raised-hero p-10 rounded-2xl max-w-md w-full border-double border-4 border-cobalt/15 relative z-10">
        <div
          className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6"
          style={{
            background: 'linear-gradient(180deg, #6bb8ff 0%, #3b82f6 40%, #1d4ed8 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 12px rgba(37,99,235,0.3)',
          }}
        >
          <PhoneCall className="w-8 h-8 text-white" />
        </div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground mb-3">
          Your Advisor Has Been Notified
        </h2>
        <p className="text-foreground/75 mb-6">
          We sent your full brief—diagnosis, preferences, and counter-offer terms—to your dedicated WindowMan advisor right now.
        </p>

        {/* Committed callback time */}
        <div
          className="rounded-xl p-5 mb-6 text-left"
          style={{
            background: 'linear-gradient(180deg, hsl(38 92% 96%) 0%, hsl(38 92% 92%) 100%)',
            border: '1px solid hsl(38 92% 60%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(180deg, hsl(38 92% 60%) 0%, hsl(38 92% 50%) 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 6px hsla(38 92% 50% / 0.3)',
              }}
            >
              <PhoneCall className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="wm-eyebrow uppercase mb-1" style={{ color: 'hsl(38 92% 32%)' }}>
                Calling You At
              </p>
              <p className="text-base font-semibold text-foreground leading-snug">
                {maskPhone(context.phone)}
              </p>
              <p className="text-sm mt-1.5" style={{ color: 'hsl(38 92% 28%)' }}>{sla.text}</p>
            </div>
          </div>
        </div>

        {activeConfig && (
          <div
            className={`${activeConfig.accentBg} ${activeConfig.accentBorder} border rounded-lg p-4 mb-6 text-left`}
          >
            <p className="wm-eyebrow uppercase text-muted-foreground mb-1">
              Your prescribed path
            </p>
            <p className="font-semibold text-foreground">{activeConfig.guaranteeTitle}</p>
          </div>
        )}
        <p className="text-foreground/75 mb-8 text-sm">
          If we miss our callback window, we'll text an apology and a reschedule link. That's the guarantee.
        </p>
        <button
          onClick={onReturn}
          className="text-cobalt font-medium hover:text-cobalt-dim transition-colors"
        >
          Return to your audit report
        </button>
      </div>
    </div>
  );
}
