/**
 * AuthGuard — Ensures user has an active session before rendering children.
 * Unauthenticated visitors are redirected to the home page.
 * Role-level enforcement is handled inside each protected page component.
 */

import { useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Guards rendering of `children` behind an active Supabase session.
 *
 * While the session is being resolved, displays a full-screen loading UI.
 * Unauthenticated visitors are redirected to "/" via react-router.
 * Renders `children` only when an authenticated session is confirmed.
 *
 * @param children - Content to render when an authenticated session is present
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        const isAuthed = !!data?.session?.user;
        setAuthenticated(isAuthed);
        setChecking(false);
        if (!isAuthed) navigate("/", { replace: true });
      })
      .catch((err) => {
        console.error("[AuthGuard] Failed to get auth session:", err);
        setAuthenticated(false);
        setChecking(false);
        navigate("/", { replace: true });
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAuthed = !!session?.user;
      setAuthenticated(isAuthed);
      if (!isAuthed) navigate("/", { replace: true });
    });

    return () => data.subscription.unsubscribe();
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) return null;

  return <>{children}</>;
}
