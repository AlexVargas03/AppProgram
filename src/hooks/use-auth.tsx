import { useState, useEffect } from "react";

const AUTH_KEY = "sami:auth";

type AuthUser = { email: string };

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(AUTH_KEY) : null;
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        window.localStorage.removeItem(AUTH_KEY);
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    await new Promise((r) => setTimeout(r, 900));
    if (!email.includes("@") || password.length < 4) {
      setError("Correo o contraseña inválidos.");
      setLoading(false);
      return;
    }
    const u: AuthUser = { email };
    window.localStorage.setItem(AUTH_KEY, JSON.stringify(u));
    setUser(u);
    setLoading(false);
  };

  const logout = () => {
    window.localStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  return { user, loading, error, login, logout };
}
