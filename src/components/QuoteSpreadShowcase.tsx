import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  BarChart3,
  Layers,
  ScanLine,
  ArrowRight,
  Activity,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  X,
  Loader2,
  ClipboardCheck,
} from "lucide-react";

// --- MOCK DATA: The 5 confusing, disparate quotes ---
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

// --- THE MOCK ESTIMATE COMPONENT ---
const MockEstimate = ({ data }) => {
  return (
    <div
      className={`absolute left-1/2 top-[45%] ${data.animClass} z-10 transition-all duration-300 hover:z-50 cursor-pointer`}
    >
      <div
        className={`relative w-56 h-72 bg-white/95 backdrop-blur-md shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-gray-200 text-[9px] text-gray-800 p-4 flex flex-col overflow-hidden transition-transform duration-300 hover:scale-105 ${data.fontMode}`}
      >
        {/* Header */}
        <div className="flex justify-between items-end border-b-2 border-gray-300 pb-2 mb-3">
          <div>
            <h3 className="text-[11px] font-bold leading-tight uppercase">{data.company}</h3>
            <p className="text-gray-500 text-[7px] mt-1">123 Main St, FL 33062</p>
          </div>
          <div className="text-right">
            <h4 className="font-bold tracking-widest text-gray-400">ESTIMATE</h4>
            <p className="text-[7px] mt-1">No: #{Math.floor(Math.random() * 10000)}</p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="flex-1 mt-1">
          <div className="flex justify-between border-b border-gray-200 pb-1 mb-2 font-bold text-gray-500">
            <span>Description</span>
            <span>Amount</span>
          </div>
          {data.items.map((item, index) => (
            <div key={index} className="flex justify-between mb-1.5 border-b border-gray-50 border-dashed pb-1">
              <span className="truncate w-3/4 pr-2">{item.desc}</span>
              <span>{item.price}</span>
            </div>
          ))}
          {/* Fake scribbles / empty lines to make it look messy */}
          <div className="h-4 border-b border-gray-50 border-dashed mt-2"></div>
          <div className="h-4 border-b border-gray-50 border-dashed mt-2"></div>
        </div>

        {/* Footer / Total */}
        <div className="mt-auto pt-3 border-t-2 border-gray-800 flex justify-between items-center bg-gray-50 -mx-4 -mb-4 px-4 py-3">
          <span className="font-bold text-[10px]">TOTAL:</span>
          <span className="font-bold text-[13px]">{data.total}</span>
        </div>

        {/* The "Gotcha" Stamp */}
        {data.stamp && (
          <div
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-[15deg] border-[3px] rounded px-3 py-1.5 font-bold text-[10px] opacity-80 pointer-events-none whitespace-nowrap tracking-widest backdrop-blur-sm bg-white/30 ${data.stampColor}`}
          >
            {data.stamp}
          </div>
        )}

        {/* Orange light reflection on the paper */}
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-transparent pointer-events-none mix-blend-multiply" />
      </div>
    </div>
  );
};

export default function App() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isScanning, setIsScanning] = useState(true);
  const containerRef = useRef(null);

  // Modal & AI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 3D Tilt effect based on mouse movement (paused when modal is open)
  const handleMouseMove = (e) => {
    if (!containerRef.current || isModalOpen) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    setMousePos({ x, y });
  };

  useEffect(() => {
    const scanInterval = setInterval(() => {
      setIsScanning((prev) => !prev);
    }, 4000);
    return () => clearInterval(scanInterval);
  }, []);

  // Gemini API Integration
  const callGemini = async (promptText) => {
    setIsLoading(true);
    setError("");
    setAiResponse("");

    const apiKey = ""; // API Key provided by execution environment
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const systemInstruction =
      "You are an expert construction estimator and consumer advocate. The user will provide a contractor quote. Analyze it for missing details, potential hidden costs, and overall clarity. Give it a letter grade (A-F). Highlight any major red flags. Keep the response concise, formatted with clear line breaks and bullet points, and use a professional but helpful tone.";

    const payload = {
      contents: [{ parts: [{ text: promptText }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
    };

    // Exponential backoff retry logic
    const retries = 5;
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || "Failed to analyze text.");
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        setAiResponse(text);
        setIsLoading(false);
        return;
      } catch (err) {
        if (i === retries - 1) {
          setError(err.message || "An error occurred while connecting to the AI. Please try again.");
          setIsLoading(false);
        }
        // Wait before retrying (1s, 2s, 4s, 8s...)
        await new Promise((res) => setTimeout(res, Math.pow(2, i) * 1000));
      }
    }
  };

  const handleOpenModal = () => {
    setInputText("");
    setAiResponse("");
    setError("");
    setIsModalOpen(true);
    // Reset tilt so modal is flat
    setMousePos({ x: 0, y: 0 });
  };

  const handleAnalyze = () => {
    if (!inputText.trim()) {
      setError("Please enter some text to analyze.");
      return;
    }
    callGemini(inputText);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-screen bg-[#020617] overflow-hidden flex items-center justify-center font-sans perspective-1000"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }

        /* Recreated Image Buttons */
        .btn-glossy-blue {
          background: linear-gradient(to bottom, #7bb4ff 0%, #4489ff 45%, #2264ee 55%, #184ecc 100%);
          box-shadow: 
            inset 0 1px 0 rgba(255,255,255,0.6),
            inset 0 -1px 0 rgba(0,0,0,0.2),
            0 4px 10px rgba(34, 100, 238, 0.4),
            0 1px 3px rgba(0,0,0,0.3);
          border: 1px solid #1440a6;
          text-shadow: 0 -1px 1px rgba(0,0,0,0.3);
          transition: all 0.2s;
        }
        .btn-glossy-blue:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .btn-glossy-blue:active { filter: brightness(0.9); transform: translateY(1px); box-shadow: inset 0 2px 4px rgba(0,0,0,0.3); }

        .btn-glossy-orange {
          background: linear-gradient(to bottom, #ffb861 0%, #fa8733 45%, #ec6015 55%, #c74808 100%);
          box-shadow: 
            inset 0 1px 0 rgba(255,255,255,0.6),
            inset 0 -1px 0 rgba(0,0,0,0.2),
            0 4px 10px rgba(236, 96, 21, 0.4),
            0 1px 3px rgba(0,0,0,0.3);
          border: 1px solid #a63904;
          text-shadow: 0 -1px 1px rgba(0,0,0,0.3);
          transition: all 0.2s;
        }
        .btn-glossy-orange:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .btn-glossy-orange:active { filter: brightness(0.9); transform: translateY(1px); box-shadow: inset 0 2px 4px rgba(0,0,0,0.3); }

        /* Fluid Countertop Animations */
        @keyframes fluid-drift {
          0% { transform: translate(0%, 0%) scale(1); }
          33% { transform: translate(5%, 3%) scale(1.05); }
          66% { transform: translate(-3%, 4%) scale(0.95); }
          100% { transform: translate(0%, 0%) scale(1); }
        }
        .fluid-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          animation: fluid-drift 20s infinite ease-in-out;
        }

        /* Paper Drifting Animations */
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

        .liquid-texture {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.005' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.15;
          mix-blend-mode: overlay;
          pointer-events: none;
        }

        /* Glassmorphic Modal */
        .glass-modal {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        }
      `,
        }}
      />

      {/* The 3D Scene Container */}
      <div
        className={`relative w-full max-w-6xl h-full max-h-[800px] preserve-3d transition-all duration-300 ease-out flex flex-col items-center justify-center p-8 ${isModalOpen ? "scale-[0.98] opacity-50 blur-sm" : ""}`}
        style={{
          transform: `rotateX(${-mousePos.y * 10}deg) rotateY(${mousePos.x * 10}deg)`,
        }}
      >
        {/* Layer 1: The Liquid Quartz Countertop */}
        <div className="absolute inset-0 z-0 rounded-3xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-[#1e293b] bg-[#020617]">
          <div className="fluid-blob w-[800px] h-[800px] bg-[#1e1b4b] top-[-20%] left-[-10%]" />
          <div
            className="fluid-blob w-[600px] h-[600px] bg-[#172554] bottom-[-10%] right-[-10%]"
            style={{ animationDelay: "-5s", animationDirection: "reverse" }}
          />
          <div
            className="fluid-blob w-[900px] h-[700px] bg-[#312e81] top-[20%] left-[20%] opacity-50"
            style={{ animationDelay: "-10s" }}
          />

          <div className="absolute inset-0 liquid-texture" />
          <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.9)] pointer-events-none" />

          <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />
          <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-orange-400/20 rounded-full blur-[60px] mix-blend-screen pointer-events-none" />

          {/* Floating Quotes */}
          <div className="relative w-full h-full">
            {quoteData.map((quote) => (
              <MockEstimate key={quote.id} data={quote} />
            ))}
          </div>
        </div>

        {/* Layer 2: Interactive Footer */}
        <div
          className="mt-auto pointer-events-auto flex flex-col items-center z-20 w-full p-8 rounded-b-3xl bg-gradient-to-t from-[#020617] via-[#020617]/80 to-transparent"
          style={{ transform: "translateZ(40px)" }}
        >
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2 text-center drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
            YOUR QUOTE IS EITHER PRICED FAIRLY OR IT ISN'T.
          </h2>
          <p className="text-lg italic text-slate-300 mb-6 drop-shadow-md font-serif">
            Right Now, The Contractor Knows Which One. You Don't.
          </p>

          <div className="flex flex-col items-center space-y-4 w-full max-w-sm">
            <button
              onClick={handleOpenModal}
              className="btn-glossy-blue w-full py-3.5 px-6 rounded-lg font-bold text-white text-lg flex items-center justify-center group cursor-pointer"
            >
              Show Me My Grade
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* AI Features Modal Overlay */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-modal w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-blue-900/30">
              <div className="flex items-center space-x-3">
                <ClipboardCheck className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold text-white">AI Quote Grader</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
              <p className="text-slate-300 mb-4 text-sm">
                Paste your messy quote below. The AI will hunt for red flags, missing details, and grade its fairness.
              </p>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste quote details here..."
                className="w-full h-40 bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-4 font-mono text-sm"
              />

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start">
                  <AlertTriangle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {aiResponse && (
                <div className="mb-4 p-5 rounded-xl bg-slate-800/80 border border-slate-600 shadow-inner">
                  <div className="flex items-center space-x-2 mb-3 border-b border-slate-700 pb-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      AI Analysis Complete
                    </span>
                  </div>
                  <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{aiResponse}</div>
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className={`w-full py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center ${
                  isLoading
                    ? "bg-slate-700 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Grade This Quote
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
