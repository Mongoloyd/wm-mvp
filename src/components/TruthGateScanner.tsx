import { useState, useRef, useCallback, useEffect, ChangeEvent, DragEvent, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import windowmanLogo from "@/assets/windowman.png";
import impactClipboard from "@/assets/impact_truth_clipboard.webp";

// ═══════════════════════════════════════════════════════════════════════════════

// TRUTH GATE SCANNER — Standalone Multi-Step Conversion Engine
// ═══════════════════════════════════════════════════════════════════════════════

// ─── COUNTY MARKET DATA ─────────────────────────────────────────────────────
const BASE_DATE = new Date("2025-06-01T00:00:00Z");

const COUNTY_DATA: Record<string, { baseScanned: number; dailyGrowth: number; avgSavings: number; avg: string }> = {
  "Miami-Dade": { baseScanned: 847, dailyGrowth: 5, avgSavings: 2788, avg: "$1,380/window" },
  Broward: { baseScanned: 612, dailyGrowth: 4, avgSavings: 2340, avg: "$1,240/window" },
  "Palm Beach": { baseScanned: 489, dailyGrowth: 4, avgSavings: 3105, avg: "$1,310/window" },
  Monroe: { baseScanned: 67, dailyGrowth: 3, avgSavings: 2950, avg: "$1,420/window" },
  Collier: { baseScanned: 178, dailyGrowth: 3, avgSavings: 3410, avg: "$1,350/window" },
  Lee: { baseScanned: 203, dailyGrowth: 4, avgSavings: 2560, avg: "$1,260/window" },
  Charlotte: { baseScanned: 89, dailyGrowth: 3, avgSavings: 2180, avg: "$1,200/window" },
  Sarasota: { baseScanned: 156, dailyGrowth: 3, avgSavings: 2720, avg: "$1,280/window" },
  Manatee: { baseScanned: 112, dailyGrowth: 3, avgSavings: 2390, avg: "$1,230/window" },
  Hillsborough: { baseScanned: 312, dailyGrowth: 5, avgSavings: 2650, avg: "$1,190/window" },
  Pinellas: { baseScanned: 245, dailyGrowth: 4, avgSavings: 2480, avg: "$1,210/window" },
  Pasco: { baseScanned: 98, dailyGrowth: 3, avgSavings: 2110, avg: "$1,150/window" },
  Polk: { baseScanned: 127, dailyGrowth: 3, avgSavings: 1980, avg: "$1,150/window" },
  Orange: { baseScanned: 278, dailyGrowth: 5, avgSavings: 2420, avg: "$1,220/window" },
  Osceola: { baseScanned: 105, dailyGrowth: 3, avgSavings: 2190, avg: "$1,180/window" },
  Seminole: { baseScanned: 134, dailyGrowth: 3, avgSavings: 2310, avg: "$1,200/window" },
  Brevard: { baseScanned: 162, dailyGrowth: 4, avgSavings: 2570, avg: "$1,240/window" },
  Volusia: { baseScanned: 108, dailyGrowth: 3, avgSavings: 2080, avg: "$1,170/window" },
  "St. Lucie": { baseScanned: 94, dailyGrowth: 3, avgSavings: 2260, avg: "$1,220/window" },
  Martin: { baseScanned: 76, dailyGrowth: 3, avgSavings: 2890, avg: "$1,290/window" },
  "Indian River": { baseScanned: 68, dailyGrowth: 3, avgSavings: 2470, avg: "$1,250/window" },
  Hendry: { baseScanned: 31, dailyGrowth: 3, avgSavings: 1850, avg: "$1,100/window" },
  Highlands: { baseScanned: 42, dailyGrowth: 3, avgSavings: 1920, avg: "$1,120/window" },
  Okeechobee: { baseScanned: 28, dailyGrowth: 3, avgSavings: 1780, avg: "$1,080/window" },
  DeSoto: { baseScanned: 24, dailyGrowth: 3, avgSavings: 1760, avg: "$1,090/window" },
  Glades: { baseScanned: 18, dailyGrowth: 3, avgSavings: 1700, avg: "$1,060/window" },
  Hardee: { baseScanned: 22, dailyGrowth: 3, avgSavings: 1740, avg: "$1,070/window" },
  Lake: { baseScanned: 88, dailyGrowth: 3, avgSavings: 2150, avg: "$1,170/window" },
};

function getDailyQuoteCount(county: string): number {
  const data = COUNTY_DATA[county];
  if (!data) return 0;
  const now = new Date();
  const days = Math.max(0, Math.floor((now.getTime() - BASE_DATE.getTime()) / 86400000));
  return data.baseScanned + days * data.dailyGrowth;
}

// ─── ZIP PREFIX → COUNTY MAPPING ────────────────────────────────────────────
const ZIP_TO_COUNTY: Record<string, string> = {
  "330": "Miami-Dade",
  "331": "Miami-Dade",
  "332": "Broward",
  "333": "Broward",
  "334": "Palm Beach",
  "335": "Hillsborough",
  "336": "Hillsborough",
  "337": "Pinellas",
  "338": "Polk",
  "339": "Lee",
  "340": "Collier",
  "341": "Collier",
  "342": "Sarasota",
  "345": "Pasco",
  "346": "Pasco",
  "347": "Osceola",
  "349": "St. Lucie",
  "328": "Orange",
  "327": "Seminole",
  "329": "Brevard",
  "321": "Volusia",
  "344": "Lake",
  "348": "Highlands",
};

const ZIP_OVERRIDES: Record<string, string> = {
  "33040": "Monroe",
  "33042": "Monroe",
  "33043": "Monroe",
  "33050": "Monroe",
  "33051": "Monroe",
  "33052": "Monroe",
  "33070": "Monroe",
  "33440": "Hendry",
  "33935": "Hendry",
  "33471": "Glades",
  "33825": "Highlands",
  "33852": "Highlands",
  "33870": "Highlands",
  "33857": "Okeechobee",
  "34972": "Okeechobee",
  "34974": "Okeechobee",
  "33834": "Hardee",
  "33873": "Hardee",
  "33927": "Charlotte",
  "33947": "Charlotte",
  "33948": "Charlotte",
  "33950": "Charlotte",
  "33952": "Charlotte",
  "33953": "Charlotte",
  "33954": "Charlotte",
  "33955": "Charlotte",
  "33980": "Charlotte",
  "33981": "Charlotte",
  "33982": "Charlotte",
  "33983": "Charlotte",
  "34201": "Manatee",
  "34202": "Manatee",
  "34203": "Manatee",
  "34205": "Manatee",
  "34207": "Manatee",
  "34208": "Manatee",
  "34209": "Manatee",
  "34210": "Manatee",
  "34211": "Manatee",
  "34212": "Manatee",
  "34219": "Manatee",
  "34221": "Manatee",
  "34222": "Manatee",
  "34990": "Martin",
  "34994": "Martin",
  "34996": "Martin",
  "34997": "Martin",
  "32958": "Indian River",
  "32960": "Indian River",
  "32962": "Indian River",
  "32963": "Indian River",
  "32966": "Indian River",
  "32967": "Indian River",
  "32968": "Indian River",
  "33880": "DeSoto",
  "34266": "DeSoto",
  "34711": "Lake",
  "34714": "Lake",
  "34715": "Lake",
  "34736": "Lake",
  "34737": "Lake",
  "34748": "Lake",
  "34753": "Lake",
  "34756": "Lake",
  "34787": "Lake",
  "34788": "Lake",
  "34789": "Lake",
};

function getMarketDataForZip(zip: string): { county: string; avg: string; avgSavings: number; scanned: number } | null {
  if (!zip || zip.length < 3) return null;
  const cleanZip = zip.replace(/\D/g, "").substring(0, 5);
  let county = cleanZip.length === 5 ? ZIP_OVERRIDES[cleanZip] : null;
  if (!county) county = ZIP_TO_COUNTY[cleanZip.substring(0, 3)];
  if (!county || !COUNTY_DATA[county]) return null;
  const data = COUNTY_DATA[county];
  return { county, avg: data.avg, avgSavings: data.avgSavings, scanned: getDailyQuoteCount(county) };
}

// ─── TRUTH GATE STEPS ───────────────────────────────────────────────────
const TRUTH_STEPS = [
  {
    id: 1,
    type: "options",
    question: "How many windows are in your project?",
    options: ["1–5 windows", "6–10 windows", "11–20 windows", "20+ windows"],
    micro: "This helps our AI calculate your per-window cost vs. county average.",
  },
  {
    id: 2,
    type: "options",
    question: "What type of project?",
    options: ["Full home replacement", "Partial replacement", "New construction", "Addition / Single room"],
    micro: "Different scopes have different fair-price benchmarks. Yours matters.",
  },
  {
    id: 3,
    type: "zip",
    question: "What is your zip code?",
    placeholder: "e.g. 33062",
    micro: "We have pricing data for every major Florida market. Your zip unlocks county-level intelligence.",
  },
  {
    id: 4,
    type: "options",
    question: "Your approximate quote total?",
    options: ["Under $10,000", "$10K – $20K", "$20K – $35K", "$35,000+"],
    micro: "This is how we calculate your potential savings vs. your county average.",
  },
];

const PARTNER_STEPS = [
  {
    id: "p1",
    type: "text",
    question: "What is your property address?",
    placeholder: "123 Ocean Blvd, Fort Lauderdale, FL",
    micro: "So our partners can provide a precise, location-specific estimate.",
    field: "address",
  },
  {
    id: "p2",
    type: "options",
    question: "What type of property?",
    options: ["Single-family home", "Townhouse / Duplex", "Condo / Co-op", "Commercial"],
    micro: "Different structures have different installation requirements and pricing.",
    field: "propertyType",
  },
  {
    id: "p3",
    type: "options",
    question: "How soon are you looking to start?",
    options: ["ASAP — ready now", "Within 30 days", "1–3 months", "Just exploring"],
    micro: "Helps us match you with partners who fit your timeline.",
    field: "timeline",
  },
  {
    id: "p4",
    type: "options",
    question: "Any specific requirements?",
    options: ["Impact-rated (hurricane)", "Energy efficient / Low-E", "Noise reduction", "Not sure yet"],
    micro: "This narrows down the right product specs for your competing quote.",
    field: "requirements",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
interface TruthGateScannerProps {
  onComplete?: (payload: Record<string, unknown>) => void;
  onFileUpload?: (payload: Record<string, unknown>) => void;
  onRequestPartnerQuote?: (payload: Record<string, unknown>) => void;
}

export default function TruthGateScanner({ onComplete, onFileUpload, onRequestPartnerQuote }: TruthGateScannerProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [zipInput, setZipInput] = useState("");
  const [showLeadGate, setShowLeadGate] = useState(false);
  const [gateSubmitted, setGateSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPartnerFlow, setShowPartnerFlow] = useState(false);
  const [partnerStep, setPartnerStep] = useState(0);
  const [partnerAnswers, setPartnerAnswers] = useState<Record<string, string>>({});
  const [partnerAddress, setPartnerAddress] = useState("");

  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);

  const completedSteps = Object.keys(answers).length;
  const investment = completedSteps * 16.25 + (showLeadGate ? 15 : 0);
  const marketData = getMarketDataForZip(answers[3] || "");

  useEffect(() => {
    document.body.style.overflow = isDemoModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDemoModalOpen]);

  const getLeadPayload = useCallback(
    () => ({
      answers,
      zip: answers[3],
      marketData,
      lead: { name, email, phone },
    }),
    [answers, marketData, name, email, phone],
  );

  const advanceStep = useCallback((stepId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [stepId]: answer }));
    if (stepId < 4) {
      setTimeout(() => setActiveStep((prev) => prev + 1), 300);
    } else {
      setTimeout(() => setShowLeadGate(true), 400);
    }
  }, []);

  const handleZipSubmit = useCallback(() => {
    const cleaned = zipInput.replace(/\D/g, "").substring(0, 5);
    if (cleaned.length === 5) advanceStep(3, cleaned);
  }, [zipInput, advanceStep]);

  const handleZipKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleZipSubmit();
    },
    [handleZipSubmit],
  );

  const handleGateSubmit = useCallback(() => {
    if (!name || !email || !phone) return;
    setGateSubmitted(true);
    onComplete?.(getLeadPayload());
  }, [name, email, phone, getLeadPayload, onComplete]);

  const processFile = useCallback(
    (file: File) => {
      if (!file) return;
      setUploadedFile(file);
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        setUploadComplete(true);
        onFileUpload?.({ file, ...getLeadPayload() });
      }, 2200);
    },
    [getLeadPayload, onFileUpload],
  );

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDropzoneClick = useCallback(() => {
    if (!isUploading && !uploadComplete) fileInputRef.current?.click();
  }, [isUploading, uploadComplete]);

  const handlePartnerOption = useCallback(
    (field: string, value: string) => {
      const updated = { ...partnerAnswers, [field]: value };
      setPartnerAnswers(updated);
      if (partnerStep < PARTNER_STEPS.length - 1) {
        setTimeout(() => setPartnerStep((prev) => prev + 1), 300);
      } else {
        setTimeout(() => {
          onRequestPartnerQuote?.({ ...getLeadPayload(), partnerDetails: updated });
        }, 400);
      }
    },
    [partnerStep, partnerAnswers, getLeadPayload, onRequestPartnerQuote],
  );

  const handlePartnerAddressSubmit = useCallback(() => {
    if (partnerAddress.trim().length >= 5) handlePartnerOption("address", partnerAddress.trim());
  }, [partnerAddress, handlePartnerOption]);

  const handlePartnerAddressKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handlePartnerAddressSubmit();
    },
    [handlePartnerAddressSubmit],
  );

  const partnerFlowComplete = Object.keys(partnerAnswers).length >= PARTNER_STEPS.length;
  const partnerProgress = (Object.keys(partnerAnswers).length / PARTNER_STEPS.length) * 100;

  const toggleDemoModal = useCallback(() => {
    setIsDemoModalOpen((prev) => !prev);
  }, []);

  // ── Step number badge ──
  const StepBadge = ({ answered, active, label }: { answered: boolean; active: boolean; label: string | number }) => (
    <div
      className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300",
        answered ? "bg-emerald text-white" : active ? "bg-cyan text-white" : "bg-border text-muted-foreground",
      )}
    >
      {answered ? "✓" : label}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <section ref={sectionRef} className="py-20 px-6 bg-secondary font-body text-foreground relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="max-w-[680px] mx-auto">
        {/* ═══ SECTION HEADER ═══ */}
        <div className="text-center mb-10">
          <span className="eyebrow text-cyan">The Truth Gate</span>
          <h2 className="heading-lg text-foreground mt-2 text-[clamp(26px,3.5vw,38px)]">Configure Your AI Scan</h2>
          <p className="text-[15px] text-muted-aa mt-2">
            4 quick questions so our AI knows exactly what to look for in your quote.
          </p>
        </div>

        {/* ═══ PROGRESS BAR ═══ */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-muted-aa">Scan Configuration</span>
            <span className={cn("text-xs font-mono font-semibold", investment >= 65 ? "text-emerald" : "text-cyan")}>
              {Math.round(investment)}% configured
            </span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                investment >= 65
                  ? "bg-gradient-to-r from-emerald to-emerald-text"
                  : "bg-gradient-to-r from-cyan to-royal",
              )}
              style={{ width: `${investment}%` }}
            />
          </div>
        </div>

        {/* ═══ PHASE 1: MULTI-STEP QUESTIONS ═══ */}
        {!showLeadGate && !gateSubmitted && (
          <div className="glass-card p-8 !rounded-3xl !border-2 !border-cyan/15">
            {TRUTH_STEPS.filter((_, i) => i <= activeStep).map((s, idx) => {
              const isActive = idx === activeStep;
              const isAnswered = answers[s.id] !== undefined;
              return (
                <div
                  key={s.id}
                  className={cn("transition-opacity duration-300", idx < activeStep ? "mb-5 opacity-50" : "")}
                >
                  <div className={cn("flex items-center gap-2.5", isActive ? "mb-3.5" : "mb-1.5")}>
                    <StepBadge answered={isAnswered} active={isActive} label={s.id} />
                    <span
                      className={cn(
                        "text-[15px] font-semibold",
                        isActive ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {s.question}
                    </span>
                    {isAnswered && <span className="text-[13px] text-cyan font-medium ml-auto">{answers[s.id]}</span>}
                  </div>

                  {isActive && !isAnswered && s.type === "options" && (
                    <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-2.5 mb-2">
                      {s.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => advanceStep(s.id, opt)}
                          className="bg-secondary/90 border-2 border-border rounded-xl px-5 py-4 text-left text-[15px] font-medium text-muted-aa cursor-pointer transition-all duration-200 hover:border-cyan hover:bg-cyan/5 hover:translate-x-1 hover:shadow-md"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {isActive && !isAnswered && s.type === "zip" && (
                    <div className="mb-2">
                      <div className="flex items-center gap-3 pl-[38px]">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={5}
                          placeholder={s.placeholder}
                          value={zipInput}
                          onChange={(e) => setZipInput(e.target.value.replace(/\D/g, "").substring(0, 5))}
                          onKeyDown={handleZipKeyDown}
                          autoFocus
                          className="w-full max-w-[200px] px-[18px] py-3.5 border-2 border-border rounded-xl text-foreground bg-background font-mono text-[22px] font-semibold tracking-[0.15em] text-center transition-all duration-200 outline-none focus:border-cyan focus:ring-[3px] focus:ring-cyan/15 placeholder:text-muted-foreground"
                        />
                        <button
                          onClick={handleZipSubmit}
                          disabled={zipInput.replace(/\D/g, "").length < 5}
                          className={cn(
                            "px-6 py-3.5 text-sm font-bold rounded-xl bg-#2b80ff text-white relative overflow-hidden",
                            zipInput.replace(/\D/g, "").length === 5
                              ? "opacity-100 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg"
                              : "opacity-45 cursor-not-allowed",
                          )}
                        >
                          <span className="relative z-10">Lock In →</span>
                        </button>
                      </div>
                      {zipInput.length >= 3 && getMarketDataForZip(zipInput) && (
                        <div className="animate-fade-in-up mt-2.5 ml-[38px] px-3.5 py-2 bg-cyan/5 border border-cyan/15 rounded-[10px] inline-flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald shadow-[0_0_6px_hsl(var(--color-emerald)/0.5)]" />
                          <span className="text-xs text-cyan-text">
                            <strong>{getMarketDataForZip(zipInput)!.county} County</strong> —{" "}
                            {getMarketDataForZip(zipInput)!.scanned.toLocaleString()} quotes in our database
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {isActive && !isAnswered && (
                    <p className="text-[11px] text-muted-foreground italic pl-[38px] mt-1">{s.micro}</p>
                  )}
                  {idx < activeStep && <div className="h-px bg-border my-2" />}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ PHASE 2: LEAD GATE ═══ */}
        {showLeadGate && !gateSubmitted && (
          <div className="glass-card !rounded-3xl !border-2 !border-cyan/15 p-8 animate-fade-in-up">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald to-emerald-text flex items-center justify-center text-white text-2xl mx-auto mb-3">
                ✓
              </div>
              <h3 className="font-display text-[22px] font-bold text-foreground">Your Scan Is Configured.</h3>
              <p className="text-sm text-muted-aa mt-1">Enter your details to run the analysis.</p>
            </div>

            {marketData && (
              <div className="bg-cyan/5 border border-cyan/15 rounded-xl px-4 py-3 mb-5 text-center">
                <span className="text-[13px] text-cyan-text">
                  We've analyzed <strong>{marketData.scanned.toLocaleString()} quotes</strong> in {marketData.county}.
                  Average savings: <strong className="text-emerald">${marketData.avgSavings.toLocaleString()}</strong>
                </span>
              </div>
            )}

            <div className="flex flex-col gap-3.5">
              <div>
                <label className="eyebrow text-muted-aa mb-1.5 block">First Name</label>
                <input
                  className="w-full px-[18px] py-3.5 border-2 border-border rounded-xl text-[15px] text-foreground bg-background transition-all duration-200 outline-none focus:border-cyan focus:ring-[3px] focus:ring-cyan/15 placeholder:text-muted-foreground"
                  placeholder="Your first name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="eyebrow text-muted-aa mb-1.5 block">Email Address</label>
                <input
                  className="w-full px-[18px] py-3.5 border-2 border-border rounded-xl text-[15px] text-foreground bg-background transition-all duration-200 outline-none focus:border-cyan focus:ring-[3px] focus:ring-cyan/15 placeholder:text-muted-foreground"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  Used to save your report and send your defense checklist.
                </span>
              </div>
              <div>
                <label className="eyebrow text-muted-aa mb-1.5 block">Mobile Number</label>
                <input
                  className="w-full px-[18px] py-3.5 border-2 border-border rounded-xl text-[15px] text-foreground bg-background transition-all duration-200 outline-none focus:border-cyan focus:ring-[3px] focus:ring-cyan/15 placeholder:text-muted-foreground"
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  To verify your identity and unlock secure features. No spam, ever.
                </span>
              </div>
              <button
                onClick={handleGateSubmit}
                disabled={!name || !email || !phone}
                className={cn(
                  "w-full py-4 px-6 text-base font-bold rounded-xl bg-[#FFBF00] text-white relative overflow-hidden transition-all duration-300 mt-2", // Removed gradient and shimmer for solid look
                  name && email && phone
                    ? "opacity-100 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg"
                    : "opacity-50 cursor-not-allowed",
                )}
              >
                <span className="relative z-10">Run My AI Scan →</span>
              </button>
              <p className="text-center text-[11px] text-muted-foreground">
                🔒 256-bit encrypted · We never sell your data · Delete anytime
              </p>
            </div>
          </div>
        )}

        {/* ═══ PHASE 3: POST-SUBMISSION — Three CTA Paths ═══ */}
        {gateSubmitted && !showPartnerFlow && (
          <div className="glass-card !rounded-3xl !border-2 !border-cyan/15 p-10 text-center animate-fade-in-up">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald to-emerald-text flex items-center justify-center text-3xl text-white mx-auto mb-4 shadow-[0_12px_32px_hsl(var(--color-emerald)/0.3)]">
              ✓
            </div>
            <h3 className="font-display text-2xl font-extrabold text-foreground">Your Protection Vault Is Active.</h3>
            <p className="text-[15px] text-muted-aa mt-2 leading-relaxed">
              Check your email for a magic link to access your dashboard.
              <br />
              Upload your quote there — or drop it right here:
            </p>

            {/* PATH A: DROPZONE */}
            <div
              className={cn(
                "mt-6 px-6 py-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300",
                uploadComplete
                  ? "border-emerald bg-emerald/5 cursor-default"
                  : isDragging
                    ? "border-cyan bg-cyan/10 scale-[1.01] shadow-[0_0_0_4px_hsl(var(--color-cyan)/0.15),0_12px_32px_hsl(var(--color-cyan)/0.15)]"
                    : "border-cyan/30 bg-cyan/[0.02] hover:border-cyan/50 hover:bg-cyan/5 hover:-translate-y-0.5 hover:shadow-md",
                isUploading && "cursor-wait",
              )}
              onClick={handleDropzoneClick}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {!uploadedFile && !isUploading && !uploadComplete && (
                <>
                  <img
                    src={impactClipboard}
                    alt="Impact Window Truth Test"
                    className="w-16 h-16 object-contain mb-2 mx-auto"
                  />
                  <p className="font-semibold text-foreground">
                    {isDragging ? "Release to upload" : "Drop your quote to start the scan"}
                  </p>
                  <p className="text-[13px] text-muted-foreground mt-1">PDF, photo, or screenshot — any format works</p>
                  <p className="text-xs mt-3 text-cyan font-semibold">or click to browse files</p>
                </>
              )}
              {isUploading && (
                <>
                  <div className="text-4xl mb-2 animate-breathe">🔍</div>
                  <p className="font-semibold text-foreground">Scanning: {uploadedFile?.name}</p>
                  <div className="mt-3 h-1 bg-border rounded-full overflow-hidden max-w-[280px] mx-auto">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan to-cyan-light animate-[tg-scan-bar_2.2s_ease-in-out_forwards]" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Extracting line items, specs, and pricing data…</p>
                </>
              )}
              {uploadComplete && (
                <>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald to-emerald-text flex items-center justify-center text-[22px] text-white mx-auto mb-2.5">
                    ✓
                  </div>
                  <p className="font-bold text-emerald-text">Scan Initiated</p>
                  <p className="text-[13px] text-muted-aa mt-1">
                    <strong>{uploadedFile?.name}</strong> — Your Red Flag Report is being generated.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Check your email in ~60 seconds for the full analysis.
                  </p>
                </>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mt-7 mb-5">
              <div className="flex-1 h-px bg-border" />
              <span className="eyebrow text-muted-foreground">{uploadComplete ? "What's next" : "Or explore"}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* PATH B + C CTAs */}
            <div className="flex justify-center gap-4 flex-wrap max-sm:flex-col max-sm:items-stretch">
              <button
                onClick={() => setShowPartnerFlow(true)}
                className="px-7 py-3.5 text-sm font-bold rounded-xl bg-gold text-navy relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:bg-gold-light"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span>🏠</span>
                  <span>Get My Unbeatable Partner Quote</span>
                </span>
              </button>
              <button
                onClick={toggleDemoModal}
                className="px-7 py-3.5 text-sm rounded-xl border-2 border-border bg-transparent text-muted-aa font-semibold transition-all duration-200 hover:border-cyan hover:text-cyan-text hover:bg-cyan/5"
              >
                🔬 See What the AI Looks For
              </button>
            </div>

            {!uploadComplete && (
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                <strong className="text-foreground">Don't have a quote yet?</strong> No problem — tap "Get My Unbeatable
                Partner Quote" and we'll match you with vetted installers who compete for your project.
              </p>
            )}
          </div>
        )}

        {/* ═══ PATH B: PARTNER QUOTE FLOW ═══ */}
        {gateSubmitted && showPartnerFlow && (
          <div className="glass-card !rounded-3xl !border-2 !border-cyan/15 p-9 animate-fade-in-up">
            <div className="mb-7">
              <button
                onClick={() => {
                  setShowPartnerFlow(false);
                  setPartnerStep(0);
                  setPartnerAnswers({});
                  setPartnerAddress("");
                }}
                className="text-[13px] text-muted-foreground hover:text-cyan transition-colors bg-transparent border-none cursor-pointer py-1"
              >
                ← Back to upload
              </button>
              <div className="text-center mt-3">
                <img
                  src={windowmanLogo}
                  alt="WindowMan"
                  className="w-14 h-14 rounded-xl mx-auto mb-2.5 object-contain"
                />
                <h3 className="font-display text-xl font-bold text-foreground">
                  Get a Competing Quote From Our Network
                </h3>
                <p className="text-[13px] text-muted-aa mt-1 max-w-[420px] mx-auto">
                  We already know your project basics. A few more details and our partners will compete for your
                  business.
                </p>
              </div>
            </div>

            {/* Partner progress bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-semibold text-muted-aa">Partner Match Progress</span>
                <span className="text-[11px] font-mono font-semibold text-gold">
                  {Math.round(partnerProgress)}% complete
                </span>
              </div>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light transition-all duration-500 ease-out"
                  style={{ width: `${partnerProgress}%` }}
                />
              </div>
            </div>

            {/* Partner step cards */}
            {!partnerFlowComplete &&
              PARTNER_STEPS.filter((_, i) => i <= partnerStep).map((ps, idx) => {
                const isActive = idx === partnerStep;
                const isAnswered = partnerAnswers[ps.field] !== undefined;
                return (
                  <div
                    key={ps.id}
                    className={cn("transition-opacity duration-300", idx < partnerStep ? "mb-[18px] opacity-50" : "")}
                  >
                    <div className={cn("flex items-center gap-2.5", isActive ? "mb-3" : "mb-1.5")}>
                      <div
                        className={cn(
                          "w-[26px] h-[26px] rounded-[7px] flex items-center justify-center text-[11px] font-bold transition-all duration-300",
                          isAnswered
                            ? "bg-gold text-white"
                            : isActive
                              ? "bg-gold/25 text-gold"
                              : "bg-border text-muted-foreground",
                        )}
                      >
                        {isAnswered ? "✓" : idx + 1}
                      </div>
                      <span
                        className={cn("text-sm font-semibold", isActive ? "text-foreground" : "text-muted-foreground")}
                      >
                        {ps.question}
                      </span>
                      {isAnswered && (
                        <span className="text-xs text-gold font-medium ml-auto max-w-[180px] text-right overflow-hidden text-ellipsis whitespace-nowrap">
                          {partnerAnswers[ps.field]}
                        </span>
                      )}
                    </div>

                    {isActive && !isAnswered && ps.type === "text" && (
                      <div className="pl-9 mb-1.5">
                        <div className="flex gap-2.5">
                          <input
                            className="flex-1 px-[18px] py-3 border-2 border-border rounded-xl text-[15px] text-foreground bg-background transition-all duration-200 outline-none focus:border-cyan focus:ring-[3px] focus:ring-cyan/15 placeholder:text-muted-foreground"
                            placeholder={ps.placeholder}
                            value={partnerAddress}
                            onChange={(e) => setPartnerAddress(e.target.value)}
                            onKeyDown={handlePartnerAddressKeyDown}
                            autoFocus
                          />
                          <button
                            onClick={handlePartnerAddressSubmit}
                            disabled={partnerAddress.trim().length < 5}
                            className={cn(
                              "px-5 py-3 text-[13px] font-bold rounded-xl bg-gradient-to-br from-gold via-gold-light to-gold text-white relative overflow-hidden transition-all duration-300",
                              partnerAddress.trim().length >= 5
                                ? "opacity-100 cursor-pointer"
                                : "opacity-45 cursor-not-allowed",
                            )}
                          >
                            <span className="relative z-10">Next →</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {isActive && !isAnswered && ps.type === "options" && (
                      <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-2 mb-1.5 pl-9">
                        {ps.options.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => handlePartnerOption(ps.field, opt)}
                            className="bg-secondary/90 border-2 border-border rounded-xl px-4 py-[13px] text-left text-sm font-medium text-muted-aa cursor-pointer transition-all duration-200 hover:border-cyan hover:bg-cyan/5 hover:translate-x-1 hover:shadow-md"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {isActive && !isAnswered && (
                      <p className="text-[11px] text-muted-foreground italic pl-9 mt-1">{ps.micro}</p>
                    )}
                    {idx < partnerStep && <div className="h-px bg-border my-2" />}
                  </div>
                );
              })}

            {/* Partner flow completion */}
            {partnerFlowComplete && (
              <div className="text-center py-5 animate-fade-in-up">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center text-[26px] text-white mx-auto mb-3.5 shadow-[0_12px_32px_hsl(var(--color-amber)/0.3)]">
                  ✓
                </div>
                <h4 className="font-display text-xl font-bold text-foreground">You're All Set.</h4>
                <p className="text-sm text-muted-aa mt-1.5 leading-relaxed max-w-[400px] mx-auto">
                  WindowMan will be in touch with our verified partner in{" "}
                  <strong>{marketData?.county || "your area"}</strong>. Expect a call within 2 business hours to
                  schedule your free measurement.
                </p>
                <div className="mt-5 px-5 py-3 bg-gold/5 border border-gold/15 rounded-xl inline-flex items-center gap-2">
                  <span className="text-base">🛡</span>
                  <span className="text-xs text-muted-aa">
                    Every partner is licensed, insured, and rated 4.5+ by verified homeowners.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ PATH C: DEMO MODAL ═══ */}
      {isDemoModalOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-foreground/60 backdrop-blur-lg flex items-center justify-center p-6 animate-fade-in-up"
          onClick={toggleDemoModal}
        >
          <div
            className="bg-background rounded-3xl max-w-[600px] w-full max-h-[85vh] overflow-y-auto shadow-[0_40px_80px_-20px_hsl(var(--foreground)/0.25),0_0_0_1px_hsl(var(--color-cyan)/0.1)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-8 pt-7 pb-5 border-b border-border flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-cyan bg-cyan/10 px-2.5 py-0.5 rounded-md inline-block mb-2">
                  Live Preview
                </span>
                <h3 className="font-display text-[22px] font-extrabold text-foreground tracking-tight">
                  How the AI Scan Works
                </h3>
                <p className="text-[13px] text-muted-aa mt-1">
                  Watch a real scan on a sample estimate — then try it on yours.
                </p>
              </div>
              <button
                onClick={toggleDemoModal}
                aria-label="Close demo modal"
                className="w-9 h-9 rounded-[10px] border border-border bg-background flex items-center justify-center text-lg text-muted-foreground shrink-0 transition-all duration-200 hover:border-danger hover:text-danger cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Demo content */}
            <div className="p-8">
              <div className="flex flex-col gap-4">
                {[
                  { icon: "📄", label: "Extracting line items from estimate…", status: "complete" },
                  { icon: "💰", label: "Comparing per-window cost to county avg…", status: "complete" },
                  { icon: "🔍", label: "Scanning for red flags & missing specs…", status: "active" },
                  { icon: "📊", label: "Generating negotiation leverage report…", status: "pending" },
                ].map((stage, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-3.5 px-[18px] py-3.5 rounded-xl border",
                      stage.status === "active"
                        ? "bg-cyan/5 border-cyan/15"
                        : stage.status === "complete"
                          ? "bg-emerald/5 border-emerald/15"
                          : "bg-secondary border-border opacity-50",
                    )}
                  >
                    <span className="text-xl shrink-0">{stage.icon}</span>
                    <span className="text-sm font-medium text-muted-aa flex-1">{stage.label}</span>
                    <span
                      className={cn(
                        "text-[11px] font-bold shrink-0",
                        stage.status === "complete"
                          ? "text-emerald"
                          : stage.status === "active"
                            ? "text-cyan"
                            : "text-muted-foreground",
                      )}
                    >
                      {stage.status === "complete" ? "✓ Done" : stage.status === "active" ? "⏳ Running…" : "Queued"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Sample red flag */}
              <div className="mt-6 p-5 rounded-xl bg-danger/5 border border-danger/10">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-base">⚠</span>
                  <span className="text-sm font-bold text-danger">Sample Red Flag Detected</span>
                </div>
                <p className="text-[13px] leading-relaxed text-muted-aa">
                  <strong>Glass Specification Missing</strong> — The estimate references "impact windows" but does not
                  specify the manufacturer, series, design pressure rating, or missile impact level. This leaves the
                  contractor free to install any product at any quality tier.
                </p>
                <div className="mt-2.5 px-3 py-2 rounded-lg bg-gold/5 border border-gold/15 text-xs text-muted-aa leading-relaxed">
                  💡 <strong className="text-gold">AI Recommendation:</strong> Request the specific window brand,
                  product series, and design pressure rating be added to the contract before signing.
                </div>
              </div>

              {/* Demo → real action CTA */}
              <div className="text-center mt-7">
                <p className="text-[13px] text-muted-foreground mb-3.5">
                  This is what we find in <strong className="text-foreground">73% of Florida quotes</strong>. Ready to
                  scan yours?
                </p>
                <button
                  onClick={toggleDemoModal}
                  className="px-9 py-4 text-[15px] font-bold rounded-xl bg-gold text-navy relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:bg-gold-light"
                >
                  <span className="relative z-10">Close & Upload My Quote →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
