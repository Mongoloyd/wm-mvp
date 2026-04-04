import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";

type IntentState = "cold" | "warm";

interface WarmIntentContextType {
  intentState: IntentState;
  setIntentState: (state: IntentState) => void;
}

const WarmIntentContext = createContext<WarmIntentContextType>({
  intentState: "cold",
  setIntentState: () => {},
});

export const useWarmIntent = () => useContext(WarmIntentContext);

export const WarmIntentProvider = ({ children }: { children: ReactNode }) => {
  const [intentState, setIntentState] = useState<IntentState>("cold");

  const handleScroll = useCallback(() => {
    if (intentState === "warm") return;

    const scrollPercent =
      window.scrollY /
      (document.documentElement.scrollHeight - window.innerHeight);

    if (scrollPercent >= 0.52) {
      setIntentState("warm");
    }
  }, [intentState]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const scrollPercent =
        window.scrollY /
        (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPercent > 0.2) {
        setIntentState("warm");
      }
    }, 40000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <WarmIntentContext.Provider value={{ intentState, setIntentState }}>
      {children}
    </WarmIntentContext.Provider>
  );
};