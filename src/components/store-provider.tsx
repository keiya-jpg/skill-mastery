"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { localStore, migrateGuest, remoteStore, type Store } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "./auth-provider";

const StoreContext = createContext<{ store: Store; ready: boolean }>({ store: localStore, ready: false });

/** Gives every page the right store: on-device for guests, the account when signed in. */
export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [migrated, setMigrated] = useState<string | null>(null);
  const store = useMemo(() => (user ? remoteStore(getSupabase()) : localStore), [user]);

  useEffect(() => {
    if (!user || migrated === user.id) return;
    migrateGuest(store, getSupabase())
      .catch((e) => console.warn("[store] couldn't move guest progress", e))
      .finally(() => setMigrated(user.id));
  }, [user, store, migrated]);

  const ready = !loading && (!user || migrated === user.id);
  return <StoreContext value={{ store, ready }}>{children}</StoreContext>;
}

export const useStore = () => useContext(StoreContext);
