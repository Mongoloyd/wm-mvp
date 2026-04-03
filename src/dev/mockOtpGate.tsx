/**
 * Mock OTP Gate — standalone scratchpad for Truth Gate testing.
 * Hardcoded OTP: 1234. No Supabase/Twilio calls.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Unlock, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { mockPartialPayload, mockFullPayload } from "./mockOtpFixtures";

type FlowState = "collecting" | "otp_challenge" | "analyzing" | "partial_reveal" | "full_reveal";

export default function MockTruthGateTest() {
  const [state, setState] = useState<FlowState>("collecting");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const tier = phone.trim() ? "full" : "partial";

  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) return;
    console.log(`[TEST MODE] OTP Sent: 1234 — Tier: ${tier}`);
    setState("otp_challenge");
  };

  const handleVerify = () => {
    if (otp !== "1234") {
      setOtpError("Wrong code. Hint: 1234");
      return;
    }
    setOtpError("");
    setState("analyzing");
    setTimeout(() => setState(tier === "full" ? "full_reveal" : "partial_reveal"), 800);
  };

  const handleReset = () => {
    setState("collecting");
    setName("");
    setEmail("");
    setPhone("");
    setOtp("");
    setOtpError("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Dev Scratchpad</p>
          <h1 className="text-xl font-bold">Mock Truth Gate</h1>
          <p className="text-sm text-muted-foreground">OTP: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">1234</code></p>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Collecting ── */}
          {state === "collecting" && (
            <motion.div key="collect" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
              <Card>
                <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-transparent border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-transparent border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                <input placeholder="Phone (optional — unlocks full report)" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-transparent border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                <button onClick={handleSubmit} disabled={!name.trim() || !email.trim()} className="w-full bg-primary text-primary-foreground rounded-md py-2.5 text-sm font-semibold disabled:opacity-40 transition-opacity">
                  {phone.trim() ? "Get Full Report" : "Get Partial Grade"}
                </button>
              </Card>
              <TierIndicator tier={tier} />
            </motion.div>
          )}

          {/* ── OTP Challenge ── */}
          {state === "otp_challenge" && (
            <motion.div key="otp" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
              <Card>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock size={14} />
                  <span>Enter verification code</span>
                </div>
                <input placeholder="Enter 4-digit code" maxLength={4} value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, "")); setOtpError(""); }} className="w-full bg-transparent border border-border rounded-md px-3 py-2 text-center text-lg tracking-[0.3em] font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
                {otpError && <p className="text-xs text-destructive">{otpError}</p>}
                <button onClick={handleVerify} disabled={otp.length < 4} className="w-full bg-primary text-primary-foreground rounded-md py-2.5 text-sm font-semibold disabled:opacity-40 transition-opacity">
                  Verify
                </button>
              </Card>
            </motion.div>
          )}

          {/* ── Analyzing ── */}
          {state === "analyzing" && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 py-12">
              <Loader2 size={28} className="animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-mono">Analyzing quote data…</p>
            </motion.div>
          )}

          {/* ── Partial Reveal ── */}
          {state === "partial_reveal" && (
            <motion.div key="partial" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
              <Card>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Partial Reveal</span>
                  <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full font-semibold">Tier 1</span>
                </div>
                <div className="text-center py-4">
                  <p className="text-5xl font-black text-primary">{mockPartialPayload.grade}</p>
                  <p className="text-sm text-muted-foreground mt-1">{mockPartialPayload.issueCount} issues found</p>
                </div>
                {mockPartialPayload.teaserFields.map(f => (
                  <div key={f.label} className="flex justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="font-semibold">{f.value}</span>
                  </div>
                ))}
                {/* Blurred placeholder */}
                <div className="relative rounded-md overflow-hidden mt-2">
                  <div className="blur-md select-none pointer-events-none space-y-2 p-3 bg-muted/30">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center gap-1.5 bg-background/90 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground">
                      <Lock size={12} /> Add phone to unlock full analysis
                    </div>
                  </div>
                </div>
              </Card>
              <button onClick={handleReset} className="w-full text-xs text-muted-foreground underline">Reset test</button>
            </motion.div>
          )}

          {/* ── Full Reveal ── */}
          {state === "full_reveal" && (
            <motion.div key="full" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
              <Card>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Full Reveal</span>
                  <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><Unlock size={10} /> Tier 2</span>
                </div>
                <div className="text-center py-4">
                  <p className="text-5xl font-black text-primary">{mockFullPayload.grade}</p>
                  <p className="text-sm text-muted-foreground mt-1">{mockFullPayload.issueCount} issues found</p>
                </div>
                {/* Pillars */}
                <div className="space-y-2">
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">5 Pillars</p>
                  {mockFullPayload.pillars.map(p => (
                    <div key={p.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{p.name}</span>
                        <span className="font-semibold">{p.score}/100</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${p.score}%` }} transition={{ duration: 0.6, delay: 0.1 }} className={`h-full rounded-full ${p.score >= 60 ? "bg-emerald-500" : p.score >= 40 ? "bg-amber-500" : "bg-destructive"}`} />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Red Flags */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Red Flags</p>
                  {mockFullPayload.redFlags.map(f => (
                    <div key={f.label} className="flex items-start gap-2 text-sm">
                      {f.severity === "critical" ? <AlertTriangle size={14} className="text-destructive shrink-0 mt-0.5" /> : <Shield size={14} className="text-amber-500 shrink-0 mt-0.5" />}
                      <span>{f.label}</span>
                    </div>
                  ))}
                </div>
                {/* Negotiation Script */}
                <div className="space-y-1 pt-2">
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Negotiation Script</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{mockFullPayload.negotiationScript}</p>
                </div>
              </Card>
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-500">
                <CheckCircle2 size={12} /> Phone verified — full access granted
              </div>
              <button onClick={handleReset} className="w-full text-xs text-muted-foreground underline">Reset test</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm">{children}</div>;
}

function TierIndicator({ tier }: { tier: "partial" | "full" }) {
  return (
    <div className="text-center text-xs text-muted-foreground">
      {tier === "partial" ? (
        <span>📧 Email-only → <strong>Partial reveal</strong></span>
      ) : (
        <span>📱 Phone included → <strong>Full reveal</strong></span>
      )}
    </div>
  );
}
