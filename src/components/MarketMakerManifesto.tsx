import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  User,
  FileText,
  Zap,
  ShieldCheck,
  HardHat,
  CheckCircle2,
  Bot,
  Flag,
  DollarSign,
  MessageSquare,
  Handshake,
  PieChart,
  Scale,
  ArrowRight,
} from "lucide-react";

interface LayeredCardProps {
  children: React.ReactNode;
  shadowColor?: string;
  className?: string;
}

const LayeredCard = ({ children, shadowColor = "bg-primary", className = "" }: LayeredCardProps) => (
  <div className={`relative group w-full ${className}`}>
    <div
      className={`absolute inset-0 rounded-3xl translate-y-3 translate-x-3 transition-transform duration-300 group-hover:translate-y-4 group-hover:translate-x-4 ${shadowColor}`}
    />
    <div className="relative h-full bg-card border-2 border-border rounded-3xl p-6 sm:p-8 transition-transform duration-300 group-hover:-translate-y-1 group-hover:-translate-x-1 flex flex-col z-10 shadow-xl">
      {children}
    </div>
  </div>
);

interface BenefitItemProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  color: string;
}

const BenefitItem = ({ icon: Icon, title, description, color }: BenefitItemProps) => (
  <div className="relative group flex items-start p-4 sm:p-5 bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
    <div className={`absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl ${color} opacity-80`} />
    <div
      className={`flex-shrink-0 p-3 rounded-xl ${color} bg-opacity-10 mr-4 group-hover:scale-110 transition-transform`}
    >
      <Icon className={`w-6 h-6 ${color.replace("bg-", "text-")}`} />
    </div>
    <div>
      <h4 className="text-lg font-bold text-foreground">{title}</h4>
      {description && <p className="text-muted-foreground mt-1 text-sm sm:text-base leading-relaxed">{description}</p>}
    </div>
  </div>
);

interface MarketMakerManifestoProps {
  onDemoClick?: () => void;
}

