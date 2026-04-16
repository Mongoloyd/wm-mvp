import { useState, useEffect, useCallback } from "react";

interface CalendlyEmbedProps {
  url: string;
  height?: number;
  /** Called when Calendly fires `calendly.event_scheduled` via postMessage */
  onEventScheduled?: (data: Record<string, unknown>) => void;
}

export default function CalendlyEmbed({ url, height, onEventScheduled }: CalendlyEmbedProps) {
  const [loaded, setLoaded] = useState(false);

  const isValid = typeof url === "string" && url.trim().length > 0;

  // Listen for Calendly postMessage events
  useEffect(() => {
    if (!onEventScheduled) return;

    const handler = (e: MessageEvent) => {
      if (e.data?.event === "calendly.event_scheduled") {
        onEventScheduled(e.data.payload ?? {});
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onEventScheduled]);

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
