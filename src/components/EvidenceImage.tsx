import { useState } from "react";
import { Search } from "lucide-react";

interface EvidenceImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  onClick?: () => void;
}

const EvidenceImage = ({ src, alt, width = 400, height = 225, className = "", onClick }: EvidenceImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const handleKeyDown = (e: React.KeyboardEvent) => { if ((e.key === "Enter" || e.key === " ") && onClick) { e.preventDefault(); onClick(); } };

  return (
    <div className={`relative overflow-hidden group cursor-pointer rounded-t-xl hover:shadow-lg transition-shadow duration-500 ${className}`} style={{ aspectRatio: "16/9" }} role="button" tabIndex={0} onClick={onClick} onKeyDown={handleKeyDown}>
      {!loaded && !error && <div className="absolute inset-0 bg-muted animate-pulse rounded-t-xl" />}
      {error && <div className="absolute inset-0 bg-muted flex items-center justify-center rounded-t-xl"><span className="text-muted-foreground text-xs">Image unavailable</span></div>}
      {!error && <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" fetchPriority="low" className={`w-full h-full object-cover rounded-t-xl transition-all duration-500 transform-gpu group-hover:scale-110 group-hover:brightness-90 ${loaded ? "opacity-100" : "opacity-0"}`} style={{ aspectRatio: "16/9" }} onLoad={() => setLoaded(true)} onError={() => setError(true)} />}
      {!error && loaded && <div className="absolute bottom-3 right-3 bg-black/60 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"><Search className="h-4 w-4" /></div>}
    </div>
  );
};

export default EvidenceImage;
