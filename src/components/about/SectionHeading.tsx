interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
}

export default function SectionHeading({ children, className = "" }: SectionHeadingProps) {
  return (
    <h2
      className={`font-display text-4xl font-extrabold uppercase tracking-tight text-foreground md:text-5xl ${className}`}
    >
      {children}
    </h2>
  );
}
