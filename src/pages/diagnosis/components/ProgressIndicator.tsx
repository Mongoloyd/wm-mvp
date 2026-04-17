import { CheckCircle, Sparkles } from 'lucide-react';

interface ProgressIndicatorProps {
  stepNumber: number;
}

export function ProgressIndicator({ stepNumber }: ProgressIndicatorProps) {
  return (
    <div className="border-b border-slate-100 bg-white px-6 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-blue-600" />
          WindowMan Consultation
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  n < stepNumber
                    ? 'bg-blue-600 text-white'
                    : n === stepNumber
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {n < stepNumber ? <CheckCircle className="w-3.5 h-3.5" /> : n}
              </div>
              {n < 3 && <div className={`w-8 h-0.5 ${n < stepNumber ? 'bg-blue-600' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
