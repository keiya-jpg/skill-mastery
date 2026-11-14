"use client";
import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { isConfigured } from "@/lib/env";
import { getSupabase } from "@/lib/supabase";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** True right after following a password-reset link. */
  recovering: boolean;
}

/** Set during an explicit "Log out" so guards send people to a clean /login. */
export const signOutIntent = { current: false };

const AuthContext = createContext<AuthState>({ user: null, session: null, loading: true, recovering: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, session: null, loading: isConfigured, recovering: false });

  useEffect(() => {
    if (!isConfigured) return;
    const supabase = getSupabase();
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setState((s) => ({ ...s, session: data.session, user: data.session?.user ?? null, loading: false }));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setState((s) => ({
        session,
        user: session?.user ?? null,
        loading: false,
        recovering: event === "PASSWORD_RECOVERY" ? true : event === "SIGNED_OUT" ? false : s.recovering,
      }));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext value={state}>{children}</AuthContext>;
}

export const useAuth = () => useContext(AuthContext);
