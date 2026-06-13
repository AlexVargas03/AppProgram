// Captura de datos en Firestore para Sami / Vital Watch.
// Mismo patrón offline-first que azureApi.ts, pero hacia colecciones planas
// de Firestore. No depende del estado de autenticación.

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUserId, type WatchMetrics } from "@/services/azureApi";

const QUEUE_KEY = "sami:firestore-pending-queue";

export type SamiCollection =
  | "profiles"
  | "quiz_answers"
  | "fatiga_samples"
  | "metrics_samples"
  | "likert_responses"
  | "preferences";

type QueueItem = {
  id: string;
  collectionName: SamiCollection;
  data: Record<string, unknown>;
};

/* ------------------------------ Queue helpers ---------------------------- */

function readQueue(): QueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeQueue(items: QueueItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

function enqueue(item: Omit<QueueItem, "id">) {
  const q = readQueue();
  q.push({ ...item, id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}` });
  writeQueue(q);
}

export function getPendingFirestoreCount(): number {
  return readQueue().length;
}

function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

/* -------------------------------- Core API -------------------------------- */

export async function logEvent(
  collectionName: SamiCollection,
  data: Record<string, unknown>,
): Promise<{ sent: boolean; queued: boolean }> {
  const payload = { uid: getUserId(), ...data };

  if (!db || !isOnline()) {
    enqueue({ collectionName, data: payload });
    return { sent: false, queued: true };
  }
  try {
    await addDoc(collection(db, collectionName), {
      ...payload,
      createdAt: serverTimestamp(),
    });
    return { sent: true, queued: false };
  } catch {
    enqueue({ collectionName, data: payload });
    return { sent: false, queued: true };
  }
}

/* ------------------------------ Sync queue -------------------------------- */

let syncing = false;

export async function flushFirestoreQueue(): Promise<{ flushed: number; remaining: number }> {
  if (syncing || !db || !isOnline()) {
    return { flushed: 0, remaining: getPendingFirestoreCount() };
  }
  syncing = true;
  let flushed = 0;
  try {
    const q = readQueue();
    const remaining: QueueItem[] = [];
    for (const item of q) {
      try {
        await addDoc(collection(db, item.collectionName), {
          ...item.data,
          createdAt: serverTimestamp(),
        });
        flushed++;
      } catch {
        remaining.push(item);
      }
    }
    writeQueue(remaining);
    return { flushed, remaining: remaining.length };
  } finally {
    syncing = false;
  }
}

/** Registra listeners que reintentan el envío a Firestore al recuperar conexión. */
export function registerFirestoreSync(): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => void flushFirestoreQueue();
  window.addEventListener("online", handler);
  const visHandler = () => {
    if (document.visibilityState === "visible") void flushFirestoreQueue();
  };
  document.addEventListener("visibilitychange", visHandler);
  void flushFirestoreQueue();
  return () => {
    window.removeEventListener("online", handler);
    document.removeEventListener("visibilitychange", visHandler);
  };
}

/* ----------------------------- Convenience API ----------------------------- */

export const logProfile = (profile: Record<string, string | boolean>) =>
  logEvent("profiles", profile);

export const logQuizAnswers = (
  answers: { questionId: number; dimension: string; answer: string }[],
) => logEvent("quiz_answers", { answers });

export const logFatigaSample = (fatigaLevel: number, metrics: WatchMetrics) =>
  logEvent("fatiga_samples", { fatigaLevel, metrics });

export const logMetricsSample = (metrics: WatchMetrics, fatigaLevel: number | null = null) =>
  logEvent("metrics_samples", { metrics, fatigaLevel });

export const logLikertResponse = (
  checkpointId: string,
  question: string,
  value: number,
  source: "mobile" | "watch",
) => logEvent("likert_responses", { checkpointId, question, value, source });

export const logLikertPref = (likertPref: "dentro" | "fuera") =>
  logEvent("preferences", { likertPref });
