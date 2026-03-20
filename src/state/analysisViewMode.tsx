import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AnalysisViewMode = "classic" | "findings";

const STORAGE_KEY = "wm:analysisViewMode";

type AnalysisViewModeContextValue = {
  mode: AnalysisViewMode;
  setMode: (mode: AnalysisViewMode) => void;
  toggleMode: () => void;
  isReady: boolean;
};

const AnalysisViewModeContext = createContext<AnalysisViewModeContextValue | null>(null);

function readInitialMode(): AnalysisViewMode {
  if (typeof window === "undefined") return "classic";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  // Support legacy "v2" values from existing localStorage
  if (raw === "findings" || raw === "v2") return "findings";
  return "classic";
}

export function AnalysisViewModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AnalysisViewMode>("classic");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setModeState(readInitialMode());
    setIsReady(true);
  }, []);

  const setMode = useCallback((next: AnalysisViewMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === "classic" ? "findings" : "classic"));
  }, []);

  const value = useMemo(
    () => ({ mode, setMode, toggleMode, isReady }),
    [mode, setMode, toggleMode, isReady]
  );

  return <AnalysisViewModeContext.Provider value={value}>{children}</AnalysisViewModeContext.Provider>;
}

export function useAnalysisViewMode() {
  const ctx = useContext(AnalysisViewModeContext);
  if (!ctx) {
    throw new Error("useAnalysisViewMode must be used within <AnalysisViewModeProvider />");
  }
  return ctx;
}
