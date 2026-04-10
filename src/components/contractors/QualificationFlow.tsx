import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassPanel from "@/components/contractors/GlassPanel";
import CTAButton from "@/components/contractors/CTAButton";
import { ArrowLeft, X } from "lucide-react";
import { z } from "zod";

const premiumEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const textSchema = z.string().trim().min(1, "Required").max(200);
const emailSchema = z.string().trim().email("Invalid email").max(255);
const phoneSchema = z.string().trim().min(7, "Invalid phone").max(20);

type Outcome = "approved" | "waitlist" | "not_a_fit" | null;

interface QualificationFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

const QualificationFlow = ({ isOpen, onClose }: QualificationFlowProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [serviceNotes, setServiceNotes] = useState("");
  const [projectVolume, setProjectVolume] = useState("");
  const [installStandard, setInstallStandard] = useState("");
  const [quoteClarity, setQuoteClarity] = useState("");
  const [paymentPref, setPaymentPref] = useState("");
  const [warrantyPosture, setWarrantyPosture] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const totalSteps = 5;

  const clearErrors = () => setErrors({});

  const nextStep = useCallback(() => {
    clearErrors();
    setStep((s) => s + 1);
  }, []);

  const prevStep = useCallback(() => {
    clearErrors();
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const handleSubmit = () => {
    const errs: Record<string, string> = {};
    try {
      textSchema.parse(businessName);
    } catch {
      errs.businessName = "Required";
    }
    try {
      textSchema.parse(licenseNumber);
    } catch {
      errs.licenseNumber = "Required";
    }
    try {
      textSchema.parse(licenseState);
    } catch {
      errs.licenseState = "Required";
    }
    try {
      textSchema.parse(contactName);
    } catch {
      errs.contactName = "Required";
    }
    try {
      textSchema.parse(contactRole);
    } catch {
      errs.contactRole = "Required";
    }
    try {
      emailSchema.parse(contactEmail);
    } catch {
      errs.contactEmail = "Valid email required";
    }
    try {
      phoneSchema.parse(contactPhone);
    } catch {
      errs.contactPhone = "Valid phone required";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    if (quoteClarity === "not_consistently") {
      setOutcome("not_a_fit");
    } else if (installStandard === "code_compliant" || paymentPref === "subscription") {
      setOutcome("waitlist");
    } else {
      setOutcome("approved");
    }
    setStep(5);
  };

  const areaOptions = [
    "Northeast Metro",
    "Southeast Metro",
    "Midwest",
    "Southwest",
    "Pacific Northwest",
    "Southern California",
  ];

  const toggleArea = (area: string) => {
    setServiceAreas((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]));
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative w-full max-w-lg z-10"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.97 }}
        transition={{ duration: 0.5, ease: premiumEase }}
      >
        <GlassPanel className="relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {step < 5 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  Step {step + 1} of {totalSteps}
                </span>
                {step > 0 && (
                  <button
                    onClick={prevStep}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back
                  </button>
                )}
              </div>
              <div className="h-1 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                  transition={{ duration: 0.4, ease: premiumEase }}
                />
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: premiumEase }}
            >
              {step === 0 && (
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Request Contractor Access</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    We Work With Contractors Who Win on Scope, Install Quality, and Warranty — Not Price Games. This
                    Takes about 1 minute.
                  </p>
                  <CTAButton onClick={nextStep}>Continue</CTAButton>
                  <p className="text-xs text-muted-foreground/50 mt-4 text-center">
                    No spam. No marketplaces. No bidding wars.
                  </p>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Where Do You Currently Install?</h3>
                  <p className="text-xs mb-4 text-secondary-foreground">
                    This helps us route homeowners to the right crews — fast.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {areaOptions.map((area) => (
                      <button
                        key={area}
                        onClick={() => toggleArea(area)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          serviceAreas.includes(area)
                            ? "bg-primary/20 border-primary/40 text-primary"
                            : "bg-secondary/50 border-border hover:border-primary/30 text-secondary-foreground"
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Primary service area notes (optional)"
                    value={serviceNotes}
                    onChange={(e) => setServiceNotes(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground"
                    maxLength={200}
                  />

                  <h3 className="text-lg font-bold text-foreground mb-1">Monthly Project Volume?</h3>
                  <p className="text-xs mb-3 text-secondary-foreground">
                    We're not looking for "big." We're looking for consistent execution.
                  </p>
                  <div className="space-y-2 mb-6">
                    {["1–5", "6–15", "16–40", "41+"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setProjectVolume(opt)}
                        className={`w-full text-left text-sm px-4 py-2.5 rounded-lg border transition-colors ${
                          projectVolume === opt
                            ? "bg-primary/15 border-primary/40 text-foreground"
                            : "bg-secondary/30 border-border hover:border-primary/30 text-secondary-foreground"
                        }`}
                      >
                        {opt} projects/month
                      </button>
                    ))}
                  </div>
                  <CTAButton onClick={nextStep}>Next</CTAButton>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Typical Install Standard?</h3>
                  <p className="text-xs mb-3 text-secondary-foreground">
                    Homeowners use Windowman to understand scope. Clear scope wins here.
                  </p>
                  <div className="space-y-2 mb-6">
                    {[
                      { key: "code_compliant", label: "Code-compliant baseline (varies by job)" },
                      { key: "consistent", label: "Consistent scope + documented install method" },
                      { key: "premium", label: "Premium scope (water mgmt, fastening, finish)" },
                      { key: "tailored", label: "Tailored scope per opening, documented clearly" },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setInstallStandard(opt.key)}
                        className={`w-full text-left text-sm px-4 py-2.5 rounded-lg border transition-colors ${
                          installStandard === opt.key
                            ? "bg-primary/15 border-primary/40 text-foreground"
                            : "bg-secondary/30 border-border hover:border-primary/30 text-secondary-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-1">Quote Clarity?</h3>
                  <p className="text-xs mb-3 text-secondary-foreground">
                    Windowman rewards clarity. Vague quotes get treated as risk.
                  </p>
                  <div className="space-y-2 mb-6">
                    {[
                      { key: "yes", label: "Yes — standard on every quote" },
                      { key: "mostly", label: "Mostly — depends on salesperson" },
                      { key: "not_consistently", label: "Not consistently" },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setQuoteClarity(opt.key)}
                        className={`w-full text-left text-sm px-4 py-2.5 rounded-lg border transition-colors ${
                          quoteClarity === opt.key
                            ? "bg-primary/15 border-primary/40 text-foreground"
                            : "bg-secondary/30 border-border hover:border-primary/30 text-secondary-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <CTAButton onClick={nextStep}>Next</CTAButton>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Preferred Payment Model?</h3>
                  <p className="text-xs mb-3 text-secondary-foreground">
                    Windowman is Performance-based. We don't sell lists.
                  </p>
                  <div className="space-y-2 mb-6">
                    {[
                      { key: "performance", label: "Performance-based referrals only" },
                      { key: "mix", label: "Mix of referral + marketing spend" },
                      { key: "subscription", label: "Subscription lead programs" },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setPaymentPref(opt.key)}
                        className={`w-full text-left text-sm px-4 py-2.5 rounded-lg border transition-colors ${
                          paymentPref === opt.key
                            ? "bg-primary/15 border-primary/40 text-foreground"
                            : "bg-secondary/30 border-border hover:border-primary/30 text-secondary-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-1">Warranty Posture?</h3>
                  <p className="text-xs mb-3 text-secondary-foreground">
                    Homeowners interpret warranty as a proxy for confidence.
                  </p>
                  <div className="space-y-2 mb-6">
                    {[
                      { key: "mfr_only", label: "Manufacturer warranty only" },
                      { key: "mfr_workmanship", label: "Manufacturer + workmanship warranty" },
                      { key: "full", label: "Manufacturer + workmanship + documented service" },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setWarrantyPosture(opt.key)}
                        className={`w-full text-left text-sm px-4 py-2.5 rounded-lg border transition-colors ${
                          warrantyPosture === opt.key
                            ? "bg-primary/15 border-primary/40 text-foreground"
                            : "bg-secondary/30 border-border hover:border-primary/30 text-secondary-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <CTAButton onClick={nextStep}>Next</CTAButton>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Business Identity</h3>
                  <p className="text-xs mb-4 text-secondary-foreground">
                    We verify legitimacy to protect homeowners and contractors.
                  </p>

                  <div className="space-y-3 mb-6">
                    <div>
                      <input
                        type="text"
                        placeholder="Business name"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        maxLength={200}
                        className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                      {errors.businessName && <p className="text-xs text-destructive mt-1">{errors.businessName}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          placeholder="License number"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          maxLength={50}
                          className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                        {errors.licenseNumber && (
                          <p className="text-xs text-destructive mt-1">{errors.licenseNumber}</p>
                        )}
                      </div>
                      <div>
                        <select
                          value={licenseState}
                          onChange={(e) => setLicenseState(e.target.value)}
                          className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        >
                          <option value="">State</option>
                          {[
                            "AL",
                            "AK",
                            "AZ",
                            "AR",
                            "CA",
                            "CO",
                            "CT",
                            "DE",
                            "FL",
                            "GA",
                            "HI",
                            "ID",
                            "IL",
                            "IN",
                            "IA",
                            "KS",
                            "KY",
                            "LA",
                            "ME",
                            "MD",
                            "MA",
                            "MI",
                            "MN",
                            "MS",
                            "MO",
                            "MT",
                            "NE",
                            "NV",
                            "NH",
                            "NJ",
                            "NM",
                            "NY",
                            "NC",
                            "ND",
                            "OH",
                            "OK",
                            "OR",
                            "PA",
                            "RI",
                            "SC",
                            "SD",
                            "TN",
                            "TX",
                            "UT",
                            "VT",
                            "VA",
                            "WA",
                            "WV",
                            "WI",
                            "WY",
                          ].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        {errors.licenseState && <p className="text-xs text-destructive mt-1">{errors.licenseState}</p>}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-1">Primary Contact</h3>
                  <p className="text-xs mb-4 text-secondary-foreground">
                    We'll send access details and routing preferences here.
                  </p>

                  <div className="space-y-3 mb-6">
                    <div>
                      <input
                        type="text"
                        placeholder="Full name"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        maxLength={100}
                        className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                      {errors.contactName && <p className="text-xs text-destructive mt-1">{errors.contactName}</p>}
                    </div>
                    <div>
                      <select
                        value={contactRole}
                        onChange={(e) => setContactRole(e.target.value)}
                        className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      >
                        <option value="">Role</option>
                        <option value="owner">Owner</option>
                        <option value="gm">GM</option>
                        <option value="sales_director">Sales Director</option>
                        <option value="ops">Ops</option>
                      </select>
                      {errors.contactRole && <p className="text-xs text-destructive mt-1">{errors.contactRole}</p>}
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        maxLength={255}
                        className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                      {errors.contactEmail && <p className="text-xs text-destructive mt-1">{errors.contactEmail}</p>}
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="Phone"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        maxLength={20}
                        className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                      {errors.contactPhone && <p className="text-xs text-destructive mt-1">{errors.contactPhone}</p>}
                    </div>
                  </div>

                  <CTAButton onClick={handleSubmit}>Submit for Review</CTAButton>
                  <p className="text-xs mt-3 text-center text-secondary-foreground">
                    Review is typically same-day. If we're not a fit, we'll tell you directly.
                  </p>
                </div>
              )}

              {step === 5 && outcome === "approved" && (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">✓</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Access Approved</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    You'll Receive Contractor Access Details and Routing Preferences Next. Windowman Will Start Sending
                    Motivated & Educated Buyers in Your Service Area.
                  </p>
                  <CTAButton onClick={() => { onClose(); navigate("/partner/onboarding"); }}>Set Routing Preferences</CTAButton>
                </div>
              )}

              {step === 5 && outcome === "waitlist" && (
                <div className="text-center py-4">
                  <h3 className="text-xl font-bold text-foreground mb-3">You're on the waitlist</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    Based on your current setup, we're not ready to route homeowners yet. If you tighten quote clarity
                    and warranty presentation, you'll be a strong fit.
                  </p>
                  <CTAButton onClick={onClose}>See what "clear scope" looks like</CTAButton>
                  <button
                    onClick={onClose}
                    className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors block mx-auto"
                  >
                    Notify me when access opens
                  </button>
                </div>
              )}

              {step === 5 && outcome === "not_a_fit" && (
                <div className="text-center py-4">
                  <h3 className="text-xl font-bold text-foreground mb-3">Not a fit right now</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    Windowman is built for contractors who document scope and stand behind installs consistently. If
                    that changes, you're welcome to reapply.
                  </p>
                  <CTAButton variant="secondary" onClick={onClose}>
                    Close
                  </CTAButton>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </GlassPanel>
      </motion.div>
    </motion.div>
  );
};

export default QualificationFlow;
