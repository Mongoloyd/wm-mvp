import React, { useState, useRef } from "react";

interface QuoteSpreadShowcaseProps {
  onScanClick: () => void;
  onDemoClick: () => void;
}

const quoteData = [
  {
    id: 1,
    animClass: "paper-1",
    company: "South Florida Openings",
    fontMode: "font-sans",
    items: [
      { desc: "Impact Laminated Glass (10x)", price: "$12,500.00" },
      { desc: "Standard Installation", price: "$3,500.00" },
      { desc: "County Permits", price: "$800.00" },
    ],
    total: "$16,800.00",
    stamp: "60% NON-REFUNDABLE DEPOSIT",
    stampColor: "text-red-500 border-red-500",
  },
  {
    id: 2,
    animClass: "paper-2",
    company: "Impact Shield Solutions",
    fontMode: "font-serif",
    items: [
      { desc: "Custom Windows + Doors", price: "$11,500.00" },
      { desc: "Labor & Disposal", price: "???" },
      { desc: "Materials", price: "???" },
    ],
    total: "$14,100.00",
    stamp: "SUBJECT TO REMEASURE",
    stampColor: "text-orange-500 border-orange-500",
  },
  {
    id: 3,
    animClass: "paper-3",
    company: "Coastal Glass Co.",
    fontMode: "font-mono",
    items: [
      { desc: "Materials (Vague List)", price: "$19,500" },
      { desc: "Misc. Labor", price: "Included" },
    ],
    total: "$19,500.00",
    stamp: "BALANCE DUE ON INSTALL",
    stampColor: "text-blue-500 border-blue-500",
  },
  {
    id: 4,
    animClass: "paper-4",
    company: "Apex Impact Windows",
    fontMode: "font-sans",
    items: [
      { desc: "Window Package (10 Openings)", price: "$9,000.00" },
      { desc: "Tear Out & Stucco", price: "Excluded" },
      { desc: "Permit Runner Fee", price: "$400.00" },
    ],
    total: "$9,400.00",
    stamp: "MISSING NOA CODES",
    stampColor: "text-red-600 border-red-600",
  },
  {
    id: 5,
    animClass: "paper-5",
    company: "ValueLine Installs",
    fontMode: "font-serif",
    items: [
      { desc: "Glass Only (No Frames)", price: "$8,500.00" },
      { desc: "Haul Away", price: "$500.00" },
    ],
    total: "$9,000.00",
    stamp: "TEMPERED ONLY RISK",
    stampColor: "text-purple-500 border-purple-500",
  },
];

interface MockEstimateProps {
  data: (typeof quoteData)[number];
}

const MockEstimate = ({ data }: MockEstimateProps) => (
  <div
    className={`absolute top-1/2 left-1/2 w-[260px] sm:w-[300px] ${data.animClass}`}
    style={{ willChange: "transform" }}
  >
    <div
      className={`relative bg-white rounded-lg shadow-2xl border border-slate-200/60 p-4 sm:p-5 ${data.fontMode}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3 pb-2 border-b border-slate-200">
        <div>
          <p className="font-bold text-slate-800 text-sm leading-tight">
            {data.company}
          </p>
          <p className="text-[10px] text-slate-400">123 Main St, FL 33062</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-500 uppercase">
            Estimate
          </p>
          <p className="text-[10px] text-slate-400">
            #{Math.floor(1000 + data.id * 2137)}
          </p>
        </div>
      </div>

      {/* Line Items */}
      <div className="space-y-1.5 mb-3 text-xs">
        <div className="flex justify-between font-semibold text-slate-500 uppercase text-[10px]">
          <span>Description</span>
          <span>Amount</span>
        </div>
        {data.items.map((item, i) => (
          <div key={i} className="flex justify-between text-slate-700">
            <span className="truncate pr-2">{item.desc}</span>
            <span className="font-medium whitespace-nowrap">{item.price}</span>
          </div>
        ))}
        {/* Filler lines */}
        <div className="h-2 w-3/4 bg-slate-100 rounded" />
        <div className="h-2 w-1/2 bg-slate-50 rounded" />
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-2 border-t-2 border-slate-900 font-bold text-slate-900">
        <span className="text-xs uppercase">Total:</span>
        <span className="text-base">{data.total}</span>
      </div>

      {/* Gotcha Stamp */}
      {data.stamp && (
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-2 rounded px-3 py-1 text-[10px] font-black uppercase tracking-wider opacity-60 pointer-events-none whitespace-nowrap ${data.stampColor}`}
        >
          {data.stamp}
        </div>
      )}

      {/* Orange light reflection */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-orange-100/20 via-transparent to-transparent pointer-events-none" />
    </div>
  </div>
);

