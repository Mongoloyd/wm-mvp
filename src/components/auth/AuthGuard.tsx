/**
 * AuthGuard — Ensures user has an active session before rendering children.
 * Unauthenticated visitors see a loading state while the session is resolved.
 * Role-level enforcement is handled inside each protected page component.
 */

import { useState, useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Guards rendering of `children` behind an active Supabase session.
 *
 * While the session is being resolved, displays a full-screen loading UI; if no authenticated
 * session exists, displays a full-screen sign-in required screen; otherwise renders `children`.
 *
 * @param children - Content to render when an authenticated session is present
 * @returns The loading UI while checking, a sign-in prompt when unauthenticated, or `children` when authenticated
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthenticated(!!session?.user);
      setChecking(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session?.user);
    });

    return () => data.subscription.unsubscribe();
  }, []);

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

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-sm text-center space-y-4">
          <p className="text-lg font-bold text-slate-900">Sign in required</p>
          <p className="text-sm text-slate-500">
            You must be signed in to access this page.
          </p>
          <a
            href="/"
            className="inline-block mt-2 px-5 py-2.5 bg-gradient-to-b from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200/50 hover:from-blue-400 hover:to-blue-500 transition-all duration-200"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
