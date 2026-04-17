import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  FileSearch,
  TrendingUp,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Info,
  Lock,
  Handshake,
  DollarSign,
  ShieldAlert,
  CreditCard,
  Clock,
  LayoutGrid,
  MessageCircle,
  Sparkles,
  Home,
  Layers,
  Target,
  User,
  Smartphone,
  MapPin,
  Edit3,
  PhoneCall,
  BadgeCheck,
  MessageSquareQuote,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// TRACKING
// ─────────────────────────────────────────────────────────────────────────────
const trackEvent = (eventName: string, parameters: Record<string, unknown>) => {
  console.log(`[Tracking] ${eventName}`, parameters);
  // Production: bridge to canonical tracking (Meta CAPI, GA4, Segment).
};

// ─────────────────────────────────────────────────────────────────────────────
// INPUT FORMATTERS
// ─────────────────────────────────────────────────────────────────────────────
const formatPhoneNumber = (value: string) => {
  if (!value) return '';
  const digits = value.replace(/[^\d]/g, '').slice(0, 10);
  const len = digits.length;
  if (len < 4) return digits;
  if (len < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

const sanitizeZip = (value: string) => value.replace(/[^\d]/g, '').slice(0, 5);

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type StepId = 'intake' | 'diagnosis' | 'prescription' | 'success';

type DiagnosisCode =
  | 'price_shock'
  | 'trust_breakdown'
  | 'financial'
  | 'timing'
  | 'scope_mismatch'
  | 'other';

interface DiagnosticConfig {
  code: DiagnosisCode;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
  accentBg: string;
  accentBorder: string;
  reflectionTitle: string;
  reflectionBody: string;
  secondaryQuestion: string;
  secondaryOptions: string[];
  prescriptionSetup: string;
  prescriptionHeadline: string;
  prescriptionSubhead: string;
  guaranteeTitle: string;
  guarantees: string[];
  ctaText: string;
  prescriptionPath: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DIAGNOSTIC MAP
// ─────────────────────────────────────────────────────────────────────────────
const DIAGNOSTIC_MAP: Record<DiagnosisCode, DiagnosticConfig> = {
  price_shock: {
    code: 'price_shock',
    label: 'It felt too expensive',
    Icon: DollarSign,
    accent: 'text-red-700',
    accentBg: 'bg-red-50',
    accentBorder: 'border-red-200',
    reflectionTitle: 'We hear you.',
    reflectionBody:
      "A quote that feels inflated or unclear instantly kills confidence. You deserve transparency—no games, no padding, no surprises.",
    secondaryQuestion: 'What about the price felt off?',
    secondaryOptions: [
      'Way higher than expected',
      "Didn't understand what I was paying for",
      'Felt padded',
      "Rep couldn't explain the breakdown",
      "Fees that didn't make sense",
    ],
    prescriptionSetup:
      "Got it. We'll rebuild your estimate with a clear, line-by-line breakdown so you can finally see what's real and what's fluff.",
    prescriptionHeadline: 'Your Estimate, Priced Honestly.',
    prescriptionSubhead:
      "A line-item quote so you can see exactly what every dollar is paying for.",
    guaranteeTitle: 'Line-Item Transparency Guarantee',
    guarantees: [
      'Every cost broken down by window, material, and labor',
      'No hidden fees, no bundled "miscellaneous" charges',
      'Our audit benchmarks shared alongside the quote',
      'You can challenge any line item before you sign',
    ],
    ctaText: 'Get my line-item estimate',
    prescriptionPath: 'transparency_line_item',
  },
  trust_breakdown: {
    code: 'trust_breakdown',
    label: "I didn't trust the salesperson",
    Icon: ShieldAlert,
    accent: 'text-blue-700',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-blue-200',
    reflectionTitle: 'We hear you.',
    reflectionBody:
      'A pushy or unclear salesperson can ruin an otherwise good quote. You deserve a process that feels safe, honest, and pressure-free.',
    secondaryQuestion: 'What made you uncomfortable?',
    secondaryOptions: [
      'They were pushy',
      "Didn't answer my questions",
      'Kept changing the price',
      'Felt salesy, not helpful',
      "Didn't trust their explanations",
      'Rushed me',
    ],
    prescriptionSetup:
      'Understood. Your next estimate will be built with full transparency and zero pressure. No scripts. No manipulation. Just facts.',
    prescriptionHeadline: 'Your Estimate, Pressure-Free.',
    prescriptionSubhead:
      "We handle the contractor conversation so you never deal with a high-pressure sales rep again.",
    guaranteeTitle: 'No-Pressure Guarantee',
    guarantees: [
      'No in-home sales pitch required',
      'Your WindowMan advisor handles the contractor relationship',
      'All pricing and terms in writing before any commitment',
      'You can walk away at any point—no follow-up calls',
    ],
    ctaText: 'Get my no-pressure estimate',
    prescriptionPath: 'transparency_no_pressure',
  },
  financial: {
    code: 'financial',
    label: "I can't afford that price structure",
    Icon: CreditCard,
    accent: 'text-green-700',
    accentBg: 'bg-green-50',
    accentBorder: 'border-green-200',
    reflectionTitle: 'We hear you.',
    reflectionBody:
      "Wanting to improve your home but feeling boxed in by the price structure is stressful. You deserve options that fit your life, not the contractor's agenda.",
    secondaryQuestion: "What part of the cost structure didn't work?",
    secondaryOptions: [
      'Monthly payments too high',
      'Down payment too big',
      'Financing terms felt bad',
      'Need more flexible options',
      'Want to compare payment plans',
    ],
    prescriptionSetup:
      "Got it. We'll build an estimate with flexible payment paths and real financing options—not the one-size-fits-all plan you were shown.",
    prescriptionHeadline: 'Your Estimate, With Options That Actually Fit.',
    prescriptionSubhead:
      "Multiple payment paths side by side so you can pick what works for your budget.",
    guaranteeTitle: 'Flexible Financing Guarantee',
    guarantees: [
      'Multiple financing partners compared, not just one',
      'Phased-project pricing if full scope is out of budget',
      'No high-pressure financing upsells at the table',
      'Clear APR and total-cost-of-ownership on every option',
    ],
    ctaText: 'Show me my payment options',
    prescriptionPath: 'financing_flexible',
  },
  timing: {
    code: 'timing',
    label: "The timing isn't right",
    Icon: Clock,
    accent: 'text-amber-700',
    accentBg: 'bg-amber-50',
    accentBorder: 'border-amber-200',
    reflectionTitle: 'We hear you.',
    reflectionBody:
      "Window projects are big decisions, and timing matters. You deserve an estimate that respects your pace—not someone else's deadline.",
    secondaryQuestion: "What about the timing didn't feel right?",
    secondaryOptions: [
      "Not ready to start",
      'Need to plan financially',
      "Comparing options",
      "Overwhelmed",
      'Need more information first',
    ],
    prescriptionSetup:
      "Understood. We'll build an estimate that gives you clarity without pressure—something you can revisit when the timing is right.",
    prescriptionHeadline: 'Your Estimate, On Your Timeline.',
    prescriptionSubhead:
      "Today's pricing locked in so you can review at your pace—no expiration games.",
    guaranteeTitle: 'No-Rush Guarantee',
    guarantees: [
      "Today's pricing held for 60 days—no artificial urgency",
      'No follow-up calls unless you request them',
      'Side-by-side comparison tools for when you return',
      'Your advisor reachable whenever you have questions',
    ],
    ctaText: 'Get clarity, no pressure',
    prescriptionPath: 'timing_no_rush',
  },
  scope_mismatch: {
    code: 'scope_mismatch',
    label: "It wasn't what I actually wanted",
    Icon: LayoutGrid,
    accent: 'text-orange-700',
    accentBg: 'bg-orange-50',
    accentBorder: 'border-orange-200',
    reflectionTitle: 'We hear you.',
    reflectionBody:
      "When a quote doesn't match your vision, it's frustrating. You deserve an estimate built around your home, not a template.",
    secondaryQuestion: "What didn't match what you wanted?",
    secondaryOptions: [
      'Wrong window types',
      'Wrong materials',
      'Wrong installation approach',
      "Didn't include what I asked for",
      'Too many upsells',
      "Didn't feel tailored to my home",
    ],
    prescriptionSetup:
      "Got it. We'll rebuild your estimate from scratch based on what you actually want—no upsells, no assumptions, no shortcuts.",
    prescriptionHeadline: 'Your Estimate, Built Around Your Home.',
    prescriptionSubhead:
      "We scope the project to what you asked for—then let contractors quote that spec, not their own.",
    guaranteeTitle: 'Scope-Accuracy Guarantee',
    guarantees: [
      'Your stated scope is the quote spec—non-negotiable',
      'Contractors bid against your requirements, not theirs',
      'No bundled upsells or "while we\'re there" additions',
      'Line-level approval on every change before it happens',
    ],
    ctaText: 'Build my right-scoped estimate',
    prescriptionPath: 'scope_custom',
  },
  other: {
    code: 'other',
    label: 'Something else felt off',
    Icon: MessageCircle,
    accent: 'text-slate-700',
    accentBg: 'bg-slate-50',
    accentBorder: 'border-slate-200',
    reflectionTitle: 'We hear you.',
    reflectionBody:
      "Something about that quote didn't sit right—and that matters. You deserve an estimate that feels clear, fair, and aligned with your goals.",
    secondaryQuestion: 'Tell us what felt off.',
    secondaryOptions: [],
    prescriptionSetup:
      "Thank you. We'll take what you shared and build an estimate that avoids those issues entirely.",
    prescriptionHeadline: 'Your Estimate, Done Right This Time.',
    prescriptionSubhead:
      "We'll use your feedback to shape a quote that addresses exactly what went wrong.",
    guaranteeTitle: 'Full-Context Rebuild Guarantee',
    guarantees: [
      'Your concerns captured and shared with the contractor upfront',
      'Quote reviewed against your specific feedback before delivery',
      'Your advisor stays engaged through installation',
      'Walk away any time—no obligations, ever',
    ],
    ctaText: 'Build my better estimate',
    prescriptionPath: 'custom_rebuild',
  },
};

const DIAGNOSIS_ORDER: DiagnosisCode[] = [
  'price_shock',
  'trust_breakdown',
  'financial',
  'timing',
  'scope_mismatch',
  'other',
];

const WINDOW_STYLES = [
  'Single Hung',
  'Horizontal Roller',
  'Casement',
  'Picture / Fixed',
  'Sliding Glass Doors',
  'French Doors',
  'Entry / Cabana',
];

const WINDOW_CONCERNS = [
  'Energy Efficiency',
  'Noise / Sound',
  'Condensation',
  'Drafts',
  'Aesthetics',
  'Maintenance',
  'Durability',
];

const FRAME_MATERIALS = [
  { value: 'Vinyl', label: 'Vinyl' },
  { value: 'Fiberglass', label: 'Fiberglass' },
  { value: 'Aluminum', label: 'Aluminum' },
  { value: 'Wood', label: 'Wood' },
  { value: 'Composite', label: 'Composite' },
  { value: 'Unsure', label: 'Not sure yet' },
];

// ─────────────────────────────────────────────────────────────────────────────
// COUNTER-OFFER CHIPS — branch-dynamic "what would get you to yes" terms
// Each term is a specific business condition the advisor can pre-negotiate
// ─────────────────────────────────────────────────────────────────────────────
const BRANCH_DYNAMIC_CHIPS: Record<DiagnosisCode, string[]> = {
  price_shock: [
    'Lower the total project cost',
    'Remove hidden service fees',
    'Match a lower competitor bid',
    'Provide a line-item breakdown',
    "Apply a 'First-Time' discount",
  ],
  trust_breakdown: [
    'Switch to a higher-rated company',
    'See proof of insurance & license',
    'Talk to a local reference',
    'No in-home high-pressure sales',
    'Written 10-year labor warranty',
  ],
  financial: [
    'Zero-down financing options',
    'Lower the monthly payment',
    'Extend the financing term',
    'Delayed first payment (90 days)',
    'Split project into two phases',
  ],
  timing: [
    'Lock this price for 60 days',
    'Guaranteed installation date',
    'Just send info, no phone calls',
    'Start in 3+ months',
    'Compare with 2 more quotes first',
  ],
  scope_mismatch: [
    'Change the window material',
    'Simplify the installation scope',
    "Remove 'extra' features",
    'Focus only on priority windows',
    'Include hurricane-rated glass',
  ],
  other: [
    'Better price',
    'Different company',
    'More options',
    'Custom request',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CONDITIONAL-CLOSE STATEMENT GENERATOR
// Turns the user's chip selections into a first-person commitment sentence
// ─────────────────────────────────────────────────────────────────────────────
const generateConditionalStatement = (
  diagnosisLabel: string,
  selectedChips: string[]
): string => {
  if (selectedChips.length === 0) {
    return "Select what would get you to 'yes' above…";
  }
  const terms = selectedChips.join(', ').replace(/, ([^,]*)$/, ' and $1');
  return `"If WindowMan can secure a deal that addresses ${diagnosisLabel.toLowerCase()} and specifically includes ${terms.toLowerCase()}, I am ready to move forward."`;
};

// ─────────────────────────────────────────────────────────────────────────────
// TIME-AWARE SLA RESOLVER
// Business hours: 8 AM – 7 PM. Weekend → Monday 10 AM.
// Friday-evening submissions correctly promote to Monday (not Saturday).
// ─────────────────────────────────────────────────────────────────────────────
interface SLAPromise {
  text: string;
  callbackIso: string;
  urgency: 'hour' | 'next_morning' | 'monday';
}

const BUSINESS_HOURS_START = 8;
const BUSINESS_HOURS_END = 19;

const formatClockTime = (d: Date): string =>
  d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

const getSLAPromise = (now: Date = new Date()): SLAPromise => {
  const day = now.getDay(); // 0 = Sun, 6 = Sat
  const hour = now.getHours();

  // Weekend → Monday 10 AM
  if (day === 0 || day === 6) {
    const monday = new Date(now);
    monday.setDate(now.getDate() + (day === 6 ? 2 : 1));
    monday.setHours(10, 0, 0, 0);
    return {
      text: 'Your advisor is calling Monday morning (by 10:00 AM)',
      callbackIso: monday.toISOString(),
      urgency: 'monday',
    };
  }

  // After business hours → next business morning, promoting across weekends
  if (hour < BUSINESS_HOURS_START || hour >= BUSINESS_HOURS_END) {
    const next = new Date(now);
    next.setDate(now.getDate() + 1);
    // If tomorrow is Saturday or Sunday, promote to Monday
    if (next.getDay() === 6) next.setDate(next.getDate() + 2);
    else if (next.getDay() === 0) next.setDate(next.getDate() + 1);

    const isMonday = next.getDay() === 1 && (day === 5 || day === 6 || day === 0);
    if (isMonday) {
      next.setHours(10, 0, 0, 0);
      return {
        text: 'Your advisor is calling Monday morning (by 10:00 AM)',
        callbackIso: next.toISOString(),
        urgency: 'monday',
      };
    }
    next.setHours(9, 30, 0, 0);
    return {
      text: 'Your advisor is calling first thing tomorrow (by 9:30 AM)',
      callbackIso: next.toISOString(),
      urgency: 'next_morning',
    };
  }

  // Business hours → +60 minutes
  const callback = new Date(now.getTime() + 60 * 60 * 1000);
  return {
    text: `Your advisor is calling by ${formatClockTime(callback)}`,
    callbackIso: callback.toISOString(),
    urgency: 'hour',
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT MASKING — preserves privacy on the Verified Profile badge
// ─────────────────────────────────────────────────────────────────────────────
const maskPhone = (phone: string): string => {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length !== 10) return phone;
  return `(${digits.slice(0, 3)}) ***-${digits.slice(6)}`;
};

const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local}@${domain.charAt(0)}...`;
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const EstimateRequest: React.FC<{ navigate: (r: string) => void }> = ({ navigate }) => {
  const [step, setStep] = useState<StepId>('intake');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState<DiagnosisCode | null>(null);
  const [secondaryClarifiers, setSecondaryClarifiers] = useState<string[]>([]);
  const [otherFreeText, setOtherFreeText] = useState('');
  const [windowStyles, setWindowStyles] = useState<string[]>([]);
  const [windowConcerns, setWindowConcerns] = useState<string[]>([]);
  const [frameMaterial, setFrameMaterial] = useState('');

  // Counter-offer state (Step 3)
  const [counterOfferTerms, setCounterOfferTerms] = useState<string[]>([]);
  const [counterOfferFreeText, setCounterOfferFreeText] = useState('');

  // Pre-existing lead context — already collected at upload time, never re-asked
  const [context, setContext] = useState({
    lead_id: '',
    scan_session_id: '',
    report_grade: '',
    top_insights: [] as string[],
    first_name: '',
    phone: '',
    email: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const pageTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Production: hydrate from Vault / lead record / URL params
    setContext({
      lead_id: 'ld_987654321',
      scan_session_id: 'scan_123456789',
      report_grade: 'D',
      top_insights: [
        'Warranty coverage gap on 4 window units',
        'Pricing 18% above benchmark for your ZIP',
      ],
      first_name: 'Peter',
      phone: '(305) 555-4567',
      email: 'peter@gmail.com',
    });
  }, []);

  const scrollToTop = () => {
    pageTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const activeConfig = primaryDiagnosis ? DIAGNOSTIC_MAP[primaryDiagnosis] : null;

  const confidence = Math.min(
    0.95,
    0.6 +
      secondaryClarifiers.length * 0.05 +
      windowStyles.length * 0.02 +
      windowConcerns.length * 0.02 +
      (frameMaterial ? 0.05 : 0) +
      (otherFreeText.length > 20 ? 0.15 : 0)
  );

  const stepNumber =
    step === 'intake' ? 1 : step === 'diagnosis' ? 2 : 3;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const toggleInArray = (
    arr: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => {
    setter(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const handlePrimarySelect = (code: DiagnosisCode) => {
    setPrimaryDiagnosis(code);
    setSecondaryClarifiers([]);
    setOtherFreeText('');

    trackEvent('DiagnosticStarted', {
      lead_id: context.lead_id,
      scan_session_id: context.scan_session_id,
      diagnosis: code,
    });

    setStep('diagnosis');
    scrollToTop();
  };

  const handleAdvanceToPrescription = () => {
    if (!primaryDiagnosis) return;

    trackEvent('DiagnosticClassified', {
      lead_id: context.lead_id,
      scan_session_id: context.scan_session_id,
      diagnosis: primaryDiagnosis,
      secondary_clarifiers: secondaryClarifiers,
      window_styles: windowStyles,
      window_concerns: windowConcerns,
      frame_material: frameMaterial || null,
      other_text_length: otherFreeText.length,
      confidence,
      prescription_path: DIAGNOSTIC_MAP[primaryDiagnosis].prescriptionPath,
    });

    setStep('prescription');
    scrollToTop();
  };

  const handleBack = () => {
    if (step === 'diagnosis') {
      setStep('intake');
      setPrimaryDiagnosis(null);
      setSecondaryClarifiers([]);
      setOtherFreeText('');
    } else if (step === 'prescription') {
      setStep('diagnosis');
    }
    scrollToTop();
  };

  const handleContactEdit = () => {
    // Production: deep-link to the lead record edit view or account settings
    console.log('[UX] User wants to edit pre-existing contact info', {
      lead_id: context.lead_id,
    });
    alert('In production, this opens your account settings to update contact info.');
  };

  // Counter-offer readiness — CTA gates on at least one amber chip
  const hasCounterOffer = counterOfferTerms.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryDiagnosis || !hasCounterOffer) return;

    setIsSubmitting(true);

    // Compute SLA at submit time (not render time) for accuracy
    const sla = getSLAPromise(new Date());
    const conditionalStatement = generateConditionalStatement(
      DIAGNOSTIC_MAP[primaryDiagnosis].label,
      counterOfferTerms
    );

    const payload = {
      lead_id: context.lead_id,
      scan_session_id: context.scan_session_id,
      report_grade: context.report_grade,
      source: 'post_report_diagnostic_intake',
      diagnosis: {
        primary: primaryDiagnosis,
        secondary_clarifiers: secondaryClarifiers,
        other_text: otherFreeText || null,
        confidence,
        prescription_path: DIAGNOSTIC_MAP[primaryDiagnosis].prescriptionPath,
      },
      window_intelligence: {
        styles: windowStyles,
        concerns: windowConcerns,
        frame_material: frameMaterial || null,
      },
      counter_offer: {
        terms_selected: counterOfferTerms,
        terms_free_text: counterOfferFreeText.trim() || null,
        conditional_close_statement: conditionalStatement,
      },
      advisor_sla: {
        promised_callback_by: sla.callbackIso,
        urgency: sla.urgency,
        hot_lead: true,
      },
    };

    console.log('[API] Submitting close-ready brief:', payload);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    trackEvent('Schedule', {
      value: 1000,
      currency: 'USD',
      lead_id: context.lead_id,
      scan_session_id: context.scan_session_id,
      diagnosis: primaryDiagnosis,
      prescription_path: DIAGNOSTIC_MAP[primaryDiagnosis].prescriptionPath,
      counter_offer_terms_count: counterOfferTerms.length,
      sla_urgency: sla.urgency,
    });

    setIsSubmitting(false);
    setStep('success');
    scrollToTop();
  };

  const canAdvanceFromDiagnosis =
    primaryDiagnosis === 'other'
      ? otherFreeText.trim().length >= 10
      : secondaryClarifiers.length > 0;

  // ─────────────────────────────────────────────────────────────────────────
  // SUCCESS STATE
  // ─────────────────────────────────────────────────────────────────────────
  if (step === 'success') {
    const sla = getSLAPromise();
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-2xl shadow-sm max-w-md w-full border border-slate-100">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
            <PhoneCall className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Your Advisor Has Been Notified</h2>
          <p className="text-slate-600 mb-6">
            We sent your full brief—diagnosis, preferences, and counter-offer terms—to your dedicated WindowMan advisor right now.
          </p>

          {/* Committed callback time */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 mb-6 text-left">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center">
                <PhoneCall className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">
                  Calling You At
                </p>
                <p className="text-base font-semibold text-slate-900 leading-snug">
                  {maskPhone(context.phone)}
                </p>
                <p className="text-sm text-amber-900 mt-1.5">{sla.text}</p>
              </div>
            </div>
          </div>

          {activeConfig && (
            <div className={`${activeConfig.accentBg} ${activeConfig.accentBorder} border rounded-lg p-4 mb-6 text-left`}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                Your prescribed path
              </p>
              <p className="font-semibold text-slate-900">{activeConfig.guaranteeTitle}</p>
            </div>
          )}
          <p className="text-slate-600 mb-8 text-sm">
            If we miss our callback window, we'll text an apology and a reschedule link. That's the guarantee.
          </p>
          <button
            onClick={() => navigate('report')}
            className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
          >
            Return to your audit report
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div ref={pageTopRef} className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100">
      {/* Nav */}
      <nav className="border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl">W</div>
          <span className="font-bold text-xl tracking-tight text-slate-900">WindowMan</span>
        </div>
        <button
          onClick={() => navigate('report')}
          className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Report
        </button>
      </nav>

      {/* Progress Indicator */}
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STEP 1 — ROOT EMOTIONAL CHIP                                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 'intake' && (
        <section className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white pt-16 pb-20 px-6 relative overflow-hidden">
          <div className="max-w-3xl mx-auto relative z-10">
            {context.report_grade && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-10 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-14 h-14 rounded-lg bg-red-500/20 border border-red-400/30 flex items-center justify-center">
                    <span className="text-2xl font-bold text-red-300">{context.report_grade}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Your Audit Score
                    </p>
                    <p className="text-sm text-slate-300 mb-2">Here's what we flagged:</p>
                    <ul className="space-y-1">
                      {context.top_insights.map((insight, i) => (
                        <li key={i} className="text-sm text-slate-200 flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-10 text-center">
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <Handshake className="w-4 h-4" />
                This isn't a sales form. It's a consultation.
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 leading-tight">
                Before we build your better estimate, tell us what didn't feel right.
              </h1>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                You can be completely honest—we work for you, not the contractor. One tap is all it takes to start.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Root Question
              </p>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">
                What frustrated you most about the quote you received?
              </h2>
              <div className="flex flex-wrap gap-3">
                {DIAGNOSIS_ORDER.map((code) => {
                  const config = DIAGNOSTIC_MAP[code];
                  const Icon = config.Icon;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handlePrimarySelect(code)}
                      className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium text-sm hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Icon className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                      {config.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 mt-5 italic">
                Tap the one that hits closest. Don't overthink it.
              </p>
            </div>
          </div>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full overflow-hidden z-0 pointer-events-none opacity-20">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[140%] rounded-full bg-blue-600 blur-[120px]"></div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STEP 2 — DEEP DIAGNOSIS (4 CHIP GROUPS, ALL TAP-BASED)              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 'diagnosis' && activeConfig && (
        <section className="bg-slate-50 py-12 px-6 min-h-[calc(100vh-160px)]">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Change my answer
            </button>

            {/* Therapeutic Reflection Panel */}
            <div className={`${activeConfig.accentBg} ${activeConfig.accentBorder} border-2 rounded-2xl p-6 md:p-8 mb-8 shadow-sm`}>
              <div className="flex items-start gap-4">
                <div className={`shrink-0 w-12 h-12 rounded-xl bg-white ${activeConfig.accentBorder} border-2 flex items-center justify-center`}>
                  <activeConfig.Icon className={`w-6 h-6 ${activeConfig.accent}`} />
                </div>
                <div className="flex-1">
                  <h2 className={`text-2xl font-bold ${activeConfig.accent} mb-3`}>
                    {activeConfig.reflectionTitle}
                  </h2>
                  <p className="text-slate-800 text-base leading-relaxed">
                    {activeConfig.reflectionBody}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-center text-slate-600 text-sm mb-6 italic">
              A few quick questions so we can shape your prescription. All taps, no typing.
            </p>

            {/* Question 1: Secondary Clarifier */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 mb-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Diagnostic
                </p>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                {activeConfig.secondaryQuestion}
              </h3>

              {primaryDiagnosis === 'other' ? (
                <textarea
                  value={otherFreeText}
                  onChange={(e) => setOtherFreeText(e.target.value)}
                  rows={4}
                  placeholder="Tell us what felt off. There's no wrong answer."
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none text-slate-900"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activeConfig.secondaryOptions.map((option) => {
                    const isSelected = secondaryClarifiers.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          toggleInArray(secondaryClarifiers, setSecondaryClarifiers, option)
                        }
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Question 2: Window Styles */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 mb-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Window Types
                </p>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Which window styles are part of this project?
              </h3>
              <p className="text-sm text-slate-500 mb-4">Tap any that apply.</p>
              <div className="flex flex-wrap gap-2">
                {WINDOW_STYLES.map((style) => {
                  const isSelected = windowStyles.includes(style);
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleInArray(windowStyles, setWindowStyles, style)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {style}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question 3: Concerns */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 mb-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Priorities
                </p>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                What matters most to you?
              </h3>
              <p className="text-sm text-slate-500 mb-4">Tap everything that's important.</p>
              <div className="flex flex-wrap gap-2">
                {WINDOW_CONCERNS.map((concern) => {
                  const isSelected = windowConcerns.includes(concern);
                  return (
                    <button
                      key={concern}
                      type="button"
                      onClick={() => toggleInArray(windowConcerns, setWindowConcerns, concern)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
                        isSelected
                          ? 'bg-green-600 border-green-600 text-white shadow-sm'
                          : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {concern}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question 4: Frame Material (single-select chips) */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">4</div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Frame Material
                </p>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Frame material preference?
              </h3>
              <p className="text-sm text-slate-500 mb-4">Pick one. "Not sure" is fine.</p>
              <div className="flex flex-wrap gap-2">
                {FRAME_MATERIALS.map(({ value, label }) => {
                  const isSelected = frameMaterial === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFrameMaterial(isSelected ? '' : value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
                        isSelected
                          ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                          : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advance */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8">
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                {activeConfig.prescriptionSetup}
              </p>
              <button
                onClick={handleAdvanceToPrescription}
                disabled={!canAdvanceFromDiagnosis}
                className={`w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-lg font-bold text-white transition-all ${
                  !canAdvanceFromDiagnosis
                    ? 'bg-slate-700 cursor-not-allowed opacity-50'
                    : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.99] shadow-lg'
                }`}
              >
                See How We'll Fix This <ArrowRight className="w-5 h-5" />
              </button>
              {!canAdvanceFromDiagnosis && (
                <p className="text-xs text-slate-400 text-center mt-3">
                  {primaryDiagnosis === 'other'
                    ? 'Tell us a little more so we can tailor the prescription.'
                    : 'Pick at least one option from question 1 to continue.'}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STEP 3 — PRESCRIPTION + MINIMAL "CONTACT ME" MOMENT                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 'prescription' && activeConfig && (
        <section className="bg-slate-50 py-12 px-6">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {/* Dynamic Headline */}
            <div className="mb-8 text-center">
              <div className={`inline-flex items-center gap-2 ${activeConfig.accentBg} ${activeConfig.accent} px-4 py-1.5 rounded-full text-sm font-medium mb-5 border ${activeConfig.accentBorder}`}>
                <activeConfig.Icon className="w-4 h-4" />
                Prescribed For You
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                {activeConfig.prescriptionHeadline}
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                {activeConfig.prescriptionSubhead}
              </p>
            </div>

            {/* Prescribed Guarantee */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 mb-6">
              <div className="flex items-center gap-3 mb-5">
                <ShieldCheck className={`w-7 h-7 ${activeConfig.accent}`} />
                <h3 className="text-xl font-bold text-slate-900">{activeConfig.guaranteeTitle}</h3>
              </div>
              <ul className="space-y-3">
                {activeConfig.guarantees.map((g, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className={`w-5 h-5 ${activeConfig.accent} shrink-0 mt-0.5`} />
                    <span className="text-slate-700 text-base">{g}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* MIRROR PANEL — reflects everything they told us */}
            <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-6 md:p-8 mb-8">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Here's what we heard</h3>
                </div>
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded-md hover:bg-white/60"
                  aria-label="Edit your selections"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Your frustration
                  </p>
                  <p className="text-slate-800 font-medium">{activeConfig.label}</p>
                </div>

                {secondaryClarifiers.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Specifically
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {secondaryClarifiers.map((c) => (
                        <span key={c} className="inline-block px-3 py-1 bg-white border border-blue-200 rounded-full text-xs font-medium text-slate-700">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {otherFreeText && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      In your words
                    </p>
                    <p className="text-slate-700 italic">"{otherFreeText}"</p>
                  </div>
                )}

                {windowStyles.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Window styles
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {windowStyles.map((s) => (
                        <span key={s} className="inline-block px-3 py-1 bg-white border border-blue-200 rounded-full text-xs font-medium text-slate-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {windowConcerns.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      What matters
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {windowConcerns.map((c) => (
                        <span key={c} className="inline-block px-3 py-1 bg-white border border-green-200 rounded-full text-xs font-medium text-slate-700">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {frameMaterial && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Frame material
                    </p>
                    <span className="inline-block px-3 py-1 bg-white border border-purple-200 rounded-full text-xs font-medium text-slate-700">
                      {frameMaterial}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-600 mt-6 pt-5 border-t border-blue-200">
                Your advisor gets all of this upfront—so your next conversation starts where this one left off.
              </p>
            </div>

            {/* NO-FORM VERIFIED PROFILE BADGE */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border-2 border-slate-900">
              {/* Verified Profile Header */}
              <div className="flex items-center justify-between gap-3 p-4 mb-6 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                    <BadgeCheck className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-green-700 mb-0.5">
                      Verified Profile
                    </p>
                    <p className="text-sm text-slate-800 truncate">
                      <span className="font-semibold">{context.first_name}</span>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span className="font-mono">{maskPhone(context.phone)}</span>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span>{maskEmail(context.email)}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleContactEdit}
                  className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-900 px-2 py-1 rounded-md hover:bg-white/60 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>

              {/* COUNTER-OFFER PANEL — The Money Question */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    The Money Question
                  </p>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  What would get you to "yes"?
                </h3>
                <p className="text-sm text-slate-600 mb-5">
                  Tap everything that would make you move forward. Your advisor walks into the contractor call with these as non-negotiables on your behalf.
                </p>

                <div className="flex flex-wrap gap-2 mb-5">
                  {BRANCH_DYNAMIC_CHIPS[primaryDiagnosis!].map((term) => {
                    const isSelected = counterOfferTerms.includes(term);
                    return (
                      <button
                        key={term}
                        type="button"
                        onClick={() => toggleInArray(counterOfferTerms, setCounterOfferTerms, term)}
                        className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-500 ${
                          isSelected
                            ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm'
                            : 'bg-white border-slate-300 text-slate-700 hover:border-amber-300 hover:bg-amber-50/30'
                        }`}
                      >
                        {term}
                      </button>
                    );
                  })}
                </div>

                {/* LIVE CONDITIONAL STATEMENT — updates as chips toggle */}
                <div className="mb-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <MessageSquareQuote className="w-3.5 h-3.5" />
                    Here's what you're saying
                  </p>
                  <blockquote
                    className={`border-l-4 pl-5 pr-4 py-4 rounded-r-lg text-base leading-relaxed transition-all ${
                      hasCounterOffer
                        ? 'border-amber-500 bg-amber-50/70 text-slate-900 italic'
                        : 'border-slate-300 bg-slate-50 text-slate-400 italic'
                    }`}
                  >
                    {generateConditionalStatement(
                      DIAGNOSTIC_MAP[primaryDiagnosis!].label,
                      counterOfferTerms
                    )}
                  </blockquote>
                </div>

                {/* Optional free-text — advisor context only, not part of the statement */}
                <details className="group">
                  <summary className="text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer select-none list-none inline-flex items-center gap-1">
                    <span className="group-open:rotate-90 transition-transform inline-block">›</span>
                    Anything specific your advisor should know? (optional)
                  </summary>
                  <textarea
                    value={counterOfferFreeText}
                    onChange={(e) => setCounterOfferFreeText(e.target.value)}
                    rows={3}
                    placeholder="Example: 'If you can beat $18,400 with the same warranty, I'll sign this week.'"
                    className="mt-3 w-full px-4 py-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none text-sm"
                  />
                </details>
              </div>

              {/* SLA PROMISE — Trust Guardrail */}
              <div className="flex items-start gap-3 p-4 mb-5 rounded-xl bg-blue-50 border border-blue-200">
                <div className="shrink-0 w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                  <PhoneCall className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900">
                    {getSLAPromise().text}
                  </p>
                  <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                    Your advisor sees everything: your diagnosis, window preferences, and counter-offer terms. No repeating yourself.
                  </p>
                </div>
              </div>

              {/* SINGLE-TAP CONFIRMATION */}
              <form onSubmit={handleSubmit}>
                <button
                  type="submit"
                  disabled={!hasCounterOffer || isSubmitting}
                  className={`w-full flex items-center justify-center gap-2 py-5 px-6 rounded-lg font-bold text-white text-lg transition-all ${
                    !hasCounterOffer || isSubmitting
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-700 active:scale-[0.99] shadow-lg hover:shadow-amber-600/25'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Notifying your advisor...
                    </>
                  ) : (
                    <>
                      Yes, have someone call me
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                {!hasCounterOffer && !isSubmitting && (
                  <p className="text-xs text-slate-500 text-center mt-3 italic">
                    Tap what would get you to yes.
                  </p>
                )}
                {hasCounterOffer && !isSubmitting && (
                  <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500 text-center mt-3">
                    <Lock className="w-3 h-3" />
                    No obligation. No contract. Just a real conversation.
                  </p>
                )}
              </form>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MARKETING SECTIONS — only visible in Step 1                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 'intake' && (
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
      )}

      <footer className="py-8 text-center text-slate-500 text-sm border-t border-slate-200">
        <p>&copy; {new Date().getFullYear()} WindowMan. All rights reserved.</p>
      </footer>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// APP ROUTER MOCK
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [route, setRoute] = useState('estimate');

  switch (route) {
    case 'estimate':
      return <EstimateRequest navigate={setRoute} />;
    case 'report':
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-6">
          <div className="w-16 h-16 bg-slate-200 rounded-xl mb-6 flex items-center justify-center">
            <Info className="w-8 h-8 text-slate-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Audit Report (Simulation)</h1>
          <p className="text-slate-600 mb-8 max-w-md">
            This represents the original audit page where red flags were shown.
          </p>
          <button
            onClick={() => setRoute('estimate')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            I need a better estimate &rarr;
          </button>
        </div>
      );
    default:
      return <EstimateRequest navigate={setRoute} />;
  }
}
