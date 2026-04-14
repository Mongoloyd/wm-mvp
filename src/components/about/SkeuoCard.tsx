interface SkeuoCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function SkeuoCard({ children, className = "" }: SkeuoCardProps) {
  return (
    <div
      className={`card-raised rounded-2xl bg-white p-6 md:p-8 border-double border-4 ${className}`}
    >
      {children}
    </div>
  );
}
