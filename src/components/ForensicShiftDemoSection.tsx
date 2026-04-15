import { useEffect, useRef, useState } from "react";

type QuoteViewData = {
  homeownerBulletPoints: string[];
  machineBulletPoints: string[];
  invoiceRows: { qty: string; desc: string; price: string }[];
  subtotal: string;
  taxesAndFees: string;
  totalPrice: string;
  footerNote: string;
};

const defaultData: QuoteViewData = {
  homeownerBulletPoints: ["Total Price: $17,400", "Lifetime Warranty", "Standard Install"],
  machineBulletPoints: ["26% Local Markup", "Excludes Labor &\nService Calls", "Missing NOA\nReference"],
  invoiceRows: [
    { qty: "1", desc: "Standard Windows - Series 8000", price: "$4,500" },
    { qty: "4", desc: "Custom Impact Glass (Dining)", price: "$4,800" },
    { qty: "2", desc: "Sliding Door Replacements", price: "$3,200" },
    { qty: "1", desc: "Standard Installation Labor", price: "INCLUDED" },
    { qty: "1", desc: "Lifetime Limited Warranty", price: "INCLUDED" },
    { qty: "-", desc: "Permit Processing & Fees", price: "$450" },
    { qty: "1", desc: "Debris Removal & Cleanup", price: "$250" },
    { qty: "-", desc: "Structural Modification", price: "$1,800" },
    { qty: "-", desc: "Local Markup (Estimated)", price: "$2,400" },
  ],
  subtotal: "$15,000",
  taxesAndFees: "$2,400",
  totalPrice: "$17,400",
  footerNote:
    "Standard install with the services listed. Lifetime Warranty applies to hardware only. Excludes labor, service calls, and acts of nature. All measurements and figures are approximate and subject to final verification. NOA references are withheld until final contract signing.",
};

const demoVariants: QuoteViewData[] = [
  {
    homeownerBulletPoints: ["Total Price: $17,400", "Impact Glass Package", "Lifetime Warranty"],
    machineBulletPoints: ["Permit Scope\nNot Confirmed", "Markup Pattern\nDetected", "Warranty Labor\nMay Be Excluded"],
    invoiceRows: [
      { qty: "10", desc: "Impact Window Units", price: "$10,200" },
      { qty: "1", desc: "Installation Labor", price: "INCLUDED" },
      { qty: "-", desc: "Permit Processing & Fees", price: "$450" },
      { qty: "-", desc: "Debris Removal & Cleanup", price: "$250" },
      { qty: "-", desc: "Structural Modification", price: "$1,800" },
      { qty: "-", desc: "Markup Adjustment (Estimated)", price: "$2,400" },
      { qty: "-", desc: "Warranty Fine Print Exposure", price: "REVIEW" },
    ],
    subtotal: "$15,000",
    taxesAndFees: "$2,400",
    totalPrice: "$17,400",
    footerNote:
      "Machine review detected likely markup concentration, unclear permit scope, and warranty language that may exclude labor or service-call coverage. Final contract and product approvals should be verified before signing.",
  },
  {
    homeownerBulletPoints: ["Total Price: $21,900", "Custom Impact Doors", "Premium Install Package"],
    machineBulletPoints: [
      "Deposit Amount\nHigher Than Expected",
      "Glass Spec\nNot Fully Stated",
      "Change Orders\nMay Increase Cost",
    ],
    invoiceRows: [
      { qty: "6", desc: "Impact Window Units", price: "$8,900" },
      { qty: "2", desc: "Impact Sliding Door Systems", price: "$7,800" },
      { qty: "1", desc: "Installation Labor", price: "$2,400" },
      { qty: "-", desc: "Permit Processing", price: "$600" },
      { qty: "-", desc: "Disposal & Site Cleanup", price: "$350" },
      { qty: "-", desc: "Premium Project Management", price: "$1,850" },
    ],
    subtotal: "$19,950",
    taxesAndFees: "$1,950",
    totalPrice: "$21,900",
    footerNote:
      "System flagged elevated deposit exposure, incomplete glazing/spec detail, and pricing language that may allow post-measurement increases or change-order upsells.",
  },
  {
    homeownerBulletPoints: ["Total Price: $13,600", "Quick Install Timeline", "Factory Warranty Included"],
    machineBulletPoints: [
      "NOA / Approval\nReference Missing",
      "Labor Coverage\nLooks Limited",
      "Low Price May Hide\nScope Gaps",
    ],
    invoiceRows: [
      { qty: "8", desc: "Entry-Level Impact Windows", price: "$7,900" },
      { qty: "1", desc: "Basic Installation Package", price: "$2,100" },
      { qty: "-", desc: "Permit & Filing Fees", price: "$400" },
      { qty: "-", desc: "Debris Removal", price: "$200" },
      { qty: "-", desc: "Stucco / Finish Allowance", price: "$1,000" },
      { qty: "-", desc: "Freight / Delivery", price: "$650" },
    ],
    subtotal: "$12,250",
    taxesAndFees: "$1,350",
    totalPrice: "$13,600",
    footerNote:
      "The machine sees missing product approval references, limited labor/warranty clarity, and a low-price structure that may exclude finish work or required scope items.",
  },
];

