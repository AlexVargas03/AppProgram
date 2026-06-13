const KEY_BALANCE = "sami:points";
const KEY_LOG = "sami:points-log";
const KEY_REDEEMED = "sami:redeemed";

export type PointTransaction = {
  ts: number;
  delta: number;
  reason: string;
};

export type RedeemedItem = {
  ts: number;
  productId: string;
  productName: string;
  points: number;
  code: string;
};

function genCode(id: string): string {
  return `SAMI-${id.toUpperCase().slice(0, 4)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function getBalance(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(KEY_BALANCE) ?? "0");
}

export function addPoints(delta: number, reason: string): number {
  const prev = getBalance();
  const next = prev + delta;
  localStorage.setItem(KEY_BALANCE, String(next));
  const log: PointTransaction[] = JSON.parse(localStorage.getItem(KEY_LOG) ?? "[]");
  log.push({ ts: Date.now(), delta, reason });
  localStorage.setItem(KEY_LOG, JSON.stringify(log));
  return next;
}

export function spendPoints(
  amount: number,
  productId: string,
  productName: string,
): RedeemedItem | null {
  const prev = getBalance();
  if (prev < amount) return null;
  localStorage.setItem(KEY_BALANCE, String(prev - amount));
  const log: PointTransaction[] = JSON.parse(localStorage.getItem(KEY_LOG) ?? "[]");
  log.push({ ts: Date.now(), delta: -amount, reason: `Canje: ${productName}` });
  localStorage.setItem(KEY_LOG, JSON.stringify(log));
  const item: RedeemedItem = {
    ts: Date.now(),
    productId,
    productName,
    points: amount,
    code: genCode(productId),
  };
  const redeemed: RedeemedItem[] = JSON.parse(localStorage.getItem(KEY_REDEEMED) ?? "[]");
  redeemed.unshift(item);
  localStorage.setItem(KEY_REDEEMED, JSON.stringify(redeemed));
  return item;
}

export function getRedeemed(): RedeemedItem[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(KEY_REDEEMED) ?? "[]") as RedeemedItem[];
}
