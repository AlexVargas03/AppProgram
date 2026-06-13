import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

// Only initialize when credentials are present; use-auth.tsx guards every call.
export const auth: Auth = import.meta.env.VITE_FIREBASE_API_KEY
  ? getAuth(getFirebaseApp())
  : (null as unknown as Auth);

// Firestore se activa de forma independiente del login: solo necesita el
// projectId, así VITE_DEMO_MODE puede saltar el login y aun así capturar datos.
const FIRESTORE_CONFIGURED = !!import.meta.env.VITE_FIREBASE_PROJECT_ID;

export const db: Firestore | null = FIRESTORE_CONFIGURED
  ? getFirestore(getFirebaseApp())
  : null;