const MarketMakerManifesto = ({ onDemoClick }: MarketMakerManifestoProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 24 } as const,
    animate: inView ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.5, delay, ease: "easeOut" as const },
  });

  return (
    <section className="relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-primary/20 rounded-full mix-blend-multiply filter blur-[100px]" />
        <div className="absolute top-[20%] right-[-10%] w-[35rem] h-[35rem] bg-primary/15 rounded-full mix-blend-multiply filter blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[45rem] h-[45rem] bg-accent/20 rounded-full mix-blend-multiply filter blur-[100px]" />
      </div>

      <div ref={ref} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
        {/* Header */}
        <motion.div {...fade(0)} className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-block relative mb-6">
            <div className="absolute inset-0 bg-primary rounded-full translate-y-1 translate-x-1 blur-[2px] opacity-40" />
            <span className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 text-primary text-sm font-bold uppercase tracking-widest shadow-sm bg-violet-50">
              <ShieldCheck className="w-4 h-4" />
              We Keep Both Sides Honest
            </span>
          </div>

          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-6 drop-shadow-sm leading-[1.1]">
            HOW WINDOWMAN <br />
            <span className="text-primary">ACTUALLY WORKS</span>
          </h2>

          <p className="text-xl text-muted-foreground font-medium leading-relaxed bg-card/50 backdrop-blur-sm p-4 rounded-2xl border border-border/60 shadow-sm inline-block">
            Most Services Profit From Information Asymmetry. <br className="hidden sm:block" />
            <strong className="text-foreground">WindowMan Profits From Eliminating It.</strong>
          </p>
        </motion.div>

        {/* Flow diagram */}
        <motion.div {...fade(0.1)} className="relative mb-24">
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-primary/20 to-accent/30 -translate-y-1/2 z-0" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12 lg:gap-8 relative z-10">
            {/* Step 1: You */}
            <div className="relative">
              <LayeredCard shadowColor="bg-primary">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-foreground">You</h3>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <User className="w-6 h-6" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl border border-border">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <span className="font-semibold text-foreground">Your Quote</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl border border-border">
                    <Zap className="w-5 h-5 text-muted-foreground" />
                    <span className="font-semibold text-foreground">Your Intent</span>
                  </div>
                </div>
              </LayeredCard>
              <div className="lg:hidden flex justify-center mt-6">
                <ArrowRight className="w-8 h-8 text-primary/40 rotate-90" />
              </div>
            </div>

            {/* Step 2: WindowMan */}
            <div className="relative transform lg:-translate-y-4">
              <LayeredCard shadowColor="bg-primary/80">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-foreground">WindowMan</h3>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <Zap className="w-5 h-5 text-primary fill-primary" />
                    <span className="font-semibold text-foreground">Warm Lead</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <Bot className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-foreground">+ Intel</span>
                  </div>
                </div>
              </LayeredCard>
              <div className="lg:hidden flex justify-center mt-6">
                <ArrowRight className="w-8 h-8 text-primary/40 rotate-90" />
              </div>
            </div>

            {/* Step 3: Contractor */}
            <div className="relative">
              <LayeredCard shadowColor="bg-[hsl(var(--color-emerald))]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-foreground">The Contractor</h3>
                  <div className="w-12 h-12 rounded-full bg-[hsl(var(--color-emerald))]/10 flex items-center justify-center text-[hsl(var(--color-emerald))] shadow-inner">
                    <HardHat className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center min-h-[100px]">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-16 h-16 text-[hsl(var(--color-emerald))]" strokeWidth={3} />
                    <span className="font-bold text-[hsl(var(--color-emerald))] uppercase tracking-widest text-sm">
                      Ready to Work
                    </span>
                  </div>
                </div>
              </LayeredCard>
            </div>
          </div>
        </motion.div>

        {/* What Do You Get */}
        <motion.div {...fade(0.15)} className="mb-24">
          <div className="text-center mb-10">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground inline-block relative">
              What Do You Get <span className="text-primary">— Free</span>
              <div className="absolute -bottom-2 left-0 w-full h-2 bg-primary/20 rounded-full" />
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <BenefitItem
              icon={Bot}
              title="Free Unbiased AI Analysis"
              description="Of your existing quote."
              color="bg-primary"
            />
            <BenefitItem
              icon={Flag}
              title="Red Flags Explained"
              description="In plain, easy-to-understand English."
              color="bg-destructive"
            />
            <BenefitItem
              icon={DollarSign}
              title="Fair-Market Price"
              description="Accurate pricing specific to your local area."
              color="bg-[hsl(var(--color-emerald))]"
            />
            <BenefitItem
              icon={MessageSquare}
              title="A Negotiation Script"
              description="Tailored specifically for your situation."
              color="bg-[hsl(var(--gold))]"
            />
            <BenefitItem
              icon={Handshake}
              title="Qualified Introduction"
              description="To a vetted contractor who will improve your quote."
              color="bg-primary"
            />
            <div className="hidden lg:flex items-center justify-center p-6 border-2 border-dashed border-border rounded-2xl bg-card/30 backdrop-blur-sm">
              <span className="text-muted-foreground font-semibold tracking-widest uppercase text-sm">
                100% Free For Homeowners
              </span>
            </div>
          </div>
        </motion.div>

        {/* How / Why cards */}
        <motion.div {...fade(0.2)} className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          <LayeredCard shadowColor="bg-foreground/80" className="md:-rotate-1 hover:rotate-0">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-secondary rounded-xl">
                <PieChart className="w-8 h-8 text-foreground" />
              </div>
              <h3 className="text-2xl font-black text-foreground">So How Do I Make Money?</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg font-medium flex-1">
              WindowMan Earns a Percentage Of The Sale —{" "}
              <span className="text-foreground font-bold bg-[hsl(var(--gold))]/20 px-1 rounded">
                Only When You Choose To Work With One Of Our Contractors
              </span>{" "}
              and Your Project is Completed.
            </p>
            <div className="mt-8 p-4 bg-foreground rounded-xl flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[hsl(var(--color-emerald))]" />
              <span className="text-background font-bold tracking-wide">We Never Charge Homeowners.</span>
            </div>
          </LayeredCard>

          <LayeredCard shadowColor="bg-primary/70" className="md:rotate-1 hover:rotate-0">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Scale className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-black text-foreground">Why Work With Me?</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg">
              <strong className="text-primary">We Level The Playing Field.</strong> When our Vetted Partners Walk In,
              They Know You've Already Been Educated.
            </p>
            <div className="mt-6 pl-4 border-l-4 border-primary/30">
              <p className="text-foreground italic font-medium">
                "Everyone Is On The Same Page From Minute One, Turning a Stressful Sales Pitch Into a Mutually
                Beneficial Agreement."
              </p>
            </div>
          </LayeredCard>
        </motion.div>
      </div>
    </section>
  );
};

export default MarketMakerManifesto;
