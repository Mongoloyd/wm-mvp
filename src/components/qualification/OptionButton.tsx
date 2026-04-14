import { motion } from "framer-motion";

interface OptionButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function OptionButton({
  label,
  selected,
  onClick,
  disabled = false,
}: OptionButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={`
        w-full min-h-[52px] rounded-xl px-5 py-3 text-left text-sm font-medium
        border transition-all duration-150
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
        ${
          selected
            ? "bg-white/[0.08] border-white/30 text-white shadow-[0_0_16px_rgba(255,255,255,0.06)]"
            : "bg-zinc-900/60 border-white/10 text-zinc-300 hover:border-white/20"
        }
      `}
    >
      {label}
    </motion.button>
  );
}
