import { Eye } from "lucide-react";

export function PreviewModeBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 text-[11px] font-semibold border border-amber-200">
      <Eye className="h-3 w-3" />
      Sandbox Preview
    </span>
  );
}
