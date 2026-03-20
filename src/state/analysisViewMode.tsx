import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AnalysisViewMode = "v1" | "v2";

const STORAGE_KEY = "wm:analysisViewMode";

type AnalysisViewModeContextValue = {
  mode: AnalysisViewMode;
  setMode: (mode: AnalysisViewMode) => void;
  toggleMode: () => void;
  isReady: boolean;
};

const AnalysisViewModeContext = createContext<AnalysisViewModeContextValue | null>(null);

function readInitialMode(): AnalysisViewMode {
  if (typeof window === "undefined") return "v1";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === "v2" ? "v2" : "v1";
}

export function AnalysisViewModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AnalysisViewMode>("v1");
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
    setMode((prev) => (prev === "v1" ? "v2" : "v1"));
  }, [setMode]);

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
