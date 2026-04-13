import React, { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";

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

interface QuoteSpreadShowcaseProps {
  onScanClick?: () => void;
  onDemoClick?: () => void;
}

export default function QuoteSpreadShowcase({ onScanClick, onDemoClick }: QuoteSpreadShowcaseProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isScanning, setIsScanning] = useState(true);
  const containerRef = useRef(null);

  // 3D Tilt effect based on mouse movement
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
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
      `,
        }}
      />

      {/* The 3D Scene Container */}
      <div
        className="relative w-full max-w-6xl h-full max-h-[800px] preserve-3d transition-all duration-300 ease-out flex flex-col items-center justify-center p-8"
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
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2 text-center drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
            YOUR QUOTE IS EITHER PRICED FAIRLY OR IT ISN'T.
          </h2>
          <p className="text-lg italic text-slate-300 mb-6 drop-shadow-md font-serif">
            Right Now, The Contractor Knows Which One. You Don't.
          </p>

          <div className="flex flex-col items-center space-y-4 w-full max-w-sm">
            <button
              onClick={onScanClick}
              className="btn-glossy-blue w-full py-3.5 px-6 rounded-lg font-bold text-white text-lg flex items-center justify-center group cursor-pointer"
            >
              Show Me My Grade
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
