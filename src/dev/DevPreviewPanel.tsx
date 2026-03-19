/**
 * Floating dev-only panel for switching between report UI states.
 * Only renders when import.meta.env.DEV is true.
 * Does NOT affect production builds — tree-shaken out.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, ChevronDown, ChevronUp, X } from "lucide-react";
import { DEV_PREVIEW_STATES, type DevPreviewState } from "./fixtures";

interface DevPreviewPanelProps {
  currentState: DevPreviewState;
  onChange: (state: DevPreviewState) => void;
}

export default function DevPreviewPanel({ currentState, onChange }: DevPreviewPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!import.meta.env.DEV || dismissed) return null;

  const current = DEV_PREVIEW_STATES[currentState];

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="fixed bottom-20 left-4 z-[9999] w-64"
    >
      {/* Toggle bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-t-lg text-xs font-mono
          bg-zinc-900 text-emerald-400 border border-zinc-700 border-b-0
          hover:bg-zinc-800 transition-colors"
      >
        <Bug size={14} />
        <span className="flex-1 text-left">DEV: {current.label}</span>
        {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        <button
          onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
          className="ml-1 p-0.5 rounded hover:bg-zinc-700"
        >
          <X size={12} />
        </button>
      </button>

      {/* State list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-zinc-900 border border-zinc-700 border-t-0 rounded-b-lg"
          >
            {(Object.entries(DEV_PREVIEW_STATES) as [DevPreviewState, typeof current][]).map(
              ([key, config]) => (
                <button
                  key={key}
                  onClick={() => { onChange(key); setExpanded(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-mono transition-colors
                    ${key === currentState
                      ? "bg-emerald-900/40 text-emerald-300"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                >
                  <div className="font-semibold">{config.label}</div>
                  <div className="text-[10px] opacity-70">{config.description}</div>
                </button>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
