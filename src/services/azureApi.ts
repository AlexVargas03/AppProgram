// Azure Functions API layer for Vital Watch
// Centralizes outbound calls to the Azure backend and provides an
// offline-first queue stored in LocalStorage.

const API_BASE = (import.meta.env.VITE_AZURE_API_URL ?? "").replace(/\/$/, "");
const QUEUE_KEY = "vitalwatch:pending-queue";
const USER_KEY = "vitalwatch:userId";

export type WatchMetrics = {
  heartRate?: number;
  steps?: number;
  hrv?: number;
  sleepHours?: number;
  usagePercent?: number;
};

export type FatigaPayload = {
  userId: string;
  timestamp: string;
  fatigaLevel: number;
  metrics: WatchMetrics;
};

export type MetricsPayload = {
  userId: string;
  timestamp: string;
  fatigaLevel: number | null;
  metrics: WatchMetrics;
};

type QueueItem = {
  id: string;
  endpoint: "fatiga" | "metrics";
  payload: FatigaPayload | MetricsPayload;
  createdAt: string;
};

/* ----------------------------- User identity ----------------------------- */

export function getUserId(): string {
  if (typeof window === "undefined") return "anonymous";
  let id = window.localStorage.getItem(USER_KEY);
  if (!id) {
    id = `user_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(USER_KEY, id);
  }
  return id;
}

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

function enqueue(item: Omit<QueueItem, "id" | "createdAt">) {
  const q = readQueue();
  q.push({
    ...item,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  });
  writeQueue(q);
}

export function getPendingCount(): number {
  return readQueue().length;
}

/* --------------------------------- HTTP ---------------------------------- */

async function postJson(path: string, payload: unknown): Promise<Response> {
  if (!API_BASE) throw new Error("VITE_AZURE_API_URL not configured");
  return fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

async function sendOrQueue(
  endpoint: QueueItem["endpoint"],
  path: string,
  payload: FatigaPayload | MetricsPayload,
): Promise<{ sent: boolean; queued: boolean }> {
  if (!isOnline() || !API_BASE) {
    enqueue({ endpoint, payload });
    return { sent: false, queued: true };
  }
  try {
    const res = await postJson(path, payload);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { sent: true, queued: false };
  } catch {
    enqueue({ endpoint, payload });
    return { sent: false, queued: true };
  }
}

/* ------------------------------ Public API ------------------------------- */

export async function sendFatigaData(
  fatigaLevel: number,
  metrics: WatchMetrics = {},
) {
  const payload: FatigaPayload = {
    userId: getUserId(),
    timestamp: new Date().toISOString(),
    fatigaLevel,
    metrics,
  };
  // Persist last-known sample locally regardless of network state
  if (typeof window !== "undefined") {
    window.localStorage.setItem("vitalwatch:lastFatiga", JSON.stringify(payload));
  }
  return sendOrQueue("fatiga", "/api/fatiga", payload);
}

export async function sendMetricsData(
  metrics: WatchMetrics,
  fatigaLevel: number | null = null,
) {
  const payload: MetricsPayload = {
    userId: getUserId(),
    timestamp: new Date().toISOString(),
    fatigaLevel,
    metrics,
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem("vitalwatch:lastMetrics", JSON.stringify(payload));
  }
  return sendOrQueue("metrics", "/api/metrics", payload);
}

/* ------------------------------ Sync queue ------------------------------- */

let syncing = false;

export async function flushQueue(): Promise<{ flushed: number; remaining: number }> {
  if (syncing || !isOnline() || !API_BASE) {
    return { flushed: 0, remaining: getPendingCount() };
  }
  syncing = true;
  let flushed = 0;
  try {
    const q = readQueue();
    const remaining: QueueItem[] = [];
    for (const item of q) {
      try {
        const path = item.endpoint === "fatiga" ? "/api/fatiga" : "/api/metrics";
        const res = await postJson(path, item.payload);
        if (res.ok) flushed++;
        else remaining.push(item);
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

/** Register listeners that retry pending sends when the connection returns. */
export function registerConnectivitySync(): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    void flushQueue();
  };
  window.addEventListener("online", handler);
  // Also try on visibility regain (mobile browsers throttle background tabs)
  const visHandler = () => {
    if (document.visibilityState === "visible") void flushQueue();
  };
  document.addEventListener("visibilitychange", visHandler);
  // Attempt one flush on register
  void flushQueue();
  return () => {
    window.removeEventListener("online", handler);
    document.removeEventListener("visibilitychange", visHandler);
  };
}
