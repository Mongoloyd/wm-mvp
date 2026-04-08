/**
 * usePartnerAuth — Resolves partner identity state for route guarding.
 *
 * States:
 * - loading: checking auth + contractor link
 * - unauthenticated: no session
 * - unlinked: authenticated but not linked to a contractor
 * - suspended: linked but contractor_profiles.status !== 'active'
 * - active: fully linked and active partner
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PartnerState = "loading" | "unauthenticated" | "unlinked" | "suspended" | "active";

interface PartnerAuth {
  state: PartnerState;
  userId: string | null;
  contractorId: string | null;
  companyName: string | null;
}

export function usePartnerAuth(): PartnerAuth {
  const [auth, setAuth] = useState<PartnerAuth>({
    state: "loading",
    userId: null,
    contractorId: null,
    companyName: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (!cancelled) setAuth({ state: "unauthenticated", userId: null, contractorId: null, companyName: null });
        return;
      }

      const userId = session.user.id;

      // Check contractor bridge
      const { data: contractor } = await supabase
        .from("contractors" as any)
        .select("id, company_name, status")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (!contractor) {
        if (!cancelled) setAuth({ state: "unlinked", userId, contractorId: null, companyName: null });
        return;
      }

      // Check contractor_profiles status
      const { data: profile } = await supabase
        .from("contractor_profiles" as any)
        .select("status")
        .eq("id", userId)
        .maybeSingle();

      const status = (profile as any)?.status ?? (contractor as any).status ?? "active";

      if (status !== "active") {
        if (!cancelled) setAuth({
          state: "suspended",
          userId,
          contractorId: (contractor as any).id,
          companyName: (contractor as any).company_name,
        });
        return;
      }

      if (!cancelled) setAuth({
        state: "active",
        userId,
        contractorId: (contractor as any).id,
        companyName: (contractor as any).company_name,
      });
    }

    resolve();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      resolve();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return auth;
}
