import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  body?: string;
  className?: string;
  align?: "left" | "center";
}

const SectionHeader = ({ title, body, className, align = "left" }: SectionHeaderProps) => {
  return (
    <div className={cn(align === "center" && "text-center", className)}>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-3">
        {title}
      </h2>
      {body && (
        <p className="text-base md:text-lg leading-relaxed max-w-xl text-secondary-foreground">
          {body}
        </p>
      )}
    </div>
  );
};

export default SectionHeader;