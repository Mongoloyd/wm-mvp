
import React, { useState, useEffect, useRef } from "react";

export default function CalendlyEmbed({ url, height = 700 }) {
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef(null);

  let embedUrl;
  try {
    embedUrl = new URL(url || "");
  } catch (e) {
    return null;
  }
  embedUrl.searchParams.set("hide_event_type_details", "1");
  embedUrl.searchParams.set("hide_gdpr_banner", "1");
  embedUrl.searchParams.set("background_color", "111111");
  embedUrl.searchParams.set("text_color", "ffffff");
  embedUrl.searchParams.set("primary_color", "ffffff");

  useEffect(() => {
    const scriptId = "calendly-widget-script";
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      script.onload = () => setIsLoading(false);
      document.head.appendChild(script);
    } else {
      setIsLoading(false);
      if (window.Calendly && containerRef.current && !containerRef.current.hasChildNodes()) {
        window.Calendly.initInlineWidget({ url: embedUrl.toString(), parentElement: containerRef.current, prefill: {}, utm: {} });
      }
    }
  }, [embedUrl]);

  return (
    <div className="relative w-full" style={{ height }}>
      {isLoading && <div className="absolute inset-0 z-10 animate-pulse rounded-xl bg-white/[0.03]" style={{ height }} />}
      <div ref={containerRef} className="calendly-inline-widget relative z-20 w-full rounded-xl" data-url={embedUrl.toString()} style={{ minWidth: "320px", height: `${height}px` }} />
    </div>
  );
}