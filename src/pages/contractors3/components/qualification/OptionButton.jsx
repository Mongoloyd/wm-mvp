
import React from "react";
import { cn } from "@/lib/utils";

export default function OptionButton({ label, selected, onClick, disabled = false }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={cn(
        "w-full min-h-[52px] rounded-[10px] border px-4 py-3 text-sm font-medium text-white transition-all duration-150 ease-in-out text-left",
        selected ? "border-white/50 bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.2)]" : "border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
        disabled && "cursor-not-allowed opacity-50 hover:border-white/[0.08] hover:bg-white/[0.03]"
      )}>
      {label}
    </button>
  );
}