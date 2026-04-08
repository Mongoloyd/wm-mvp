import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import exitIntentPhoneImg from "@/assets/exit-intent-phone.avif";

interface ExitIntentPhoneModalProps {
  stepsCompleted: number;
  flowMode: "A" | "B" | "C";
  leadCaptured: boolean;
  flowBLeadCaptured: boolean;
  county: string;
  answers: {
    windowCount: string | null;
    projectType: string | null;
    county: string | null;
    quoteStage: string | null;
    firstName: string | null;
    email: string | null;
    phone: string | null;
  };
  onClose: () => void;
  onCTAClick: () => void;
  onLeadSubmit?: (data: { email: string; phone: string }) => void;
  onReminderSet?: (data: { date: string; time: string }) => void;
}

const ExitIntentPhoneModal = ({ leadCaptured, onClose, onCTAClick }: ExitIntentPhoneModalProps) => {
  const [open, setOpen] = useState(false);

  const show = useCallback(() => {
    if (leadCaptured || sessionStorage.getItem("wm_exit_shown") === "true") return;
    sessionStorage.setItem("wm_exit_shown", "true");
    setOpen(true);
  }, [leadCaptured]);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (e.clientY < 20) show();
    };
    const handleVisibility = () => {
      if (document.hidden) show();
    };
    document.addEventListener("mouseleave", handleMouse);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("mouseleave", handleMouse);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [show]);

  const dismiss = () => {
    setOpen(false);
    onClose();
  };

  const handleCTA = () => {
    setOpen(false);
    onCTAClick();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9500] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) dismiss();
          }}
        >
          <div className="relative">
            <button
              onClick={dismiss}
              className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lg hover:bg-background transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <motion.img
              src={exitIntentPhoneImg}
              alt="Scan your quote — free instant analysis"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="max-w-[90vw] max-h-[80vh] object-contain cursor-pointer rounded-lg"
              onClick={handleCTA}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentPhoneModal;
