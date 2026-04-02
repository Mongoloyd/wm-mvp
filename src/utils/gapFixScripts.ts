/**
 * gapFixScripts — Generates homeowner-safe clarification questions
 * based on flag content. No legal advice. No sending.
 */

import type { AnalysisFlag } from "@/hooks/useAnalysisData";

interface ScriptMapping {
  keyword: string;
  question: string;
}

const SCRIPT_MAPPINGS: ScriptMapping[] = [
  { keyword: "permit", question: "Does the price include all city permit and filing fees?" },
  { keyword: "warranty", question: "Can you provide the written labor warranty terms?" },
  { keyword: "insurance", question: "Can you provide proof of general liability and workers' comp insurance?" },
  { keyword: "license", question: "Can you confirm your current state contractor license number?" },
  { keyword: "deposit", question: "What is the deposit structure, and is it compliant with Florida statutes?" },
  { keyword: "timeline", question: "What is the projected start date and estimated completion date?" },
  { keyword: "cancellation", question: "What is the cancellation policy and the notice period required?" },
  { keyword: "noa", question: "Can you confirm the NOA (Notice of Acceptance) numbers for each product?" },
  { keyword: "specification", question: "Can you provide exact product model numbers and specifications?" },
];

const FALLBACK_QUESTION =
  "I noticed some items in the fine print were unclear. Can we review these protective clauses?";

export function getGapFixQuestions(flags: AnalysisFlag[]): string[] {
  const questions = new Set<string>();

  for (const flag of flags) {
    const text = `${flag.label} ${flag.detail}`.toLowerCase();
    for (const mapping of SCRIPT_MAPPINGS) {
      if (text.includes(mapping.keyword)) {
        questions.add(mapping.question);
      }
    }
  }

  if (questions.size === 0) {
    return [FALLBACK_QUESTION];
  }

  return Array.from(questions);
}
