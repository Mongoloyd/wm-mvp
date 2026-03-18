import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Terminal statuses — stop polling when we hit one of these.
 */
const TERMINAL_STATUSES = new Set([
  "preview_ready",
  "complete",
  "invalid_document",
  "needs_better_upload",
]);

export type ScanStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "preview_ready"
  | "invalid_document"
  | "needs_better_upload"
  | "error";

interface UseScanPollingOptions {
  /** scan_sessions.id to poll */
  scanSessionId: string | null;
  /** Polling interval in ms (default: 2500) */
  intervalMs?: number;
  /** Max polls before giving up (default: 60 → ~2.5 min at 2.5s) */
  maxPolls?: number;
}

interface UseScanPollingResult {
  status: ScanStatus;
  isPolling: boolean;
  error: string | null;
}

/**
 * Thin polling hook for scan_sessions status.
 * Polls every `intervalMs` until a terminal status is reached or maxPolls exceeded.
 */
export function useScanPolling({
  scanSessionId,
  intervalMs = 2500,
  maxPolls = 60,
}: UseScanPollingOptions): UseScanPollingResult {
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollCountRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const poll = useCallback(async () => {
    if (!scanSessionId) return;

    pollCountRef.current += 1;
    if (pollCountRef.current > maxPolls) {
      setError("Scan is taking longer than expected. Please check back shortly.");
      stopPolling();
      return;
    }

    try {
      const { data, error: queryErr } = await supabase
        .from("scan_sessions")
        .select("status")
        .eq("id", scanSessionId)
        .single();

      if (queryErr) {
        console.error("Scan poll error:", queryErr);
        // Don't stop on transient errors — keep polling
        return;
      }

      const newStatus = (data?.status as ScanStatus) || "error";
      setStatus(newStatus);

      if (TERMINAL_STATUSES.has(newStatus)) {
        stopPolling();
      }
    } catch (err) {
      console.error("Scan poll exception:", err);
    }
  }, [scanSessionId, maxPolls, stopPolling]);

  useEffect(() => {
    // Reset when scanSessionId changes
    if (!scanSessionId) {
      stopPolling();
      setStatus("idle");
      setError(null);
      pollCountRef.current = 0;
      return;
    }

    // Start polling
    setStatus("uploading");
    setError(null);
    setIsPolling(true);
    pollCountRef.current = 0;

    // Immediate first poll
    poll();

    intervalRef.current = setInterval(poll, intervalMs);

    return () => {
      stopPolling();
    };
  }, [scanSessionId, intervalMs, poll, stopPolling]);

  return { status, isPolling, error };
}
