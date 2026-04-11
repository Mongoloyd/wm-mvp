import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * ForensicShift Component
 * Prepared for Lovable Import
 * * Features: 
 * - Split-view document visualization (Paper vs. Digital)
 * - Gemini AI Forensic Analysis integration
 * - Responsive Tailwind CSS design
 */

const defaultData = {
  homeownerBulletPoints: [
    "Total Price: $17,400",
    "Lifetime Warranty",
    "Standard Install"
  ],
  machineBulletPoints: [
    "26% Local Markup",
    "Excludes Labor &\nService Calls",
    "Missing NOA\nReference"
  ],
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
  footerNote: "Standard install with the services listed. Lifetime Warranty applies to hardware only. Excludes labor, service calls, and acts of nature. All measurements and figures are approximate and subject to final verification. NOA references are withheld until final contract signing."
};

const DocumentContent = ({ isDigital, data, isAnalyzing }) => {
  return (
    <div 
      className={`w-full h-full p-8 flex flex-col relative transition-all duration-500
        ${isDigital 
          ? 'bg-[#0a192f] text-cyan-400 font-mono' 
          : 'bg-[#fdfbf7] text-slate-800 font-sans'
        } ${isAnalyzing ? 'blur-sm opacity-50' : 'blur-none opacity-100'}`}
      style={isDigital ? {
        backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      } : {}}
    >
      <div className="flex justify-between items-start mb-8 border-b-2 pb-6 border-current opacity-80">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 ${isDigital ? 'bg-cyan-500/20 border border-cyan-400' : 'bg-slate-800'} rounded-sm flex items-center justify-center`}>
              <div className={`w-4 h-4 ${isDigital ? 'bg-cyan-400' : 'bg-white'}`} />
            </div>
            <h2 className="text-xl font-bold tracking-wider">WINDOWMAN QUOTE</h2>
          </div>
          <div className={`text-xs ${isDigital ? 'opacity-70' : 'text-slate-500'}`}>
            <p>123 Main Street, Suite 100</p>
            <p>Miami, FL 33101</p>
            <p>License: #CGC152XXXX</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg mb-1">INVOICE</p>
          <p className={`text-sm ${isDigital ? 'opacity-70' : 'text-slate-500'}`}>Date: Oct 24, 2023</p>
          <p className={`text-sm ${isDigital ? 'opacity-70' : 'text-slate-500'}`}>Quote #: 1861</p>
        </div>
      </div>

      <div className={`grid grid-cols-12 gap-2 pb-2 mb-4 text-xs font-bold tracking-wide border-b border-current opacity-80`}>
        <div className="col-span-2">QTY</div>
        <div className="col-span-7">DESCRIPTION</div>
        <div className="col-span-3 text-right">TOTAL</div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {data.invoiceRows.map((row, idx) => (
          <div key={idx} className={`grid grid-cols-12 gap-2 text-sm ${isDigital ? 'opacity-90' : 'opacity-80'}`}>
            <div className="col-span-2">{row.qty}</div>
            <div className="col-span-7 line-clamp-1" title={row.desc}>{row.desc}</div>
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
          <span className={isDigital ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]' : ''}>{data.totalPrice}</span>
        </div>
      </div>
      
      <div className={`mt-6 text-[10px] leading-tight ${isDigital ? 'opacity-60' : 'text-slate-500'} text-justify line-clamp-4`}>
        {data.footerNote}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-8">
        <div className="border-b border-current pb-1 flex items-end h-8">
          <span className={`text-xs ${isDigital ? 'opacity-60' : 'text-slate-500'}`}>Signature</span>
          {!isDigital && <span className="ml-4 font-[cursive] text-lg text-slate-800">John Doe</span>}
        </div>
        <div className="border-b border-current pb-1 flex items-end h-8">
          <span className={`text-xs ${isDigital ? 'opacity-60' : 'text-slate-500'}`}>Date</span>
          <span className="ml-4 text-sm">{isDigital ? '2023-10-24' : '10/24/23'}</span>
        </div>
      </div>
      
      {isDigital && (
        <div className="absolute inset-0 pointer-events-none">
           <div className={`absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-400 ${isAnalyzing ? 'animate-ping' : 'opacity-50'}`} />
           <div className={`absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-400 ${isAnalyzing ? 'animate-ping' : 'opacity-50'}`} />
           <div className={`absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-400 ${isAnalyzing ? 'animate-ping' : 'opacity-50'}`} />
           <div className={`absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-400 ${isAnalyzing ? 'animate-ping' : 'opacity-50'}`} />
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [data, setData] = useState(defaultData);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [quoteText, setQuoteText] = useState(`ACME Roofers Estimate:
1x Architectural Shingles Removal - $2,500
1x Roof Decking Repair - $1,200
30x Bundles Premium Shingles - $6,000
1x Labor - INCLUDED
Taxes & Processing - $800
Estimated Local Markup fee - $1,500
Total: $12,000`);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setShowModal(false);
    setErrorMsg("");

    const apiKey = ""; // Set your API key here or via env variables
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = `You are a forensic quote analyzer AI. Analyze the following construction quote text and return a strict JSON response.
    Quote text to analyze:
    ${quoteText}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            homeownerBulletPoints: { type: "ARRAY", items: { type: "STRING" } },
            machineBulletPoints: { type: "ARRAY", items: { type: "STRING" } },
            invoiceRows: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  qty: { type: "STRING" },
                  desc: { type: "STRING" },
                  price: { type: "STRING" }
                }
              }
            },
            subtotal: { type: "STRING" },
            taxesAndFees: { type: "STRING" },
            totalPrice: { type: "STRING" },
            footerNote: { type: "STRING" }
          },
          required: ["homeownerBulletPoints", "machineBulletPoints", "invoiceRows", "subtotal", "taxesAndFees", "totalPrice", "footerNote"]
        }
      }
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const result = await response.json();
      
      if (result.candidates && result.candidates[0].content.parts[0].text) {
        setData(JSON.parse(result.candidates[0].content.parts[0].text));
      }
    } catch (err) {
      setErrorMsg("Forensic scan failed. Please check your API key or connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="font-sans bg-[#1e293b] overflow-x-hidden selection:bg-cyan-500/30">
      <header className="py-5 px-8 lg:px-12 bg-[#253245] text-white flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700/50 shadow-md z-20 gap-4">
        <h1 className="text-xl lg:text-3xl font-medium tracking-tight">
          The Forensic Shift: <span className="text-slate-300">What You See vs. What the Machine Sees</span>
        </h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-2 whitespace-nowrap"
        >
          <span>✨ Analyze Quote</span>
        </button>
      </header>

      {/* Scroll-stopping CTA banner */}
      <div className="relative py-8 px-4 flex flex-col items-center gap-5 bg-gradient-to-b from-[#253245] to-[#1e293b]">
        <p className="text-center text-white font-bold text-base sm:text-lg max-w-md leading-snug">
          Don't Sign Until You've Got Your Free{' '}
          <span className="text-cyan-400">WindowMan AI Truth Report</span> →
        </p>
        <p
          onClick={() => setShowModal(true)}
          className="text-center text-red-500 font-black text-2xl sm:text-3xl lg:text-4xl uppercase tracking-wide cursor-pointer hover:text-red-400 transition-colors leading-tight max-w-lg"
        >
          Watch A Forensic Contract Audit Live
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="w-32 h-32 rounded-full bg-red-600 hover:bg-red-500 flex flex-col items-center justify-center transition-colors animate-[red-glow_2s_ease-in-out_infinite]"
          style={{ border: '6px solid #1a1a2e' }}
        >
          <Sparkles className="w-6 h-6 text-white mb-1" />
          <span className="text-sm font-black uppercase text-white tracking-wider">Press</span>
          <span className="text-sm font-black uppercase text-white tracking-wider">HERE</span>
        </button>
      </div>

      <main className="relative flex flex-col lg:flex-row w-full min-h-[600px] sm:min-h-[700px] lg:min-h-[720px]">
        {/* Left: Homeowner */}
        <div className="w-full lg:w-1/2 bg-[#f4f4f5] flex flex-col justify-center py-16 px-8 lg:pl-16 xl:pl-24 lg:pr-[280px] z-0 transition-colors duration-700">
          <div className="max-w-md mx-auto lg:mx-0 lg:ml-auto w-full">
            <h2 className="text-2xl lg:text-3xl text-slate-600 font-semibold mb-12">Homeowner Sees:</h2>
            <div className={`space-y-10 transition-opacity duration-500 ${isAnalyzing ? 'opacity-0' : 'opacity-100'}`}>
              {data.homeownerBulletPoints.map((point, idx) => (
                <div key={`ho-${idx}`} className="text-3xl lg:text-4xl text-slate-800 font-medium whitespace-pre-line leading-tight">{point}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Machine */}
        <div className="w-full lg:w-1/2 bg-[#2a3c53] flex flex-col justify-center py-16 px-8 lg:pr-16 xl:pr-24 lg:pl-[280px] relative z-0">
          <div className="max-w-md mx-auto lg:mx-0 lg:mr-auto w-full relative z-10">
            <h2 className="text-2xl lg:text-3xl text-blue-300 font-semibold mb-12 flex items-center gap-3">
              Machine Sees:
              {isAnalyzing && <span className="w-4 h-4 border-2 border-t-cyan-400 rounded-full animate-spin" />}
            </h2>
            <div className={`space-y-10 transition-opacity duration-500 ${isAnalyzing ? 'opacity-0' : 'opacity-100'}`}>
               {data.machineBulletPoints.map((point, idx) => (
                <div key={`mc-${idx}`} className="text-3xl lg:text-4xl text-white font-medium whitespace-pre-line leading-tight">{point}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Document */}
      <div className="order-first lg:order-none relative w-[340px] sm:w-[460px] xl:w-[540px] h-[480px] sm:h-[600px] xl:h-[720px] mx-auto lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-10 my-10 lg:my-0 shadow-2xl rounded-sm shrink-0">

          <div className="relative w-full h-full rounded-sm overflow-hidden bg-black">
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
            {/* Scanning Line */}
            <div className={`absolute left-1/2 top-0 bottom-0 w-[2px] bg-cyan-300 -translate-x-1/2 z-30 shadow-[0_0_15px_3px_rgba(34,211,238,1)] ${isAnalyzing ? 'animate-[pulse_0.2s_ease-in-out_infinite]' : ''}`} />
            
            {isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/20 backdrop-blur-[2px]">
                 <div className="text-cyan-300 font-mono text-xl tracking-widest animate-pulse font-bold bg-black/50 px-6 py-3 rounded-md border border-cyan-500/50">
                    ANALYZING DATA...
                 </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Input Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-600 rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-[#253245]">
              <h3 className="text-xl font-semibold text-white">✨ Forensic Scanner</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-6">
              {errorMsg && <div className="mb-4 p-3 bg-red-500/20 text-red-200 rounded text-sm">{errorMsg}</div>}
              <textarea 
                className="w-full h-48 bg-[#0f172a] text-slate-300 border border-slate-600 rounded-md p-4 font-mono text-sm focus:outline-none focus:border-cyan-500 custom-scrollbar"
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
              />
            </div>
            <div className="px-6 py-4 border-t border-slate-700 bg-[#253245] flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="text-slate-300 hover:text-white">Cancel</button>
              <button onClick={handleAnalyze} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-md font-medium">Start AI Analysis</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(148, 163, 184, 0.3); border-radius: 10px; }
        @keyframes red-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(220,38,38,0.4), 0 0 40px rgba(220,38,38,0.2);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 35px rgba(220,38,38,0.7), 0 0 60px rgba(220,38,38,0.4);
            transform: scale(1.08);
          }
        }
      `}} />
    </div>
  );
}
