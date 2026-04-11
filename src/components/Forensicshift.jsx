import React, { useState } from 'react';

// Default data matching the original design
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
      {/* Header section */}
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

      {/* Table Header */}
      <div className={`grid grid-cols-12 gap-2 pb-2 mb-4 text-xs font-bold tracking-wide border-b border-current opacity-80`}>
        <div className="col-span-2">QTY</div>
        <div className="col-span-7">DESCRIPTION</div>
        <div className="col-span-3 text-right">TOTAL</div>
      </div>

      {/* Table Rows */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {data.invoiceRows.map((row, idx) => (
          <div key={idx} className={`grid grid-cols-12 gap-2 text-sm ${isDigital ? 'opacity-90' : 'opacity-80'}`}>
            <div className="col-span-2">{row.qty}</div>
            <div className="col-span-7 break-words" title={row.desc}>{row.desc}</div>
            <div className="col-span-3 text-right">{row.price}</div>
          </div>
        ))}
      </div>

      {/* Totals Section */}
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
      
      {/* Footer Notes */}
      <div className={`mt-6 text-[10px] leading-tight ${isDigital ? 'opacity-60' : 'text-slate-500'} text-justify line-clamp-4`}>
        {data.footerNote}
      </div>

      {/* Signature block */}
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
      
      {/* Digital Overlay Extras */}
      {isDigital && (
        <div className="absolute inset-0 pointer-events-none">
           {/* Scan reticles */}
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
Total: $12,000
Note: Labor included for standard pitch only. Steeper pitches require $2k surcharge. Warranty void if not inspected annually.`);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setShowModal(false);
    setErrorMsg("");

    const apiKey = ""; // Gemini API key provided by environment
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const prompt = `You are a forensic quote analyzer AI. Analyze the following construction or home-improvement quote text.
    Extract the line items and calculate totals.
    More importantly, identify 3 positive, obvious things a homeowner would notice (e.g., "Total Price: $X", "Included Labor", "Premium Materials") for the homeowner summary.
    Then, act like a machine/auditor and identify 3 hidden "gotchas", hidden fees, exclusions, or markups for the machine summary.
    
    Quote text to analyze:
    ${quoteText}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            homeownerBulletPoints: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Exactly 3 short, positive-sounding bullet points a homeowner would notice. Format with line breaks if needed."
            },
            machineBulletPoints: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Exactly 3 short, critical/forensic bullet points an auditor would catch (like markups, exclusions). Format with line breaks if needed."
            },
            invoiceRows: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  qty: { type: "STRING", description: "Quantity or '-'" },
                  desc: { type: "STRING", description: "Description of item" },
                  price: { type: "STRING", description: "Price formatted with $, or INCLUDED" }
                }
              }
            },
            subtotal: { type: "STRING" },
            taxesAndFees: { type: "STRING" },
            totalPrice: { type: "STRING" },
            footerNote: { type: "STRING", description: "A summary of any fine print, exclusions, or warranty details found in the text." }
          },
          required: ["homeownerBulletPoints", "machineBulletPoints", "invoiceRows", "subtotal", "taxesAndFees", "totalPrice", "footerNote"]
        }
      }
    };

    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    let attempts = 0;
    const maxRetries = 5;
    let result = null;

    while (attempts < maxRetries) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        result = await response.json();
        break; // Success
      } catch (err) {
        attempts++;
        if (attempts >= maxRetries) {
          setErrorMsg("Failed to connect to the Gemini API after multiple attempts. Please try again later.");
          setIsAnalyzing(false);
          return;
        }
        await delay(Math.pow(2, attempts) * 1000); // Exponential backoff
      }
    }

    try {
      if (result && result.candidates && result.candidates[0].content.parts[0].text) {
        const parsedData = JSON.parse(result.candidates[0].content.parts[0].text);
        setData(parsedData);
      } else {
        throw new Error("Invalid response format from Gemini.");
      }
    } catch (err) {
      setErrorMsg("Failed to parse the forensic analysis. Please try a different quote.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#1e293b] overflow-x-hidden selection:bg-cyan-500/30">
      
      {/* Top Header Bar */}
      <header className="py-5 px-8 lg:px-12 bg-[#253245] text-white flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700/50 shadow-md z-40 gap-4">
        <h1 className="text-xl lg:text-3xl font-medium tracking-tight">
          The Forensic Shift: <span className="text-slate-300">What You See vs. What the Machine Sees</span>
        </h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] flex items-center justify-center gap-2 whitespace-nowrap min-h-[44px] min-w-[44px]"
        >
          <span>✨ Analyze Quote</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col lg:flex-row w-full">
        
        {/* === LEFT COLUMN: Homeowner === */}
        <div className="w-full lg:w-1/2 bg-[#f4f4f5] flex flex-col justify-center py-16 px-8 lg:pl-16 xl:pl-24 lg:pr-[280px] xl:pr-[300px] z-0 transition-colors duration-700">
          <div className="max-w-md mx-auto lg:mx-0 lg:ml-auto w-full">
            <h2 className="text-2xl lg:text-3xl text-slate-600 font-semibold mb-12 lg:mb-16">
              Homeowner Sees:
            </h2>
            
            <div className={`space-y-10 lg:space-y-16 transition-opacity duration-500 ${isAnalyzing ? 'opacity-0' : 'opacity-100'}`}>
              {data.homeownerBulletPoints.map((point, idx) => (
                <div key={`ho-${idx}`} className="text-2xl sm:text-3xl lg:text-4xl text-slate-800 font-medium whitespace-pre-line leading-tight">
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === RIGHT COLUMN: WindowMan === */}
        <div className="w-full lg:w-1/2 bg-[#2a3c53] flex flex-col justify-center py-16 px-8 lg:pr-16 xl:pr-24 lg:pl-[280px] xl:pl-[300px] relative z-0 transition-colors duration-700">
          
          {/* Subtle background glow effect for the right side */}
          <div className="absolute inset-0 bg-cyan-900/10 pointer-events-none" />
          
          <div className="max-w-md mx-auto lg:mx-0 lg:mr-auto w-full relative z-10">
            <h2 className="text-2xl lg:text-3xl text-blue-300 font-semibold mb-12 lg:mb-16 flex items-center gap-3">
              Machine Sees:
              {isAnalyzing && <span className="inline-block w-4 h-4 border-2 border-t-cyan-400 border-r-cyan-400 border-b-transparent border-l-transparent rounded-full animate-spin" />}
            </h2>
            
            <div className={`space-y-10 lg:space-y-16 transition-opacity duration-500 ${isAnalyzing ? 'opacity-0' : 'opacity-100'}`}>
               {data.machineBulletPoints.map((point, idx) => (
                <div key={`mc-${idx}`} className="text-2xl sm:text-3xl lg:text-4xl text-white font-medium whitespace-pre-line leading-tight">
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === CENTER DOCUMENT SPLIT VIEW === */}
        {/* Optimized Center Document Container */}
        <div className="order-first lg:order-none relative w-[95vw] max-w-[340px] sm:max-w-[460px] xl:max-w-[540px] h-[420px] sm:h-[600px] xl:h-[720px] mx-auto lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-30 my-8 lg:my-0 shadow-2xl rounded-sm shrink-0 scale-[0.9] sm:scale-100 transition-transform origin-top lg:origin-center">
          
          {/* Container for the two halves */}
          <div className="relative w-full h-full group rounded-sm overflow-hidden bg-black">
            
            {/* 1. Left Half (Paper Document) */}
            <div className="absolute top-0 left-0 w-1/2 h-full overflow-hidden border-r border-slate-300/50">
              <div className="w-[95vw] max-w-[340px] sm:max-w-[460px] xl:max-w-[540px] h-full origin-top-left">
                <DocumentContent isDigital={false} data={data} isAnalyzing={isAnalyzing} />
              </div>
            </div>

            {/* 2. Right Half (Digital Machine View) */}
            <div className="absolute top-0 right-0 w-1/2 h-full overflow-hidden bg-[#0a192f]">
              <div className="absolute right-0 top-0 w-[95vw] max-w-[340px] sm:max-w-[460px] xl:max-w-[540px] h-full origin-top-right">
                <DocumentContent isDigital={true} data={data} isAnalyzing={isAnalyzing} />
              </div>
            </div>

            {/* 3. The Scanning Laser Line */}
            <div className={`absolute left-1/2 top-0 bottom-0 w-[2px] bg-cyan-300 -translate-x-1/2 z-40
              shadow-[0_0_15px_3px_rgba(34,211,238,1),0_0_30px_10px_rgba(6,182,212,0.8)] 
              after:content-[''] after:absolute after:inset-0 after:bg-white motion-safe:transition-transform motion-reduce:transition-none
              ${isAnalyzing ? 'motion-safe:animate-[pulse_0.2s_ease-in-out_infinite] scale-x-150' : 'motion-safe:after:animate-pulse motion-reduce:opacity-80'}`} 
            />

            {/* Floating Machine Annotations (Connected to the document) */}
            <div className={`hidden lg:block absolute left-1/2 top-[15%] w-32 h-[1px] bg-cyan-400/60 z-20 transition-opacity ${isAnalyzing ? 'opacity-0' : 'opacity-100'}`}>
               <div className="absolute right-[-100px] top-[-8px] text-[10px] text-cyan-300 font-mono tracking-widest whitespace-nowrap">
                 Data features
               </div>
               <div className="absolute left-0 top-[-2px] w-[5px] h-[5px] rounded-full bg-cyan-300" />
            </div>

            <div className={`hidden lg:block absolute left-1/2 top-[35%] w-40 h-[1px] bg-cyan-400/60 z-20 transition-opacity ${isAnalyzing ? 'opacity-0' : 'opacity-100'}`}>
               <div className="absolute right-[-80px] top-[-8px] text-[10px] text-cyan-300 font-mono tracking-widest whitespace-nowrap">
                 Data Points
               </div>
               <div className="absolute left-0 top-[-2px] w-[5px] h-[5px] rounded-full bg-cyan-300" />
            </div>

            <div className={`hidden lg:block absolute left-[50%] top-[45%] w-24 h-[1px] bg-cyan-400/60 z-20 transition-opacity ${isAnalyzing ? 'opacity-0' : 'opacity-100'}`}>
               <div className="absolute right-[-110px] top-[-8px] text-[10px] text-cyan-300 font-mono tracking-widest whitespace-nowrap">
                 Anomaly Dtc...
               </div>
               <div className="absolute left-0 top-[-2px] w-[5px] h-[5px] rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,1)]" />
            </div>
            
            <div className={`hidden lg:block absolute left-[50%] top-[70%] w-48 h-[1px] bg-cyan-400/60 z-20 transition-opacity ${isAnalyzing ? 'opacity-0' : 'opacity-100'}`}>
               <div className="absolute right-[-60px] top-[-8px] text-[10px] text-cyan-300 font-mono tracking-widest whitespace-nowrap">
                 Data Ref
               </div>
               <div className="absolute left-0 top-[-2px] w-[5px] h-[5px] rounded-full bg-cyan-300" />
            </div>
            
            {/* Loading Overlay */}
            {isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-[2px]">
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
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                ✨ Gemini Forensic Scanner
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-300 mb-4 text-sm">
                Paste any construction estimate, invoice, or contract text below. The Gemini AI will extract the line items and automatically find the "Gotchas" (hidden markups, excluded warranties, etc.) that the machine sees.
              </p>
              
              {errorMsg && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded text-sm">
                  {errorMsg}
                </div>
              )}

              <textarea 
                className="w-full h-48 bg-[#0f172a] text-slate-300 border border-slate-600 rounded-md p-4 font-mono text-base focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 custom-scrollbar"
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                placeholder="Paste quote text here..."
              />
            </div>
            <div className="px-6 py-4 border-t border-slate-700 bg-[#253245] flex justify-end gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button 
                onClick={handleAnalyze}
                disabled={!quoteText.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium transition-colors shadow-[0_0_10px_rgba(6,182,212,0.2)] min-h-[44px]"
              >
                Start AI Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(148, 163, 184, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(148, 163, 184, 0.5); }
      `}} />
    </div>
  );
}
