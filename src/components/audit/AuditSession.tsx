import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type Session = {
  user: User | null;
  pending: boolean;
  recovery: boolean;
  endRecovery: () => void;
  signOut: () => Promise<void>;
};
const SessionContext = createContext<Session>({
  user: null,
  pending: true,
  recovery: false,
  endRecovery: () => {},
  signOut: async () => {},
});

export function AuditSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pending, setPending] = useState(true);
  const [recovery, setRecovery] = useState(false);
  const client = useQueryClient();
  const router = useRouter();
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) {
        setUser(data.user);
        setPending(false);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (!["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED", "PASSWORD_RECOVERY"].includes(event)) return;
      setUser(session?.user ?? null);
      setPending(false);
      void router.invalidate();
      if (event !== "SIGNED_OUT") void client.invalidateQueries();
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client, router]);
  async function signOut() {
    await client.cancelQueries();
    client.clear();
    setRecovery(false);
    await supabase.auth.signOut();
  }
  return (
    <SessionContext.Provider
      value={{ user, pending, recovery, endRecovery: () => setRecovery(false), signOut }}
    >
      {children}
    </SessionContext.Provider>
  );
}
export const useAuditSession = () => useContext(SessionContext);
