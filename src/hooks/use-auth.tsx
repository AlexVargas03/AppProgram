import { useState, useEffect } from "react";
import type { User } from "firebase/auth";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

function translateFirebaseError(code: string): string {
  switch (code) {
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "Correo o contraseña incorrectos.";
    case "auth/wrong-password":
      return "Contraseña incorrecta.";
    case "auth/email-already-in-use":
      return "Este correo ya tiene una cuenta registrada.";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    case "auth/invalid-email":
      return "El formato del correo no es válido.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Intenta más tarde.";
    case "auth/network-request-failed":
      return "Sin conexión a internet.";
    default:
      return "Error de autenticación. Inténtalo de nuevo.";
  }
}

const FIREBASE_CONFIGURED = !!import.meta.env.VITE_FIREBASE_API_KEY;

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(FIREBASE_CONFIGURED);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setError(translateFirebaseError(code));
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setError(translateFirebaseError(code));
      setLoading(false);
    }
  };

  const logout = () => {
    if (!FIREBASE_CONFIGURED) return;
    void signOut(auth);
  };

  return { user, loading, error, login, register, logout };
}
