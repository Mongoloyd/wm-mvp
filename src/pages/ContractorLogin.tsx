import { useState } from "react";
import { Shield, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function ContractorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Access Pending",
        description: "Partner authentication is not yet active. Contact ops@windowman.pro for access.",
      });
    }, 1400);
  };

  return (
    <div className="min-h-screen bg-[hsl(222,47%,6%)] flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 bg-[hsl(222,47%,8%)] border-r border-white/5">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="h-9 w-9 rounded-lg bg-sky-500/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-sky-400" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white/90 font-mono">
              WindowMan
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white leading-tight mb-4">
            Partner Portal
          </h1>
          <p className="text-xl text-sky-400 font-medium mb-8">
            Weaponized Competitive Intelligence
          </p>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md">
            Access real-time dossiers on in-market homeowners. See exactly what your competitor quoted,
            where they cut corners, and how to win the deal.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
            <p className="text-xs text-slate-500">
              Verified homeowner leads with quote intelligence
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
            <p className="text-xs text-slate-500">
              Forensic vulnerability reports on competitor quotes
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
            <p className="text-xs text-slate-500">
              Pay-per-lead — no monthly contracts
            </p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="lg:hidden mb-10 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-sky-400" />
              <span className="text-lg font-semibold text-white/90 font-mono">WindowMan</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Partner Portal</h1>
            <p className="text-sm text-sky-400">Weaponized Competitive Intelligence</p>
          </div>

          <Card className="border-white/[0.06] bg-white/[0.02] shadow-2xl">
            <CardHeader className="pb-2 pt-8 px-8">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                  Secure Access
                </span>
              </div>
              <h2 className="text-xl font-semibold text-white">Sign in to your account</h2>
              <p className="text-sm text-slate-400 mt-1">
                Enter your partner credentials below.
              </p>
            </CardHeader>
            <CardContent className="px-8 pb-8 pt-4">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@company.com"
                    required
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-sky-500/40 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-sky-500/40 h-11"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-all"
                >
                  {loading ? (
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
                <button
                  type="button"
                  className="text-sm text-sky-400/80 hover:text-sky-300 transition-colors"
                  onClick={() =>
                    toast({
                      title: "Request Submitted",
                      description: "Our team will review your application within 24 hours.",
                    })
                  }
                >
                  Request Partner Access →
                </button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-[11px] text-slate-600 mt-6">
            WindowMan Partner Portal is invitation-only.
            <br />
            Unauthorized access attempts are logged.
          </p>
        </div>
      </div>
    </div>
  );
}
