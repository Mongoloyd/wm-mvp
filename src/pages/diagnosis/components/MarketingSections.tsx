import {
  FileSearch,
  TrendingUp,
  UserCheck,
  Lock,
  Handshake,
  ShieldCheck,
} from 'lucide-react';

export function MarketingSections() {
  return (
    <>
      <section className="py-20 px-6 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">
            Why WindowMan Gets You a Better Quote
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold">✕</span>
                When You Shop Alone
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3"><span className="text-slate-400 mt-1">•</span><span className="text-slate-700">Generic bids with no context about your quote problems.</span></li>
                <li className="flex items-start gap-3"><span className="text-slate-400 mt-1">•</span><span className="text-slate-700">Contractors don't know what red flags to fix.</span></li>
                <li className="flex items-start gap-3"><span className="text-slate-400 mt-1">•</span><span className="text-slate-700">You repeat the same comparison mistakes.</span></li>
                <li className="flex items-start gap-3"><span className="text-slate-400 mt-1">•</span><span className="text-slate-700">You're alone when problems surface later.</span></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">✓</span>
                With WindowMan
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3"><span className="text-slate-400 mt-1">•</span><span className="text-slate-700">We share your audit findings upfront—contractors know exactly what to fix.</span></li>
                <li className="flex items-start gap-3"><span className="text-slate-400 mt-1">•</span><span className="text-slate-700">Our quote database gives us real market leverage.</span></li>
                <li className="flex items-start gap-3"><span className="text-slate-400 mt-1">•</span><span className="text-slate-700">We negotiate scope, warranty, and price on your behalf.</span></li>
                <li className="flex items-start gap-3"><span className="text-slate-400 mt-1">•</span><span className="text-slate-700">We stay with you through installation and beyond.</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-slate-900 font-medium text-center">
              <strong>Bottom line:</strong> You don't have market leverage. WindowMan does. Our quote data is our power, and we use it to work for you.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">We Work for You, Like a Realtor.</h2>
          <p className="mt-4 text-lg text-slate-600">Here's what that actually means.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {[
            { Icon: FileSearch, title: 'Market Intelligence', body: "Our proprietary database of thousands of audited quotes tells us what's fair, what's overpriced, and what scope gaps exist in your market." },
            { Icon: TrendingUp, title: 'Targeted Estimates', body: "We brief contractors on your audit findings. They know exactly what scope, materials, and warranties you need." },
            { Icon: Handshake, title: 'We Negotiate For You', body: 'Your advisor reviews each quote against your audit findings and market benchmarks. We negotiate on your behalf.' },
            { Icon: UserCheck, title: 'Ongoing Support', body: "We don't hand you off after the quote. Your advisor stays with you through the entire process." },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="flex gap-5">
              <div className="shrink-0 mt-1">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-600 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Why This Is a No-Brainer for You</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { Icon: Lock, title: 'Zero Financial Risk', body: "We don't charge upfront. We only make money if you're happy." },
              { Icon: ShieldCheck, title: 'No Bad Outcome', body: 'At worst, you get validation. At best, you save thousands.' },
              { Icon: Handshake, title: "You're in Control", body: 'You decide on the quote, the contractor, and the terms.' },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="bg-slate-800 p-8 rounded-xl border border-slate-700">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white mx-auto mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold mb-2 text-lg">{title}</h3>
                <p className="text-slate-300 text-sm">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
