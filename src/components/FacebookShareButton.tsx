/**
 * FacebookShareButton — Viral loop component for report sharing.
 *
 * After a user gets their grade (especially D/F), prompt them to
 * share with neighbors/friends who might also be getting quotes.
 *
 * This creates organic reach that supplements paid Facebook ads.
 * Each share is a free impression with social proof built in.
 */

import { Share2, MessageCircle, Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";
import { trackConversion } from "@/lib/metaPixel";

interface FacebookShareButtonProps {
  grade?: string;
  county?: string;
  /** Compact mode for inline use */
  compact?: boolean;
  className?: string;
}

export function FacebookShareButton({
  grade,
  county,
  compact = false,
  className = "",
}: FacebookShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://windowman.pro";
  const shareText = grade
    ? `My impact window quote just got a Grade ${grade}. ${
        grade === "D" || grade === "F"
          ? "Found some serious issues."
          : "See how yours compares."
      } Free scanner:`
    : "Found this free AI scanner for impact window quotes. Worth checking before you sign:";

  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    shareUrl
  )}&quote=${encodeURIComponent(shareText)}`;

  const handleShare = useCallback(
    (method: "facebook" | "copy" | "native") => {
      // Track the share event
      trackConversion({
        eventName: "wm_report_shared",
        params: {
          method,
          grade: grade || "unknown",
          county: county || "unknown",
        },
      });

      if (method === "facebook") {
        window.open(
          facebookShareUrl,
          "fb-share",
          "width=580,height=400,menubar=no,toolbar=no"
        );
      } else if (method === "copy") {
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      } else if (method === "native" && navigator.share) {
        navigator.share({
          title: "WindowMan — Free Impact Window Quote Scanner",
          text: shareText,
          url: shareUrl,
        });
      }
    },
    [facebookShareUrl, grade, county, shareText, shareUrl]
  );

  if (compact) {
    return (
      <button
        onClick={() =>
          navigator.share
            ? handleShare("native")
            : handleShare("facebook")
        }
        className={`inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors ${className}`}
        aria-label="Share this report"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </button>
    );
  }

  return (
    <div
      className={`rounded-xl bg-slate-900/60 ring-1 ring-white/5 p-5 ${className}`}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
          <Share2 className="h-4 w-4 text-blue-400" />
        </div>
        <div>
          <p
            className="text-sm font-bold text-white"
            style={{ letterSpacing: "-0.01em" }}
          >
            Know someone getting quotes?
          </p>
          <p className="text-[11px] text-slate-500">
            Share this free scanner with a neighbor or friend
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {/* Facebook Share */}
        <button
          onClick={() => handleShare("facebook")}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#1877F2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#166FE5] transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          Share on Facebook
        </button>

        {/* Copy Link */}
        <button
          onClick={() => handleShare("copy")}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors ring-1 ring-white/5"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-400" />
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}
