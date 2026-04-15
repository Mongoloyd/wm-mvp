import { useState } from "react";

interface CalendlyEmbedProps {
  url: string;
  height?: number;
}

export default function CalendlyEmbed({ url, height }: CalendlyEmbedProps) {
  const [loaded, setLoaded] = useState(false);

  const isValid = typeof url === "string" && url.trim().length > 0;

  if (!isValid) {
    return (
      <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
        <p className="text-xl font-bold text-white mb-2">
          Booking link not configured yet
        </p>
        <p className="text-sm text-zinc-500">
          Update PAGE_CONFIG.calendly.url
        </p>
      </div>
    );
  }

  const separator = url.includes("?") ? "&" : "?";
  const embedUrl = `${url}${separator}hide_landing_page_details=1&hide_gdpr_banner=1`;
  const desktopH = height ?? 700;

  return (
    <div className="relative w-full">
      {!loaded && (
        <div
          className="absolute inset-0 bg-zinc-900/60 rounded-2xl animate-pulse"
          style={{ minHeight: `${desktopH}px` }}
        />
      )}
      <iframe
        src={embedUrl}
        title="Book a walkthrough"
        className="w-full border-none bg-transparent rounded-2xl"
        style={{ minHeight: `${desktopH}px` }}
        onLoad={() => setLoaded(true)}
      />
      <style>{`
        @media (max-width: 640px) {
          iframe { min-height: 620px !important; }
        }
      `}</style>
    </div>
  );
}
