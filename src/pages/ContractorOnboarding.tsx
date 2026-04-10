/**
 * ContractorOnboarding — Routing setup form for newly approved contractors.
 * Route: /partner/onboarding
 * Wrapped in PartnerGuard for auth enforcement.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import PartnerGuard from "@/components/auth/PartnerGuard";
import { FLORIDA_COUNTIES } from "@/store/countyData";

// ── Constants ────────────────────────────────────────────────────────────────

const UNIQUE_COUNTIES = [...new Set(FLORIDA_COUNTIES.map(c => c.county))].sort();

const PROJECT_TYPES = [
  { value: "replacement", label: "Full Replacement" },
  { value: "repair", label: "Repair / Reglaze" },
  { value: "retrofit", label: "Retrofit / Add-On" },
  { value: "new_construction", label: "New Construction" },
  { value: "doors", label: "Impact Doors" },
];

const BUDGET_BANDS = [
  { value: "under_10k", label: "Under $10k" },
  { value: "10k_20k", label: "$10k–$20k" },
  { value: "20k_40k", label: "$20k–$40k" },
  { value: "40k_plus", label: "$40k+" },
];

const CAPACITY_OPTIONS = [
  { value: "3", label: "1–3 per week" },
  { value: "7", label: "4–7 per week" },
  { value: "15", label: "8–15 per week" },
  { value: "999", label: "Unlimited" },
];

// ── Stub: wire to Resend / transactional email later ─────────────────────────
/** TODO: Connect to email provider (Resend) to send confirmation email */
function notifyContractorApproved(_contractorId: string) {
  console.log(
    `[ONBOARDING:STUB] notifyContractorApproved — contractor ${_contractorId}. ` +
    `Wire this to Resend with subject: "Windowman Access Approved – Finish Your Routing Setup"`
  );
}

// ── Component ────────────────────────────────────────────────────────────────

function OnboardingForm() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedCounties, setSelectedCounties] = useState<string[]>([]);
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<string[]>([]);
  const [selectedBudgetBands, setSelectedBudgetBands] = useState<string[]>([]);
  const [contactMethod, setContactMethod] = useState("call");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [maxLeadsPerWeek, setMaxLeadsPerWeek] = useState("7");

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const handleSubmit = async () => {
    if (selectedCounties.length === 0) {
      toast.error("Select at least one service county.");
      return;
    }
    if (selectedProjectTypes.length === 0) {
      toast.error("Select at least one project type.");
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("save-routing-preferences", {
        body: {
          service_counties: selectedCounties,
          project_types: selectedProjectTypes,
          budget_bands: selectedBudgetBands,
          preferred_contact_method: contactMethod,
          schedule_notes: scheduleNotes.trim(),
          max_leads_per_week: parseInt(maxLeadsPerWeek, 10),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.message || "Failed to save preferences");

      notifyContractorApproved(data?.contractor_id ?? "unknown");
      toast.success("Routing preferences saved! You'll start receiving leads soon.");
      navigate("/partner/opportunities");
    } catch (err: any) {
      console.error("[ONBOARDING] save failed:", err);
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(222,47%,6%)]">
      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
        {/* Back link */}
        <button
          onClick={() => navigate("/partner/opportunities")}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Opportunities
        </button>

        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white mb-2">Set Your Routing Preferences</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Tell us where you operate, what types of leads you want, and how many you can handle.
            Once saved, we'll start routing motivated, educated buyers in your target zones.
          </p>
        </div>

        {/* ── Service Areas ──────────────────────────────────────────── */}
        <Section title="Service Areas" description="Select the Florida counties you serve.">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
            {UNIQUE_COUNTIES.map(county => (
              <label
                key={county}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${
                  selectedCounties.includes(county)
                    ? "border-sky-500/60 bg-sky-500/10 text-white"
                    : "border-white/10 text-slate-400 hover:border-white/20"
                }`}
              >
                <Checkbox
                  checked={selectedCounties.includes(county)}
                  onCheckedChange={() => toggleItem(selectedCounties, county, setSelectedCounties)}
                  className="border-white/20 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
                />
                {county}
              </label>
            ))}
          </div>
        </Section>

        {/* ── Project Types ──────────────────────────────────────────── */}
        <Section title="Lead Types" description="What types of projects do you want?">
          <div className="flex flex-wrap gap-2">
            {PROJECT_TYPES.map(pt => (
              <label
                key={pt.value}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${
                  selectedProjectTypes.includes(pt.value)
                    ? "border-sky-500/60 bg-sky-500/10 text-white"
                    : "border-white/10 text-slate-400 hover:border-white/20"
                }`}
              >
                <Checkbox
                  checked={selectedProjectTypes.includes(pt.value)}
                  onCheckedChange={() => toggleItem(selectedProjectTypes, pt.value, setSelectedProjectTypes)}
                  className="border-white/20 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
                />
                {pt.label}
              </label>
            ))}
          </div>
        </Section>

        {/* ── Budget Bands ───────────────────────────────────────────── */}
        <Section title="Budget Range" description="What quote ranges are you comfortable with? (optional)">
          <div className="flex flex-wrap gap-2">
            {BUDGET_BANDS.map(bb => (
              <label
                key={bb.value}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${
                  selectedBudgetBands.includes(bb.value)
                    ? "border-sky-500/60 bg-sky-500/10 text-white"
                    : "border-white/10 text-slate-400 hover:border-white/20"
                }`}
              >
                <Checkbox
                  checked={selectedBudgetBands.includes(bb.value)}
                  onCheckedChange={() => toggleItem(selectedBudgetBands, bb.value, setSelectedBudgetBands)}
                  className="border-white/20 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
                />
                {bb.label}
              </label>
            ))}
          </div>
        </Section>

        {/* ── Contact Preference ─────────────────────────────────────── */}
        <Section title="Contact Preference" description="How should we reach you about new leads?">
          <RadioGroup value={contactMethod} onValueChange={setContactMethod} className="flex gap-4">
            {[
              { value: "call", label: "Call" },
              { value: "text", label: "Text" },
              { value: "email", label: "Email" },
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <RadioGroupItem value={opt.value} className="border-white/20 text-sky-400" />
                {opt.label}
              </label>
            ))}
          </RadioGroup>
        </Section>

        {/* ── Capacity ───────────────────────────────────────────────── */}
        <Section title="Lead Capacity" description="Max leads you can handle per week.">
          <Select value={maxLeadsPerWeek} onValueChange={setMaxLeadsPerWeek}>
            <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CAPACITY_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Section>

        {/* ── Schedule Notes ──────────────────────────────────────────── */}
        <Section title="Schedule Notes" description="Any availability preferences? (optional)">
          <Textarea
            value={scheduleNotes}
            onChange={e => setScheduleNotes(e.target.value)}
            placeholder="e.g., Available Mon–Fri 8am–5pm, no weekends..."
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 max-w-md"
            maxLength={500}
          />
        </Section>

        {/* ── Submit ─────────────────────────────────────────────────── */}
        <div className="mt-10 flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={saving}
            size="lg"
            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-8 py-3 text-base rounded-xl shadow-lg shadow-sky-500/20"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Saving…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Save & Start Receiving Leads
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, description, children }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold text-white mb-1">{title}</h2>
      <p className="text-xs text-slate-500 mb-3">{description}</p>
      {children}
    </div>
  );
}

export default function ContractorOnboarding() {
  return (
    <PartnerGuard>
      <OnboardingForm />
    </PartnerGuard>
  );
}
