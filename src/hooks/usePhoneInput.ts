import { useState, useCallback } from "react";
import { formatPhoneDisplay, stripNonDigits, toE164, isValidUSPhone } from "@/utils/formatPhone";

interface UsePhoneInputReturn {
  /** Formatted display value: (XXX) XXX-XXXX */
  displayValue: string;
  /** Raw digits only */
  rawDigits: string;
  /** E.164 format or null if incomplete */
  e164: string | null;
  /** Whether the number has 10 valid digits */
  isValid: boolean;
  /** onChange handler for the input */
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Set value programmatically */
  setValue: (value: string) => void;
}

export const usePhoneInput = (initialValue = ""): UsePhoneInputReturn => {
  const [rawDigits, setRawDigits] = useState(() => stripNonDigits(initialValue).slice(0, 10));

  const displayValue = formatPhoneDisplay(rawDigits);
  const e164 = toE164(rawDigits);
  const isValid = isValidUSPhone(rawDigits);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = stripNonDigits(e.target.value).slice(0, 10);
    setRawDigits(digits);
  }, []);

  const setValue = useCallback((value: string) => {
    setRawDigits(stripNonDigits(value).slice(0, 10));
  }, []);

  return { displayValue, rawDigits, e164, isValid, handleChange, setValue };
};
