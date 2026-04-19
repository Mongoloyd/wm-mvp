import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { trackGtmEvent } from '@/lib/trackConversion';

import { DIAGNOSTIC_MAP } from '../constants/diagnosticMap';
import { generateConditionalStatement } from '../constants/branchChips';
import { getSLAPromise } from '../lib/sla';
import type { DiagnosisCode, DiagnosticContext, StepId } from '../types';

/**
 * Hydration status for the diagnosis intake.
 *  - pending: initial check / async lookup in flight
 *  - ready: real lead context is loaded (router state OR durable fallback)
 *  - failed: no usable context — UI must render the safe empty state
 */
export type HydrationStatus = 'pending' | 'ready' | 'failed';

interface DiagnosisRouterState {
  lead_id?: string | null;
  scan_session_id?: string | null;
  report_grade?: string | null;
  first_name?: string | null;
  phone?: string | null;
  email?: string | null;
  top_insights?: string[] | null;
  returnTo?: string | null;
}

const EMPTY_CONTEXT: DiagnosticContext = {
  lead_id: '',
  scan_session_id: '',
  report_grade: '',
  top_insights: [],
  first_name: '',
  phone: '',
  email: '',
};

export function useDiagnosticIntake() {
  const location = useLocation();
  const navigate = useNavigate();
  const incomingState = (location.state ?? null) as DiagnosisRouterState | null;

  const [step, setStep] = useState<StepId>('intake');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState<DiagnosisCode | null>(null);
  const [secondaryClarifiers, setSecondaryClarifiers] = useState<string[]>([]);
  const [otherFreeText, setOtherFreeText] = useState('');
  const [windowStyles, setWindowStyles] = useState<string[]>([]);
  const [windowConcerns, setWindowConcerns] = useState<string[]>([]);
  const [frameMaterial, setFrameMaterial] = useState('');

  // Counter-offer state (Step 3)
  const [counterOfferTerms, setCounterOfferTerms] = useState<string[]>([]);
  const [counterOfferFreeText, setCounterOfferFreeText] = useState('');

  const [context, setContext] = useState<DiagnosticContext>(EMPTY_CONTEXT);
  const [hydrationStatus, setHydrationStatus] = useState<HydrationStatus>('pending');
  // returnTo is preserved separately so it survives refresh-driven recovery.
  const [returnTo, setReturnTo] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const pageTopRef = useRef<HTMLDivElement>(null);

  // ── Hydration: router state preferred, scan_session_id fallback ──────────
  useEffect(() => {
    let cancelled = false;

    // 1. Router state (preferred — immediate, full context)
    if (incomingState?.scan_session_id) {
      const ctx: DiagnosticContext = {
        lead_id: incomingState.lead_id ?? '',
        scan_session_id: incomingState.scan_session_id,
        report_grade: incomingState.report_grade ?? '',
        top_insights: Array.isArray(incomingState.top_insights) ? incomingState.top_insights : [],
        first_name: incomingState.first_name ?? '',
        phone: incomingState.phone ?? '',
        email: incomingState.email ?? '',
      };
      setContext(ctx);
      setReturnTo(incomingState.returnTo ?? (ctx.scan_session_id ? `/report/classic/${ctx.scan_session_id}` : null));
      setHydrationStatus('ready');
      return () => {
        cancelled = true;
      };
    }

    // 2. Durable fallback: scan_session_id is not in router state.
    //    In this pass we do NOT read it from the URL (no public URL contract
    //    change). If router state is missing, we fail closed to the empty state.
    setHydrationStatus('failed');

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once on mount
  }, []);

  const scrollToTop = useCallback(() => {
    pageTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const activeConfig = primaryDiagnosis ? DIAGNOSTIC_MAP[primaryDiagnosis] : null;

  const confidence = Math.min(
    0.95,
    0.6 +
      secondaryClarifiers.length * 0.05 +
      windowStyles.length * 0.02 +
      windowConcerns.length * 0.02 +
      (frameMaterial ? 0.05 : 0) +
      (otherFreeText.length > 20 ? 0.15 : 0)
  );

  const stepNumber = step === 'intake' ? 1 : step === 'diagnosis' ? 2 : 3;

  const toggleInArray = (
    arr: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => {
    setter(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const selectPrimaryDiagnosis = (code: DiagnosisCode) => {
    setPrimaryDiagnosis(code);
    setSecondaryClarifiers([]);
    setOtherFreeText('');

    trackGtmEvent('DiagnosticStarted', {
      lead_id: context.lead_id,
      scan_session_id: context.scan_session_id,
      diagnosis: code,
    });

    setStep('diagnosis');
    scrollToTop();
  };

  const advanceToPrescription = () => {
    if (!primaryDiagnosis) return;

    trackGtmEvent('DiagnosticClassified', {
      lead_id: context.lead_id,
      scan_session_id: context.scan_session_id,
      diagnosis: primaryDiagnosis,
      secondary_clarifiers: secondaryClarifiers,
      window_styles: windowStyles,
      window_concerns: windowConcerns,
      frame_material: frameMaterial || null,
      other_text_length: otherFreeText.length,
      confidence,
      prescription_path: DIAGNOSTIC_MAP[primaryDiagnosis].prescriptionPath,
    });

    setStep('prescription');
    scrollToTop();
  };

  const handleBack = () => {
    if (step === 'diagnosis') {
      setStep('intake');
      setPrimaryDiagnosis(null);
      setSecondaryClarifiers([]);
      setOtherFreeText('');
    } else if (step === 'prescription') {
      setStep('diagnosis');
    }
    scrollToTop();
  };

  const handleContactEdit = () => {
    // TODO(arc-5): deep-link to the lead record edit view or account settings
    console.log('[UX] User wants to edit pre-existing contact info', {
      lead_id: context.lead_id,
    });
    alert('In production, this opens your account settings to update contact info.');
  };

  /**
   * Back-to-Report navigation.
   * Order:
   *   1. returnTo (router-state-supplied)
   *   2. /report/classic/:scan_session_id (canonical reconstruction)
   *   3. "/" (final fallback)
   * Browser history is intentionally NOT used — users may have navigated
   * around other pages first.
   */
  const handleReturnToReport = useCallback(() => {
    if (returnTo) {
      navigate(returnTo);
      return;
    }
    if (context.scan_session_id) {
      navigate(`/report/classic/${context.scan_session_id}`);
      return;
    }
    navigate('/');
  }, [navigate, returnTo, context.scan_session_id]);

  // Counter-offer readiness — CTA gates on at least one amber chip
  const hasCounterOffer = counterOfferTerms.length > 0;

  const canAdvanceFromDiagnosis =
    primaryDiagnosis === 'other'
      ? otherFreeText.trim().length >= 10
      : secondaryClarifiers.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryDiagnosis || !hasCounterOffer) return;
    if (!context.scan_session_id) {
      console.warn('[Diagnosis] Submit blocked: missing scan_session_id (no continuity).');
      return;
    }

    setIsSubmitting(true);

    // Compute SLA at submit time (not render time) for accuracy
    const sla = getSLAPromise(new Date());
    const conditionalStatement = generateConditionalStatement(
      DIAGNOSTIC_MAP[primaryDiagnosis].label,
      counterOfferTerms
    );

    // Submission keeps the SAME lead_id + scan_session_id from the report
    // handoff. Do NOT mint a new synthetic lead thread here.
    const payload = {
      lead_id: context.lead_id,
      scan_session_id: context.scan_session_id,
      report_grade: context.report_grade,
      source: 'post_report_diagnostic_intake',
      diagnosis: {
        primary: primaryDiagnosis,
        secondary_clarifiers: secondaryClarifiers,
        other_text: otherFreeText || null,
        confidence,
        prescription_path: DIAGNOSTIC_MAP[primaryDiagnosis].prescriptionPath,
      },
      window_intelligence: {
        styles: windowStyles,
        concerns: windowConcerns,
        frame_material: frameMaterial || null,
      },
      counter_offer: {
        terms_selected: counterOfferTerms,
        terms_free_text: counterOfferFreeText.trim() || null,
        conditional_close_statement: conditionalStatement,
      },
      advisor_sla: {
        promised_callback_by: sla.callbackIso,
        urgency: sla.urgency,
        hot_lead: true,
      },
    };

    // TODO(arc-5): replace with real API submission
    console.log('[API] Submitting close-ready brief:', payload);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    trackGtmEvent('Schedule', {
      value: 1000,
      currency: 'USD',
      lead_id: context.lead_id,
      scan_session_id: context.scan_session_id,
      diagnosis: primaryDiagnosis,
      prescription_path: DIAGNOSTIC_MAP[primaryDiagnosis].prescriptionPath,
      counter_offer_terms_count: counterOfferTerms.length,
      sla_urgency: sla.urgency,
    });

    setIsSubmitting(false);
    setStep('success');
    scrollToTop();
  };

  return {
    // State
    step,
    primaryDiagnosis,
    secondaryClarifiers,
    otherFreeText,
    windowStyles,
    windowConcerns,
    frameMaterial,
    counterOfferTerms,
    counterOfferFreeText,
    context,
    isSubmitting,
    hydrationStatus,
    returnTo,

    // Derived
    activeConfig,
    confidence,
    hasCounterOffer,
    canAdvanceFromDiagnosis,
    stepNumber,

    // Refs
    pageTopRef,

    // Setters
    setSecondaryClarifiers,
    setOtherFreeText,
    setWindowStyles,
    setWindowConcerns,
    setFrameMaterial,
    setCounterOfferTerms,
    setCounterOfferFreeText,

    // Handlers
    toggleInArray,
    selectPrimaryDiagnosis,
    advanceToPrescription,
    handleBack,
    handleContactEdit,
    handleSubmit,
    handleReturnToReport,
    scrollToTop,
  };
}
