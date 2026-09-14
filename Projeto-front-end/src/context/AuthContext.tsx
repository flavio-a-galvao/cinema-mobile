import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { SessionData } from "../types";

type AuthContextValue = {
  session: SessionData | null;
  setSession: (nextSession: SessionData) => void;
  clearSession: () => void;
  isLoggedIn: boolean;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<SessionData | null>(() =>
    JSON.parse(localStorage.getItem("cineMaxSession") || "null")
  );

  useEffect(() => {
    function syncAuthState() {
      setSessionState(JSON.parse(localStorage.getItem("cineMaxSession") || "null"));
    }

    window.addEventListener("storage", syncAuthState);
    window.addEventListener("cineMaxAuthChanged", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("cineMaxAuthChanged", syncAuthState);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const isLoggedIn = Boolean(session?.email);
    const role = String(session?.tipo_usuario || "").toLowerCase();
    const isAdmin = role === "admin" || role === "adm";

    function saveSession(nextSession: SessionData) {
      localStorage.setItem("cineMaxSession", JSON.stringify(nextSession));
      setSessionState(nextSession);
      window.dispatchEvent(new Event("cineMaxAuthChanged"));
    }

    function clearSession() {
      localStorage.removeItem("cineMaxSession");
      localStorage.removeItem("cineMaxLastClienteId");
      setSessionState(null);
      window.dispatchEvent(new Event("cineMaxAuthChanged"));
    }

    return {
      session,
      setSession: saveSession,
      clearSession,
      isLoggedIn,
      isAdmin,
    };
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }
  return context;
}
