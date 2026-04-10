import { supabase } from "@/integrations/supabase/client";
import type {
  HomepageLeadQualificationRequest,
  HomepageLeadQualificationResponse,
} from "@/types/homepageLead";

function sanitizeRequest(input: HomepageLeadQualificationRequest): HomepageLeadQualificationRequest {
  return {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    source: input.source.trim(),
    context: input.context ?? {},
  };
}

export async function qualifyHomepageLead(
  input: HomepageLeadQualificationRequest,
): Promise<HomepageLeadQualificationResponse> {
  const body = sanitizeRequest(input);

  const { data, error } = await supabase.functions.invoke("qualify-homepage-lead", {
    body,
  });

  if (error) {
    let errorMessage = "Unable to qualify lead at this time.";

    try {
      if (error.context && typeof error.context.json === "function") {
        const parsed = await error.context.json();
        errorMessage = parsed?.reason || parsed?.error || errorMessage;
      }
    } catch {
      // Fall back to generic message.
    }

    return {
      success: false,
      lead_id: null,
      qualified: false,
      can_run_ai: false,
      phone_e164: null,
      phone_line_type: null,
      reason: errorMessage,
    };
  }

  return {
    success: Boolean(data?.success),
    lead_id: data?.lead_id ?? null,
    qualified: Boolean(data?.qualified),
    can_run_ai: Boolean(data?.can_run_ai),
    phone_e164: data?.phone_e164 ?? null,
    phone_line_type: data?.phone_line_type ?? null,
    reason: data?.reason ?? null,
  };
}
