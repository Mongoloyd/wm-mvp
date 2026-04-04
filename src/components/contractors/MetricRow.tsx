import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface MetricRowProps {
  icon: LucideIcon;
  value: string;
  label: string;
  className?: string;
}

const MetricRow = ({ icon: Icon, value, label, className }: MetricRowProps) => {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <span className="text-xl md:text-2xl font-bold text-foreground">{value}</span>
        <p className="text-sm text-secondary-foreground">{label}</p>
      </div>
    </div>
  );
};

export default MetricRow;