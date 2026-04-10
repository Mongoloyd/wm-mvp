import { type FormEvent, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type LeadCapturePayload = {
  name: string;
  email: string;
  phone: string;
};

interface LeadCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: LeadCapturePayload) => Promise<void>;
  isSubmitting: boolean;
  errorMessage?: string | null;
}

const DEFAULT_FORM: LeadCapturePayload = {
  name: "",
  email: "",
  phone: "",
};

export default function LeadCaptureModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  errorMessage,
}: LeadCaptureModalProps) {
  const [form, setForm] = useState<LeadCapturePayload>(DEFAULT_FORM);

  const updateField = (key: keyof LeadCapturePayload, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    });
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    // Keep the form reusable for future modules, while still resetting when modal is fully closed.
    if (!next && !isSubmitting) {
      setForm(DEFAULT_FORM);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px] border-border/70 bg-card/95 backdrop-blur">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            Unlock Your Demo Risk Snapshot
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Enter your details so we can screen the number and unlock this preliminary preview.
            Your full certified audit still runs through the main scanner.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead-name">Full name</Label>
            <Input
              id="lead-name"
              autoComplete="name"
              placeholder="Jane Homeowner"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-email">Email</Label>
            <Input
              id="lead-email"
              type="email"
              autoComplete="email"
              placeholder="jane@email.com"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-phone">Mobile phone</Label>
            <Input
              id="lead-phone"
              type="tel"
              autoComplete="tel"
              placeholder="(561) 555-0145"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {errorMessage && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          )}

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-primary" />
              This is a demo qualifier. Real certified results come from the full quote scanner.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Screening phone…
              </span>
            ) : (
              "Continue to Demo Preview"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
