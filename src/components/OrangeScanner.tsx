import React, { useState, useEffect } from 'react';
import { AlertTriangle, BrainCircuit, Cpu, Scan, ChevronRight, FileText, Zap, Shield, Search, ShieldCheck, Activity, ShieldAlert, ZoomIn, AlertOctagon, ArrowRight } from 'lucide-react';

const ESTIMATE_DATA = {
  client: "Nexus Residential Holdings",
  date: "October 24, 2026",
  ref: "#WIN-9928-EXT",
  contractor: "Elite Panes & Glass",
  license: "LIC# ABC-99120", // ANOMALY: Letters in license
  items: [
    { id: 1, label: "Lead-Safe Work Practices (EPA RRP)", cost: 450.00, status: "ok" },
    { id: 2, label: "Series 8000 Vinyl Double-Hung (Qty: 12)", cost: 9600.00, status: "ok" },
    { id: 3, label: "Low-E Argon High-Altitude Glazing", cost: 2100.00, status: "ok" },
    { id: 4, label: "Structural DP-15 Performance Rating", cost: 1200.00, status: "warning", 
      note: "Substandard DP rating for Coastal Zone. Minimum DP-40 required by local code." },
    { id: 5, label: "Custom Aluminum Exterior Capping", cost: 14200.00, status: "warning", 
      note: "Price variance 450% above regional labor average." },
    { id: 6, label: "Pre-Installation Deposit (75%)", cost: 20662.50, status: "warning", 
      note: "Excessive deposit flag. Industry standard is 10-33%." },
    { id: 7, label: "Full-Frame Debris Disposal & Tax", cost: 840.75, status: "ok" },
  ],
  subtotal: 28390.75,
  total: 30804.00
};