type DocumentContentProps = {
  isDigital: boolean;
  data: QuoteViewData;
  isAnalyzing: boolean;
};

function DocumentContent({ isDigital, data, isAnalyzing }: DocumentContentProps) {
  return (
    <div
      className={`w-full h-full p-8 flex flex-col relative transition-all duration-500 ${
        isDigital ? "bg-[#0a192f] text-cyan-400 font-mono" : "bg-[#fdfbf7] text-slate-800 font-sans"
      } ${isAnalyzing ? "blur-sm opacity-50" : "blur-none opacity-100"}`}
      style={
        isDigital
          ? {
              backgroundImage:
                "linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }
          : {}
      }
    >
      <div className="flex justify-between items-start mb-8 border-b-2 pb-6 border-current opacity-80">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-8 h-8 ${
                isDigital ? "bg-cyan-500/20 border border-cyan-400" : "bg-slate-800"
              } rounded-sm flex items-center justify-center`}
            >
              <div className={`w-4 h-4 ${isDigital ? "bg-cyan-400" : "bg-white"}`} />
            </div>
            <h2 className="text-xl font-bold tracking-wider">WINDOWMAN QUOTE</h2>
          </div>
          <div className={`text-xs ${isDigital ? "opacity-70" : "text-slate-500"}`}>
            <p>123 Main Street, Suite 100</p>
            <p>Miami, FL 33101</p>
            <p>License: #CGC152XXXX</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg mb-1">INVOICE</p>
          <p className={`text-sm ${isDigital ? "opacity-70" : "text-slate-500"}`}>Date: Oct 24, 2023</p>
          <p className={`text-sm ${isDigital ? "opacity-70" : "text-slate-500"}`}>Quote #: 1861</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-2 pb-2 mb-4 text-xs font-bold tracking-wide border-b border-current opacity-80">
        <div className="col-span-2">QTY</div>
        <div className="col-span-7">DESCRIPTION</div>
        <div className="col-span-3 text-right">TOTAL</div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {data.invoiceRows.map((row, idx) => (
          <div key={idx} className={`grid grid-cols-12 gap-2 text-sm ${isDigital ? "opacity-90" : "opacity-80"}`}>
            <div className="col-span-2">{row.qty}</div>
            <div className="col-span-7 line-clamp-1" title={row.desc}>
              {row.desc}
            </div>
            <div className="col-span-3 text-right">{row.price}</div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t-2 border-current opacity-80">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold">Subtotal</span>
          <span>{data.subtotal}</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold">Taxes & Fees</span>
          <span>{data.taxesAndFees}</span>
        </div>
        <div className="flex justify-between items-center text-xl font-bold border-t border-current pt-2">
          <span>Total Price</span>
          <span className={isDigital ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]" : ""}>
            {data.totalPrice}
          </span>
        </div>
      </div>

      <div
        className={`mt-6 text-[10px] leading-tight ${
          isDigital ? "opacity-60" : "text-slate-500"
        } text-justify line-clamp-4`}
      >
        {data.footerNote}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-8">
        <div className="border-b border-current pb-1 flex items-end h-8">
          <span className={`text-xs ${isDigital ? "opacity-60" : "text-slate-500"}`}>Signature</span>
          {!isDigital && <span className="ml-4 font-[cursive] text-lg text-slate-800">John Doe</span>}
        </div>
        <div className="border-b border-current pb-1 flex items-end h-8">
          <span className={`text-xs ${isDigital ? "opacity-60" : "text-slate-500"}`}>Date</span>
          <span className="ml-4 text-sm">{isDigital ? "2023-10-24" : "10/24/23"}</span>
        </div>
      </div>

      {isDigital && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className={`absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-400 ${isAnalyzing ? "animate-ping" : "opacity-50"}`}
          />
          <div
            className={`absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-400 ${isAnalyzing ? "animate-ping" : "opacity-50"}`}
          />
          <div
            className={`absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-400 ${isAnalyzing ? "animate-ping" : "opacity-50"}`}
          />
          <div
            className={`absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-400 ${isAnalyzing ? "animate-ping" : "opacity-50"}`}
          />
        </div>
      )}
    </div>
  );
}

type ForensicShiftDemoSectionProps = {
  className?: string;
  onUploadClick?: () => void;
};

export default function ForensicShiftDemoSection({ className = "", onUploadClick }: ForensicShiftDemoSectionProps) {
  const [data, setData] = useState<QuoteViewData>(defaultData);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [showUploadCta, setShowUploadCta] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [quoteText, setQuoteText] = useState(`ACME Windows Estimate:
10x Impact Window Package - $10,200
Installation Labor - INCLUDED
Permit Processing & Fees - $450
Debris Removal & Cleanup - $250
Structural Modification - $1,800
Estimated Local Markup - $2,400
Total: $17,400
Note: Lifetime warranty applies to parts. Service calls and some labor coverage may be excluded.`);
  const timerRef = useRef<number | null>(null);
  const ctaTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (ctaTimerRef.current) window.clearTimeout(ctaTimerRef.current);
    };
  }, []);

  const handleAnalyze = () => {
    if (isAnalyzing || !quoteText.trim()) return;

    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (ctaTimerRef.current) window.clearTimeout(ctaTimerRef.current);

    setShowModal(false);
    setIsAnalyzing(true);
    setHasAnalyzed(false);
    setShowUploadCta(false);

    const nextVariant = demoVariants[demoIndex];

    timerRef.current = window.setTimeout(() => {
      setData(nextVariant);
      setHasAnalyzed(true);
      setIsAnalyzing(false);
      setDemoIndex((prev) => (prev + 1) % demoVariants.length);

      ctaTimerRef.current = window.setTimeout(() => {
        setShowUploadCta(true);
      }, 250);
    }, 3000);
  };

  const handleReset = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (ctaTimerRef.current) window.clearTimeout(ctaTimerRef.current);

    setData(defaultData);
    setHasAnalyzed(false);
    setShowUploadCta(false);
    setIsAnalyzing(false);
    setShowModal(false);
  };

  return (
    <section
      className={`relative w-full overflow-hidden rounded-[28px] border border-slate-700/50 bg-[#1e293b] shadow-[0_30px_80px_rgba(0,0,0,0.45)] selection:bg-cyan-500/30 ${className}`}
    >
      <header className="py-5 px-6 lg:px-12 bg-[#253245] text-white flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700/50 shadow-md gap-4">
        <h1 className="text-xl lg:text-3xl font-medium tracking-tight">
          The Forensic Shift: <span className="text-slate-300">What You See vs. What the Machine Sees</span>
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          {hasAnalyzed && (
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-md border border-slate-500/60 text-slate-100 hover:bg-slate-700/40 transition-colors text-sm font-medium"
            >
              Reset Demo
            </button>
          )}

          <button
            onClick={() => setShowModal(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] flex items-center gap-2 whitespace-nowrap"
          >
            <span>✨ Analyze Quote</span>
          </button>
        </div>
      </header>

      <main className="relative flex flex-col lg:flex-row w-full min-h-[1200px] lg:min-h-[980px]">
        <div className="w-full lg:w-1/2 bg-[#f4f4f5] flex flex-col justify-center py-16 px-8 lg:pl-16 xl:pl-24 lg:pr-[280px] xl:pr-[300px] z-0 transition-colors duration-700">
          <div className="max-w-md mx-auto lg:mx-0 lg:ml-auto w-full">
            <h2 className="text-2xl lg:text-3xl text-slate-600 font-semibold mb-12 lg:mb-16">Homeowner Sees:</h2>

            <div
              className={`space-y-10 lg:space-y-16 transition-opacity duration-500 ${isAnalyzing ? "opacity-0" : "opacity-100"}`}
            >
              {data.homeownerBulletPoints.map((point, idx) => (
                <div
                  key={`ho-${idx}`}
                  className="text-3xl lg:text-4xl text-slate-800 font-medium whitespace-pre-line leading-tight"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 bg-[#2a3c53] flex flex-col justify-center py-16 px-8 lg:pr-16 xl:pr-24 lg:pl-[280px] xl:pl-[300px] relative z-0 transition-colors duration-700">
          <div className="absolute inset-0 bg-cyan-900/10 pointer-events-none" />

          <div className="max-w-md mx-auto lg:mx-0 lg:mr-auto w-full relative z-10">
            <h2 className="text-2xl lg:text-3xl text-blue-300 font-semibold mb-12 lg:mb-16 flex items-center gap-3">
              Machine Sees:
              {isAnalyzing && (
                <span className="inline-block w-4 h-4 border-2 border-t-cyan-400 border-r-cyan-400 border-b-transparent border-l-transparent rounded-full animate-spin" />
              )}
            </h2>

            <div
              className={`space-y-10 lg:space-y-16 transition-opacity duration-500 ${isAnalyzing ? "opacity-0" : "opacity-100"}`}
            >
              {data.machineBulletPoints.map((point, idx) => (
                <div
                  key={`mc-${idx}`}
                  className="text-3xl lg:text-4xl text-white font-medium whitespace-pre-line leading-tight"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="order-first lg:order-none relative w-[340px] sm:w-[460px] xl:w-[540px] h-[480px] sm:h-[600px] xl:h-[720px] mx-auto lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-10 my-10 lg:my-0 shadow-2xl rounded-sm shrink-0">
          <div className="relative w-full h-full group rounded-sm overflow-hidden bg-black">
            <div className="absolute top-0 left-0 w-1/2 h-full overflow-hidden border-r border-slate-300/50">
              <div className="w-[340px] sm:w-[460px] xl:w-[540px] h-full origin-top-left">
                <DocumentContent isDigital={false} data={data} isAnalyzing={isAnalyzing} />
              </div>
            </div>

            <div className="absolute top-0 right-0 w-1/2 h-full overflow-hidden bg-[#0a192f]">
              <div className="absolute right-0 top-0 w-[340px] sm:w-[460px] xl:w-[540px] h-full origin-top-right">
                <DocumentContent isDigital={true} data={data} isAnalyzing={isAnalyzing} />
              </div>
            </div>

            <div
              className={`absolute left-1/2 top-0 bottom-0 w-[2px] bg-cyan-300 -translate-x-1/2 z-30 shadow-[0_0_15px_3px_rgba(34,211,238,1),0_0_30px_10px_rgba(6,182,212,0.8)] after:content-[''] after:absolute after:inset-0 after:bg-white ${
                isAnalyzing ? "animate-[pulse_0.2s_ease-in-out_infinite] scale-x-150" : "after:animate-pulse"
              }`}
            />

            <div
              className={`hidden lg:block absolute left-1/2 top-[15%] w-32 h-[1px] bg-cyan-400/60 z-20 transition-opacity ${isAnalyzing ? "opacity-0" : "opacity-100"}`}
            >
              <div className="absolute right-[-100px] top-[-8px] text-[10px] text-cyan-300 font-mono tracking-widest whitespace-nowrap">
                Data features
              </div>
              <div className="absolute left-0 top-[-2px] w-[5px] h-[5px] rounded-full bg-cyan-300" />
            </div>

            <div
              className={`hidden lg:block absolute left-1/2 top-[35%] w-40 h-[1px] bg-cyan-400/60 z-20 transition-opacity ${isAnalyzing ? "opacity-0" : "opacity-100"}`}
            >
              <div className="absolute right-[-80px] top-[-8px] text-[10px] text-cyan-300 font-mono tracking-widest whitespace-nowrap">
                Data Points
              </div>
              <div className="absolute left-0 top-[-2px] w-[5px] h-[5px] rounded-full bg-cyan-300" />
            </div>

            <div
              className={`hidden lg:block absolute left-[50%] top-[45%] w-24 h-[1px] bg-cyan-400/60 z-20 transition-opacity ${isAnalyzing ? "opacity-0" : "opacity-100"}`}
            >
              <div className="absolute right-[-110px] top-[-8px] text-[10px] text-cyan-300 font-mono tracking-widest whitespace-nowrap">
                Anomaly Dtc...
              </div>
              <div className="absolute left-0 top-[-2px] w-[5px] h-[5px] rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,1)]" />
            </div>

            <div
              className={`hidden lg:block absolute left-[50%] top-[70%] w-48 h-[1px] bg-cyan-400/60 z-20 transition-opacity ${isAnalyzing ? "opacity-0" : "opacity-100"}`}
            >
              <div className="absolute right-[-60px] top-[-8px] text-[10px] text-cyan-300 font-mono tracking-widest whitespace-nowrap">
                Data Ref
              </div>
              <div className="absolute left-0 top-[-2px] w-[5px] h-[5px] rounded-full bg-cyan-300" />
            </div>

            {isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/20 backdrop-blur-[2px]">
                <div className="text-cyan-300 font-mono text-xl tracking-widest animate-pulse font-bold bg-black/50 px-6 py-3 rounded-md border border-cyan-500/50">
                  ANALYZING DATA...
                </div>
              </div>
            )}

            {hasAnalyzed && !isAnalyzing && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
                <div
                  className={`pointer-events-auto flex flex-col items-center gap-3 rounded-2xl border border-cyan-400/30 bg-slate-950/85 backdrop-blur-md px-6 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition-all duration-500 ease-out ${
                    showUploadCta ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-3"
                  }`}
                >
                  <p className="text-center text-white text-lg md:text-xl font-semibold leading-tight">
                    Now Upload Your Quote
                  </p>
                  <p className="text-center text-slate-300 text-sm max-w-[320px] leading-relaxed">
                    See What The AI Extracts Off Your Actual Estimate.
                  </p>
                  <button
                    onClick={onUploadClick}
                    className="mt-1 inline-flex items-center justify-center rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-3 text-sm md:text-base transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)]"
                  >
                    Upload Your Quote
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="absolute bottom-6 right-8 hidden md:flex items-center gap-2 opacity-60 z-20 pointer-events-none">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-5 h-5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
        <span className="text-white font-semibold tracking-wide text-sm">WindowMan Demo</span>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-600 rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-[#253245]">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">✨ Forensic Scanner Demo</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <p className="text-slate-300 mb-4 text-sm">
                Paste quote text below and run the local demo. This version does not call any API. It simply simulates
                the machine-read experience.
              </p>

              <textarea
                className="w-full h-48 bg-[#0f172a] text-slate-300 border border-slate-600 rounded-md p-4 font-mono text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 custom-scrollbar"
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                placeholder="Paste quote text here..."
              />
            </div>

            <div className="px-6 py-4 border-t border-slate-700 bg-[#253245] flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !quoteText.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium transition-colors shadow-[0_0_10px_rgba(6,182,212,0.2)]"
              >
                {isAnalyzing ? "Analyzing..." : "Start Demo Analysis"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(148, 163, 184, 0.3); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(148, 163, 184, 0.5); }
          `,
        }}
      />
    </section>
  );
}
