import { useSyncExternalStore } from "react";
import { createOrder, getStore, setPayment, subscribeStore } from "@/lib/orders";

/**
 * صلاحيات دراسة PVsyst: الدراسة الأولى مجانية، وما بعدها مدفوعة (5$ عبر محفظة جيب)
 * وتُفعَّل بتأكيد الإدارة. كل دراسة تُسلَّم بعد 3 دقائق كإشعار.
 */

export const STUDY_PRICE_USD = 5;
export const JEEB_NUMBER = "735248111";
export const STUDY_DELAY_MS = 3 * 60 * 1000;
export const PVSYST_PROJECT_TYPE = "دراسة PVsyst";

type Pending = { sig: string; readyAt: number; snapshot: unknown; opened: boolean };
type AccessState = {
  freeUsed: boolean;
  usedCredits: string[];
  released: string[];
  pending: Pending | null;
  geo: { tilt: number | null; azimuth: number };
};

const KEY = "arsh.pvsyst.access.v1";
const EMPTY: AccessState = { freeUsed: false, usedCredits: [], released: [], pending: null, geo: { tilt: null, azimuth: 0 } };
let state: AccessState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as AccessState) };
  } catch { /* تجاهل */ }
  // تحديث كل ثانية لعدّاد الانتظار ووصول الإشعار
  window.setInterval(() => listeners.forEach((l) => l()), 1000);
}

function save(next: AccessState) {
  state = next;
  try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* تجاهل */ }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  const off = subscribeStore(l);
  return () => { listeners.delete(l); off(); };
}

/** طلبات الدفع الخاصة بدراسات PVsyst لهذا العميل. */
function studyOrders() {
  return getStore().orders.filter((o) => o.projectType === PVSYST_PROJECT_TYPE);
}

export type AccessStatus =
  | { kind: "free" }
  | { kind: "credit"; orderId: string }
  | { kind: "waiting"; readyAt: number; sig: string }
  | { kind: "review"; ref: string }
  | { kind: "pay"; rejected: boolean };

let cache: { key: string; value: AccessStatus } | null = null;

export function getAccessStatus(): AccessStatus {
  load();
  const now = Date.now();
  const orders = studyOrders();
  const p = state.pending;
  let value: AccessStatus;
  if (p && p.readyAt > now) value = { kind: "waiting", readyAt: p.readyAt, sig: p.sig };
  else if (!state.freeUsed) value = { kind: "free" };
  else {
    const credit = orders.find((o) => (o.status === "payment_verified" || o.status === "confirmed") && !state.usedCredits.includes(o.id));
    const review = orders.find((o) => o.status === "admin_review");
    const rejected = orders.some((o) => o.status === "cancelled" && !state.usedCredits.includes(o.id));
    value = credit ? { kind: "credit", orderId: credit.id } : review ? { kind: "review", ref: review.transferRef } : { kind: "pay", rejected: rejected && !review };
  }
  const key = JSON.stringify(value);
  if (cache?.key !== key) cache = { key, value };
  return cache.value;
}

export function usePvsystAccess(): AccessStatus {
  return useSyncExternalStore(subscribe, getAccessStatus, () => ({ kind: "free" }) as AccessStatus);
}

/** حالة الإشعار: دراسة جاهزة لم تُفتح بعد. */
export function getReadyStudy(): Pending | null {
  load();
  const p = state.pending;
  return p && p.readyAt <= Date.now() ? p : null;
}
let readyCache: { key: string; value: Pending | null } | null = null;
function readySnapshot() {
  const r = getReadyStudy();
  const key = r ? `${r.sig}|${r.opened}` : "";
  if (readyCache?.key !== key) readyCache = { key, value: r };
  return readyCache.value;
}
export function useReadyStudy() {
  return useSyncExternalStore(subscribe, readySnapshot, () => null);
}

export function isReleased(sig: string) {
  load();
  return state.released.includes(sig) || (state.pending?.sig === sig && state.pending.readyAt <= Date.now());
}

/** يبدأ إعداد الدراسة (يستهلك المجانية أو رصيداً مدفوعاً) ويُسلّمها بعد 3 دقائق. */
export function startStudy(sig: string, snapshot: unknown) {
  load();
  const status = getAccessStatus();
  if (status.kind !== "free" && status.kind !== "credit") return false;
  const released = state.pending && state.pending.readyAt <= Date.now() ? [...state.released, state.pending.sig] : state.released;
  save({
    ...state,
    freeUsed: true,
    usedCredits: status.kind === "credit" ? [...state.usedCredits, status.orderId] : state.usedCredits,
    released: released.slice(-30),
    pending: { sig, readyAt: Date.now() + STUDY_DELAY_MS, snapshot, opened: false },
  });
  return true;
}

export function markStudyOpened() {
  load();
  if (state.pending) save({ ...state, pending: { ...state.pending, opened: true } });
}

/** يرسل رقم مرجع عملية الدفع للإدارة لتأكيده. */
export function submitStudyPayment(customer: string, city: string, ref: string) {
  const order = createOrder({
    quoteNumber: `PV-${Date.now().toString().slice(-6)}`,
    customer: customer || "عميل",
    projectType: PVSYST_PROJECT_TYPE,
    city,
    items: [{ name: "دراسة PVsyst لمنظومة واحدة", qty: "1", unit: "دراسة", price: STUDY_PRICE_USD, total: STUDY_PRICE_USD }],
    total: STUDY_PRICE_USD,
  });
  setPayment(order.id, "wallet", { transferRef: ref });
}

export function getStudyGeometry() {
  load();
  return state.geo;
}
export function setStudyGeometry(tilt: number | null, azimuth: number) {
  load();
  save({ ...state, geo: { tilt, azimuth } });
}