const QuoteSpreadShowcase = ({
  onScanClick,
  onDemoClick,
}: QuoteSpreadShowcaseProps) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const { left, top, width, height } =
      containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    setMousePos({ x, y });
  };

  return (
    <section className="relative w-full overflow-hidden">
      {/* Keyframe animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes drift-paper-1 {
          0%, 100% { transform: translate(-50%, -50%) translate(-200px, -100px) rotate(-12deg) scale(1); }
          50% { transform: translate(-50%, -50%) translate(-160px, -60px) rotate(-2deg) scale(1.05); }
        }
        @keyframes drift-paper-2 {
          0%, 100% { transform: translate(-50%, -50%) translate(150px, -150px) rotate(5deg) scale(1); }
          50% { transform: translate(-50%, -50%) translate(110px, -110px) rotate(15deg) scale(0.95); }
        }
        @keyframes drift-paper-3 {
          0%, 100% { transform: translate(-50%, -50%) translate(-50px, 100px) rotate(-4deg) scale(1); }
          50% { transform: translate(-50%, -50%) translate(-10px, 140px) rotate(-12deg) scale(1.03); }
        }
        @keyframes drift-paper-4 {
          0%, 100% { transform: translate(-50%, -50%) translate(250px, 80px) rotate(18deg) scale(1); }
          50% { transform: translate(-50%, -50%) translate(190px, 110px) rotate(8deg) scale(0.97); }
        }
        @keyframes drift-paper-5 {
          0%, 100% { transform: translate(-50%, -50%) translate(-250px, 150px) rotate(-22deg) scale(1); }
          50% { transform: translate(-50%, -50%) translate(-200px, 190px) rotate(-14deg) scale(1.04); }
        }
        .paper-1 { animation: drift-paper-1 14s ease-in-out infinite; }
        .paper-2 { animation: drift-paper-2 18s ease-in-out infinite 1s; }
        .paper-3 { animation: drift-paper-3 22s ease-in-out infinite 2s; }
        .paper-4 { animation: drift-paper-4 16s ease-in-out infinite 0.5s; }
        .paper-5 { animation: drift-paper-5 19s ease-in-out infinite 1.5s; }
      `,
        }}
      />

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative"
        style={{ perspective: "1200px" }}
      >
        {/* 3D Scene */}
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            transform: `rotateY(${mousePos.x * 4}deg) rotateX(${-mousePos.y * 4}deg)`,
            transition: "transform 0.15s ease-out",
          }}
        >
          {/* Dark liquid-quartz background */}
          <div className="relative min-h-[600px] sm:min-h-[700px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Gradient blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] opacity-[0.12]" />
              <div className="absolute top-[20%] right-[-10%] w-[35rem] h-[35rem] bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] opacity-[0.10]" />
              <div className="absolute bottom-[-10%] left-[20%] w-[45rem] h-[45rem] bg-teal-400 rounded-full mix-blend-screen filter blur-[100px] opacity-[0.08]" />
            </div>

            {/* Noise texture overlay */}
            <div
              className="absolute inset-0 opacity-[0.12] mix-blend-overlay pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.005' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Floating quote papers */}
            <div className="relative w-full h-[400px] sm:h-[460px]">
              {quoteData.map((quote) => (
                <MockEstimate key={quote.id} data={quote} />
              ))}
            </div>

            {/* Footer with headline + CTAs */}
            <div className="relative z-10 px-6 pb-10 sm:pb-14 text-center">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-tight mb-3">
                Your quote is either priced fairly or it isn't.
              </h3>
              <p className="text-base sm:text-lg text-slate-300 font-medium mb-8 max-w-xl mx-auto">
                Right Now, The Contractor Knows Which One.{" "}
                <span className="text-white font-bold">You Don't.</span>
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                <button
                  onClick={onScanClick}
                  className="w-full sm:w-auto py-3.5 px-8 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  Show Me My Grade →
                </button>
                <button
                  onClick={onDemoClick}
                  className="w-full sm:w-auto py-3.5 px-8 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  See the AI in Action ✨
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuoteSpreadShowcase;