// --- PHASE 2: TRUST SCORE WIDGET ---
const TrustScoreWidget = ({ isScanning, activeAnomalies }) => {
  // Score is calculated dynamically. Starts at 95, drops 12 points per anomaly.
  const score = Math.max(0, 95 - (activeAnomalies.length * 12)); 
  
  const [currentCheck, setCurrentCheck] = useState(0);
  const [logs, setLogs] = useState([
    { id: 1, text: "DBPR Database Connection: ESTABLISHED", type: "success" }
  ]);

  const backgroundChecks = [
    { label: "BBB Rating", status: "A+", detail: "No unresolved complaints" },
    { label: "GL Insurance", status: "VALID", detail: "$2M Aggregate Policy" },
    { label: "Workers Comp", status: "EXEMPT", detail: "Verified via Sunbiz.org" },
    { label: "Litigation History", status: "CLEAN", detail: "0 matches in Civil Court" }
  ];

  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setCurrentCheck(prev => {
          const next = (prev + 1) % backgroundChecks.length;
          
          const newLog = {
            id: Date.now(),
            text: `Querying ${backgroundChecks[next].label}... MATCH FOUND`,
            type: "info"
          };
          
          // Keep last 5 logs for the terminal effect
          setLogs(currentLogs => [newLog, ...currentLogs].slice(0, 5));
          return next;
        });
      }, 1200);

      return () => clearInterval(interval);
    }
  }, [isScanning]); // No longer depends on closure variables unnecessarily

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden shadow-xl flex flex-col">
      {/* Header with Fluctuating Gauge */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div>
          <h4 className="text-[10px] uppercase tracking-tighter text-slate-500 mb-1">Contractor Integrity Score</h4>
          <div className="text-3xl font-black font-mono flex items-baseline">
            <span className={`transition-colors duration-500 ${score < 70 ? 'text-red-500' : score < 85 ? 'text-orange-400' : 'text-cyan-400'}`}>
              {score}
            </span>
            <span className="text-xs text-slate-600 ml-1">/100</span>
          </div>
        </div>
        <div className="relative h-12 w-12 flex items-center justify-center">
          <Activity className={`absolute transition-colors duration-500 opacity-20 ${isScanning ? 'animate-ping' : ''} ${score < 70 ? 'text-red-500' : 'text-cyan-500'}`} size={40} />
          <ShieldCheck className={`transition-colors duration-500 ${score < 70 ? 'text-red-500' : score < 85 ? 'text-orange-400' : 'text-cyan-400'}`} size={24} />
        </div>
      </div>

      {/* Live "Scrape" Ticker */}
      <div className="p-4 space-y-3 bg-black/20">
        <div className="flex items-center gap-2 text-[10px] text-cyan-500/70 font-bold uppercase mb-2">
          <Search size={12} className={isScanning ? 'animate-spin' : ''} /> 
          Deep Web Background Audit
        </div>
        
        {backgroundChecks.map((check, index) => (
          <div key={index} className={`flex justify-between items-center text-xs p-2 rounded transition-all duration-300 ${currentCheck === index ? 'bg-cyan-500/10 border border-cyan-500/30 scale-[1.02]' : 'opacity-40 border border-transparent'}`}>
            <span className="text-slate-300 font-medium">{check.label}</span>
            <div className="text-right">
              <div className="font-bold text-cyan-400 tracking-wider">{check.status}</div>
              <div className="text-[8px] text-slate-500 uppercase">{check.detail}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Terminal Log */}
      <div className="p-3 bg-slate-950 font-mono text-[9px] md:text-[10px] h-24 flex flex-col justify-end border-t border-slate-800/80 shadow-inner">
        <div className="flex flex-col-reverse gap-1">
          {logs.map((log, idx) => (
            <div key={log.id} className={`text-slate-500 leading-tight transition-opacity duration-300 ${idx === 0 ? 'text-cyan-400' : 'opacity-60'}`}>
              <span className="text-cyan-900 mr-2">[{new Date().toLocaleTimeString([], {hour12: false})}]</span>
              {log.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- PHASE 3: FINE PRINT SCANNER ---
const FinePrintScanner = ({ scanProgress, isScanning }) => {
  const [zoomActive, setZoomActive] = useState(false);
  
  // Trigger zoom when scan reaches the bottom section (e.g., 82%)
  useEffect(() => {
    if (scanProgress > 82) setZoomActive(true);
    else setZoomActive(false);
  }, [scanProgress]);

  const traps = [
    "Subject to 15% price increase upon delivery based on material surcharges.",
    "Contractor holds zero liability for structural rot discovered during tear-out.",
    "Failure to provide water/power access results in $500/day mobilization fee."
  ];

  return (
    <div className="mt-8 pt-6 border-t border-slate-200 relative pb-10">
      <h5 className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
        <ZoomIn size={10} /> Standard Terms & Conditions (v2.04)
      </h5>
      
      {/* The "Tiny" Text */}
      <div className="text-[6px] leading-[8px] text-slate-400 font-serif select-none">
        {traps.map((text, i) => (
          <p key={i} className="mb-1 opacity-60 italic">{text}</p>
        ))}
        <p className="opacity-30">All warranties are non-transferable and subject to arbitration in the state of Delaware. Customer agrees to indemnify... [Content Truncated]</p>
      </div>

      {/* The Magnifier Lens */}
      {zoomActive && isScanning && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 z-40 flex items-center justify-center pointer-events-none w-[110%]"
          style={{ top: `${Math.min(50, (scanProgress - 82) * 4)}px` }} // Moves with the scan line but caps to stay in bounds
        >
          {/* Lens Body */}
          <div className="w-full h-24 bg-white/95 shadow-[0_20px_50px_rgba(239,68,68,0.3)] border-y-2 border-red-500 backdrop-blur-md relative overflow-hidden flex flex-col justify-center px-8 animate-in zoom-in duration-300">
            
            {/* Scanned/Enlarged Text */}
            <div className="text-red-600 font-bold text-xs uppercase mb-1 flex items-center gap-2">
              <ShieldAlert size={14} className="animate-pulse" /> Hidden Liability Detected
            </div>
            
            <div className="text-slate-900 font-bold text-lg leading-tight tracking-tight">
              {/* Highlight the specific trap being scanned */}
              {scanProgress > 88 ? (
                 <span className="bg-red-200 px-1 italic">"...responsible for ALL structural rot costs"</span>
              ) : (
                 <span className="bg-red-200 px-1">"Subject to 15% price increase..."</span>
              )}
            </div>

            {/* Corner Brackets for that 'Tech' look */}
            <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-red-500" />
            <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-red-500" />
            <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-red-500" />
            <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-red-500" />
          </div>
        </div>
      )}
    </div>
  );
};

// --- PHASE 4: VERDICT HOLOGRAM ---
const VerdictHologram = ({ isOpen, score, anomalies }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none" style={{ perspective: '1000px' }}>
      {/* Floating Hologram Card */}
      <div className="relative pointer-events-auto bg-slate-900/60 backdrop-blur-xl border-2 border-red-500/50 p-8 rounded-xl shadow-[0_0_50px_rgba(239,68,68,0.4)] w-[85%] max-w-md animate-in zoom-in-95 fade-in duration-700 delay-300 flex flex-col items-center text-center ring-1 ring-white/20">
        
        {/* Holographic "Flicker" Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-red-500/10 to-transparent pointer-events-none animate-pulse rounded-xl" />
        
        {/* Verdict Header */}
        <div className="relative mb-6">
          <AlertOctagon size={64} className="text-red-500 mb-2 animate-bounce" />
          <div className="absolute -inset-4 bg-red-500/20 blur-xl rounded-full" />
        </div>

        <h2 className="text-4xl font-black text-white tracking-tighter mb-2 italic">
          VERDICT: <span className="text-red-500">DO NOT SIGN</span>
        </h2>
        
        <p className="text-slate-300 text-sm mb-8 max-w-md">
          This contract contains <span className="text-white font-bold">{anomalies.length} Critical Risks</span> that exceed safety and financial benchmarks for the Florida market.
        </p>

        {/* Top 3 Risk Summary */}
        <div className="w-full space-y-3 mb-8">
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded flex items-center gap-3 text-left">
            <ShieldAlert size={20} className="text-red-500 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-red-400">Structural Safety</div>
              <div className="text-xs text-white">Substandard DP-15 rating in a Coastal Zone.</div>
            </div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded flex items-center gap-3 text-left">
            <ShieldAlert size={20} className="text-red-500 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-red-400">Financial Risk</div>
              <div className="text-xs text-white">Excessive 75% deposit is 3x the industry standard.</div>
            </div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded flex items-center gap-3 text-left">
            <ShieldAlert size={20} className="text-red-500 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-red-400">Legal Trap</div>
              <div className="text-xs text-white">Hidden 15% surcharge found in fine print.</div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button className="group relative bg-red-600 hover:bg-red-500 text-white font-black py-4 px-8 rounded flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)] active:scale-95">
          GENERATE REBUTTAL REPORT
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Scan Metadata */}
        <div className="mt-6 text-[10px] font-mono text-slate-500 uppercase tracking-widest opacity-80">
          AI Audit ID: {Math.random().toString(36).substr(2, 9).toUpperCase()} // v4.2 Compliance Engine
        </div>
      </div>
    </div>
  );
};

interface WindowScannerProps {
  onScanClick?: () => void;
  onDemoClick?: () => void;
}

export default function WindowScanner({ onScanClick, onDemoClick }: WindowScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeAnomalies, setActiveAnomalies] = useState([]);

  const startScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    setActiveAnomalies([]);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.4; // Slower, smoother scan
      setScanProgress(progress);
      
      // 1. Check Header License Anomaly (Triggers around 15% progress)
      if (progress > 15 && progress < 16) {
        if (ESTIMATE_DATA.license.includes('ABC')) {
          setActiveAnomalies(prev => prev.includes('license') ? prev : [...prev, 'license']);
        }
      }

      // 2. Check Line Items (Mapped roughly from 30% to 80% of the document height)
      ESTIMATE_DATA.items.forEach((item, index) => {
        const triggerPoint = 30 + (index * (50 / ESTIMATE_DATA.items.length));
        if (progress > triggerPoint && progress < triggerPoint + 1) {
          if (item.status === "warning") {
            setActiveAnomalies(prev => prev.includes(item.id) ? prev : [...prev, item.id]);
          }
        }
      });

      // 3. Check Fine Print (Triggers at 82% progress)
      if (progress > 82 && progress < 83) {
        setActiveAnomalies(prev => prev.includes('fineprint_trap') ? prev : [...prev, 'fineprint_trap']);
      }

      if (progress >= 100) {
        clearInterval(interval);
        setIsScanning(false);
      }
    }, 16); // roughly 60fps
  };

  const activePhase = scanProgress === 0 ? -1 : scanProgress < 33 ? 0 : scanProgress < 66 ? 1 : 2;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-start p-4 md:p-8 overflow-hidden font-sans relative selection:bg-cyan-500/30">
      {/* Background ambient lighting */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-900/20 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-900/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-7xl w-full flex flex-col gap-8 relative z-10">
        
        {/* Holographic HUD */}
        <div className="w-full relative mx-auto max-w-4xl" style={{ perspective: '1000px' }}>
          <div 
            className="border border-cyan-500/40 bg-cyan-950/40 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex items-center justify-between relative overflow-hidden"
            style={{ transform: 'rotateX(5deg) translateZ(10px)' }}
          >
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ backgroundImage: 'linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

            <div className="flex items-center gap-2 md:gap-6 relative z-10 w-full justify-between">
              {[
                { label: 'DATA EXTRACTION', icon: <FileText size={18}/> },
                { label: 'CONTEXTUAL INJECTION', icon: <Cpu size={18}/> },
                { label: 'COMPLIANCE DETECTION', icon: <BrainCircuit size={18}/> }
              ].map((phase, idx) => {
                const isActive = activePhase === idx;
                const isPast = activePhase > idx || scanProgress === 100;
                
                return (
                  <React.Fragment key={phase.label}>
                    <div className={`flex flex-col items-center gap-1 md:gap-2 transition-all duration-500 ${isActive ? 'text-cyan-300 scale-105 drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]' : isPast ? 'text-cyan-600' : 'text-slate-600'}`}>
                      <div className="flex items-center gap-2 font-bold tracking-widest text-[10px] md:text-sm uppercase text-center">
                        <span className="hidden md:block">{phase.icon}</span>
                        {phase.label}
                      </div>
                      <div className="h-4 overflow-hidden text-[8px] md:text-[10px] font-mono opacity-50 hidden sm:block">
                        {isActive && isScanning ? (
                          <div className="animate-pulse">10101001 1101<br/>00111010 0110</div>
                        ) : '00000000 0000'}
                      </div>
                    </div>
                    {idx < 2 && (
                      <ChevronRight className={`hidden sm:block transition-colors duration-500 ${isPast ? 'text-cyan-500' : 'text-slate-700'}`} size={20} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Interactive Document Area (Scanner Bed) */}
          <div className="lg:col-span-8 relative" style={{ perspective: '1200px' }}>
            
            {/* The Physical Paper Document (3D Tilt Wrapper) */}
            <div className="w-full transition-all duration-1000 ease-in-out origin-center"
                 style={{
                   transform: scanProgress === 100 ? 'rotateX(20deg) scale(0.9) translateY(-2rem)' : (isScanning ? 'scale(1.01)' : 'scale(1)'),
                   opacity: scanProgress === 100 ? 0.35 : 1,
                   filter: scanProgress === 100 ? 'blur(2px)' : 'none',
                 }}>
              
              <div className="relative w-full bg-slate-950 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden min-h-[600px] font-sans border-2 border-slate-800"
                   style={{ 
                     boxShadow: isScanning ? '0 25px 50px -12px rgba(249, 115, 22, 0.15)' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                   }}>
                
                {/* The Laser Scanner Line (Overlays the entire bed) */}
                {scanProgress > 0 && scanProgress < 100 && (
                  <div 
                    className="absolute left-0 right-0 z-50 pointer-events-none"
                    style={{ 
                      top: `${scanProgress}%`,
                      transform: 'translateY(-50%) rotate(-0.5deg)',
                    }}
                  >
                    <div className="h-1 w-full bg-white shadow-[0_0_10px_2px_#fff]"></div>
                    <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-16 bg-gradient-to-r from-transparent via-orange-500/60 to-transparent blur-[8px]"></div>
                    <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-32 bg-gradient-to-r from-transparent via-red-500/20 to-transparent blur-[16px]"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-2 bg-yellow-300 shadow-[0_0_30px_10px_rgba(250,204,21,0.8)] rounded-full blur-[2px]"></div>
                  </div>
                )}

                {/* SVG Filter for Paper Grain */}
                <svg className="hidden">
                  <filter id="paperGrain">
                    <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0, 0 0 0 0 0, 0 0 0 0 0, 0 0 0 -1 1" />
                  </filter>
                </svg>

                {/* Physical Paper Sheet (Slightly misaligned) */}
                <div className="relative bg-[#f9f7f2] text-slate-800 w-full h-full min-h-[750px] origin-center font-sans shadow-xl"
                     style={{ transform: 'rotate(0.3deg) scale(0.98)', top: '10px' }}>
                  
                  {/* Layer 1: The Grain Overlay */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.06] contrast-150 mix-blend-multiply" style={{ filter: 'url(#paperGrain)' }}></div>

                  {/* Layer 2: The Coffee Ring (Top Right) */}
                  <div className="absolute top-10 right-10 opacity-[0.15] pointer-events-none rotate-[25deg] scale-150">
                    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="#634832" strokeWidth="2">
                      <circle cx="50" cy="50" r="45" strokeDasharray="10 5 20 2" />
                      <circle cx="50" cy="50" r="42" opacity="0.5" />
                    </svg>
                  </div>

                  {/* Layer 3: The Fold Line */}
                  <div className="absolute top-[55%] left-0 w-full h-[2px] pointer-events-none z-10">
                    <div className="h-[1px] bg-black/10 w-full"></div>
                    <div className="h-[1px] bg-white/50 w-full"></div>
                  </div>

                  {/* Layer 4: Blue "Received" Stamp */}
                  <div className="absolute bottom-20 left-8 -rotate-12 border-[3px] border-blue-700/50 p-2 px-4 rounded-sm pointer-events-none mix-blend-multiply opacity-80 z-10">
                    <div className="text-blue-700/60 font-black text-2xl tracking-tighter uppercase leading-none font-mono">
                      RECV OCT 2026<br />
                      <span className="text-xs tracking-normal font-sans">Compliance Dept</span>
                    </div>
                  </div>

                  {/* Content Container (Ensures content stays above paper textures) */}
                  <div className="relative z-10">

                    {/* Document Header */}
                    <div className="p-8 md:p-10 pb-6 border-b-2 border-slate-300 relative">
                      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight mb-4 uppercase italic">Window Estimate</h1>
                      
                      <div className="flex flex-col sm:flex-row justify-between text-slate-600 text-sm font-medium gap-4">
                        <div className="space-y-1">
                          <p><span className="text-slate-400 uppercase text-xs">Client:</span> {ESTIMATE_DATA.client}</p>
                          <p><span className="text-slate-400 uppercase text-xs">Contractor:</span> {ESTIMATE_DATA.contractor}</p>
                          <div className="relative inline-block">
                            <span className="text-slate-400 uppercase text-xs">License:</span> 
                            <span className={`ml-1 px-1 rounded transition-colors duration-500 ${activeAnomalies.includes('license') ? 'bg-red-200 text-red-800 font-bold' : ''}`}>
                              {ESTIMATE_DATA.license}
                            </span>
                            {activeAnomalies.includes('license') && (
                              <div className="absolute top-full left-0 mt-1 w-64 bg-slate-900 border border-red-500 rounded p-2 text-red-400 text-xs shadow-lg z-20 animate-in fade-in slide-in-from-top-2">
                                <AlertTriangle size={12} className="inline mr-1 -mt-0.5" />
                                Format Anomaly: Regional licenses strictly numeric.
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="sm:text-right space-y-1">
                          <p><span className="text-slate-400 uppercase text-xs">Date:</span> {ESTIMATE_DATA.date}</p>
                          <p><span className="text-slate-400 uppercase text-xs">Quote Ref:</span> {ESTIMATE_DATA.ref}</p>
                        </div>
                      </div>
                    </div>

                    {/* Document Table */}
                    <div className="p-8 md:p-10 pt-4 relative">
                      <div className="grid grid-cols-12 gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
                        <div className="col-span-8 md:col-span-9">Description of Services</div>
                        <div className="col-span-4 md:col-span-3 text-right">Cost</div>
                      </div>

                      <div className="flex flex-col gap-1 relative">
                        {ESTIMATE_DATA.items.map((item) => {
                          const isRevealedAnomaly = activeAnomalies.includes(item.id);
                          
                          return (
                            <div key={item.id} className="relative grid grid-cols-12 gap-4 py-4 border-b border-slate-200/50 text-slate-700 items-center transition-colors hover:bg-slate-100/50">
                              <div className="col-span-8 md:col-span-9 font-medium text-sm md:text-base leading-snug">{item.label}</div>
                              <div className="col-span-4 md:col-span-3 text-right font-mono font-semibold">${item.cost.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                              
                              {/* Red Highlight Background */}
                              {item.status === 'warning' && (
                                <div className={`absolute inset-0 pointer-events-none transition-all duration-500 ${isRevealedAnomaly ? 'bg-red-500/10 border-l-4 border-red-500' : 'bg-transparent border-l-4 border-transparent'}`}>
                                  
                                  {/* Floating Holographic Flag */}
                                  <div className={`absolute left-4 md:left-auto md:-right-8 top-full md:top-1/2 mt-2 md:mt-0 md:-translate-y-1/2 transition-all duration-700 ease-out transform z-30 ${isRevealedAnomaly ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0 hidden md:block'}`}>
                                    <div className="relative">
                                      <div className="bg-slate-950 border border-red-500 backdrop-blur-xl rounded px-3 py-2 flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.4)] w-max max-w-[200px] md:max-w-xs">
                                        <AlertTriangle className="text-red-500 animate-pulse shrink-0" size={16} />
                                        <div className="flex flex-col">
                                          <span className="text-red-400 font-bold text-[10px] tracking-wider uppercase">Audit Flag</span>
                                          <span className="text-slate-300 text-[10px] leading-tight">{item.note}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Totals */}
                      <div className="mt-8 flex justify-end">
                        <div className="w-full md:w-1/2">
                          <div className="flex justify-between py-2 text-slate-500 text-sm border-b border-slate-200">
                            <span>Subtotal</span>
                            <span className="font-mono">${ESTIMATE_DATA.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                          <div className="flex justify-between py-4 text-slate-800 font-black text-xl border-t-4 border-slate-900 mt-1">
                            <span>TOTAL ESTIMATE</span>
                            <span className="font-mono">${ESTIMATE_DATA.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                        </div>
                      </div>

                      {/* NEW: FINE PRINT SCANNER */}
                      <FinePrintScanner scanProgress={scanProgress} isScanning={isScanning} />

                    </div>
                  </div> {/* End Content Container */}
                </div> {/* End Physical Paper Sheet */}

                {/* Post-scan overlay */}
                {scanProgress === 100 && (
                  <div className="absolute inset-0 bg-cyan-900/5 pointer-events-none transition-opacity duration-1000 border-[3px] border-cyan-500/20 z-40"></div>
                )}
              </div>
            </div>

            {/* The Hologram Finale */}
            <VerdictHologram 
              isOpen={scanProgress === 100} 
              score={Math.max(0, 95 - (activeAnomalies.length * 12))}
              anomalies={activeAnomalies} 
            />
          </div>

          {/* RIGHT: Sidebar Controls & Diagnostics */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            
            <button 
              onClick={startScan}
              disabled={isScanning}
              className={`w-full flex items-center justify-center gap-2 px-6 py-5 rounded-lg font-bold text-sm tracking-widest uppercase transition-all duration-300 ${
                isScanning 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 shadow-inner'
                  : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] shadow-lg hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isScanning ? (
                <><Scan className="animate-spin" size={18} /> Analyzing Contract...</>
              ) : scanProgress === 100 ? (
                <><Zap size={18} /> Re-run AI Audit</>
              ) : (
                <><Search size={18} /> Start Compliance Audit</>
              )}
            </button>

            {/* NEW: Trust Score Widget */}
            <TrustScoreWidget isScanning={isScanning} activeAnomalies={activeAnomalies} />

            {/* Audit Log Panel */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-lg p-5 flex flex-col min-h-[250px] flex-1 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Shield size={16} className={isScanning ? "text-cyan-400 animate-pulse" : "text-cyan-600"} />
                  Live Audit Log
                </h3>
                <span className="text-[10px] font-mono bg-slate-800 px-2 py-1 rounded text-cyan-400">
                  {activeAnomalies.length} FLAGS
                </span>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {!isScanning && activeAnomalies.length === 0 && scanProgress === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs italic space-y-2 opacity-50 py-4">
                    <Search size={32} />
                    <p>Awaiting scan initialization...</p>
                  </div>
                )}

                {activeAnomalies.includes('license') && (
                  <div className="border-l-2 border-red-500 pl-3 py-1 bg-red-500/5 rounded-r p-2 animate-in slide-in-from-right-4 duration-300">
                    <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                      <AlertTriangle size={12}/> License Mismatch
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed font-mono">
                      Format contains alphabetical characters. Local registry requires numeric-only identifiers. Risk: Unlicensed Contractor.
                    </div>
                  </div>
                )}

                {activeAnomalies.includes('fineprint_trap') && (
                  <div className="border-l-2 border-red-500 pl-3 py-1 bg-red-500/5 rounded-r p-2 animate-in slide-in-from-right-4 duration-300">
                    <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                      <ShieldAlert size={12}/> Predatory Clause Detected
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed font-mono">
                      Hidden liability shift found in Fine Print. Contractor disclaims structural rot responsibility and claims arbitrary 15% material surcharges.
                    </div>
                  </div>
                )}

                {ESTIMATE_DATA.items.map(item => {
                  if (activeAnomalies.includes(item.id)) {
                    return (
                      <div key={item.id} className="border-l-2 border-orange-500 pl-3 py-1 bg-orange-500/5 rounded-r p-2 animate-in slide-in-from-right-4 duration-300">
                        <div className="text-[10px] text-orange-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                          <AlertTriangle size={12}/> Item Variance: #{item.id}
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed font-mono">
                          {item.note}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            {/* Metadata Footer Box */}
            <div className="bg-cyan-950/20 border border-cyan-900/30 rounded-lg p-4 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
              <h4 className="text-[10px] uppercase tracking-widest text-cyan-600 mb-3 font-bold">Extracted Metadata Specs</h4>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono text-cyan-300/80">
                <div className="flex justify-between border-b border-cyan-900/30 pb-1"><span>STC RATING:</span> <span className="text-white">32</span></div>
                <div className="flex justify-between border-b border-cyan-900/30 pb-1"><span>U-FACTOR:</span> <span className="text-white">0.27</span></div>
                <div className="flex justify-between border-b border-cyan-900/30 pb-1"><span>SHGC:</span> <span className="text-white">0.21</span></div>
                <div className="flex justify-between border-b border-cyan-900/30 pb-1"><span>FRAME:</span> <span className="text-white">VINYL</span></div>
              </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* Global CSS for custom animations/scrollbars */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.6);
        }
      `}} />
    </div>
  );
}
