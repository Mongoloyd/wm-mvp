import { Eye } from "lucide-react";

export function PreviewModeBadge() {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/90 text-black text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-sm border border-amber-400/50">
      <Eye className="h-3.5 w-3.5" />
      Preview Mode
    </div>
  );
}
