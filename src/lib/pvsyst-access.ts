import { useSyncExternalStore } from "react";
import { createOrder, getStore, setPayment, subscribeStore } from "@/lib/orders";

/**
 * صلاحيات الدراسات (PVsyst والجدوى الاقتصادية): الدراسة الأولى مجانية، وما بعدها مدفوعة
 * (5$ عبر محفظة جيب) وتُفعَّل بتأكيد الإدارة. كل دراسة تُسلَّم بعد 3 دقائق كإشعار.
 * لكل نوع دراسة رصيد مستقل.
 */

export const STUDY_PRICE_USD = 5;
export const JEEB_NUMBER = "735248111";
export const STUDY_DELAY_MS = 3 * 60 * 1000;
export const PVSYST_PROJECT_TYPE = "دراسة PVsyst";
export const ECO_PROJECT_TYPE = "دراسة الجدوى الاقتصادية";

export type Pending = { sig: string; readyAt: number; snapshot: unknown; opened: boolean };
type AccessState = {
  freeUsed: boolean;
  usedCredits: string[];
  released: string[];
  pending: Pending | null;
  geo: { tilt: number | null; azimuth: number };
};

export type AccessStatus =
  | { kind: "free" }
  | { kind: "credit"; orderId: string }
  | { kind: "waiting"; readyAt: number; sig: string }
  | { kind: "review"; ref: string }
  | { kind: "pay"; rejected: boolean };

const EMPTY: AccessState = { freeUsed: false, usedCredits: [], released: [], pending: null, geo: { tilt: null, azimuth: 0 } };

function createAccess(key: string, projectType: string, itemName: string) {
  let state: AccessState = EMPTY;
  let loaded = false;
  const listeners = new Set<() => void>();

  function load() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as AccessState) };
    } catch { /* تجاهل */ }
    window.setInterval(() => listeners.forEach((l) => l()), 1000);
  }
  function save(next: AccessState) {
    state = next;
    try { window.localStorage.setItem(key, JSON.stringify(state)); } catch { /* تجاهل */ }
    listeners.forEach((l) => l());
  }
  function subscribe(l: () => void) {
    load();
    listeners.add(l);
    const off = subscribeStore(l);
    return () => { listeners.delete(l); off(); };
  }
  const orders = () => getStore().orders.filter((o) => o.projectType === projectType);

  let cache: { key: string; value: AccessStatus } | null = null;
  function getAccessStatus(): AccessStatus {
    load();
    const now = Date.now();
    const list = orders();
    const p = state.pending;
    let value: AccessStatus;
    if (p && p.readyAt > now) value = { kind: "waiting", readyAt: p.readyAt, sig: p.sig };
    else if (!state.freeUsed) value = { kind: "free" };
    else {
      const credit = list.find((o) => (o.status === "payment_verified" || o.status === "confirmed") && !state.usedCredits.includes(o.id));
      const review = list.find((o) => o.status === "admin_review");
      const rejected = list.some((o) => o.status === "cancelled" && !state.usedCredits.includes(o.id));
      value = credit ? { kind: "credit", orderId: credit.id } : review ? { kind: "review", ref: review.transferRef } : { kind: "pay", rejected: rejected && !review };
    }
    const k = JSON.stringify(value);
    if (cache?.key !== k) cache = { key: k, value };
    return cache.value;
  }
  const useAccess = () => useSyncExternalStore(subscribe, getAccessStatus, () => ({ kind: "free" }) as AccessStatus);

  function getReadyStudy(): Pending | null {
    load();
    const p = state.pending;
    return p && p.readyAt <= Date.now() ? p : null;
  }
  let readyCache: { key: string; value: Pending | null } | null = null;
  function readySnapshot() {
    const r = getReadyStudy();
    const k = r ? `${r.sig}|${r.opened}` : "";
    if (readyCache?.key !== k) readyCache = { key: k, value: r };
    return readyCache.value;
  }
  const useReady = () => useSyncExternalStore(subscribe, readySnapshot, () => null);

  function isReleased(sig: string) {
    load();
    return state.released.includes(sig) || (state.pending?.sig === sig && state.pending.readyAt <= Date.now());
  }
  function startStudy(sig: string, snapshot: unknown) {
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
  function markOpened() {
    load();
    if (state.pending) save({ ...state, pending: { ...state.pending, opened: true } });
  }
  function submitPayment(customer: string, city: string, ref: string) {
    const order = createOrder({
      quoteNumber: `${projectType === ECO_PROJECT_TYPE ? "EC" : "PV"}-${Date.now().toString().slice(-6)}`,
      customer: customer || "عميل",
      projectType,
      city,
      items: [{ name: itemName, qty: "1", unit: "دراسة", price: STUDY_PRICE_USD, total: STUDY_PRICE_USD }],
      total: STUDY_PRICE_USD,
    });
    setPayment(order.id, "wallet", { transferRef: ref });
  }
  function getGeo() { load(); return state.geo; }
  function setGeo(tilt: number | null, azimuth: number) { load(); save({ ...state, geo: { tilt, azimuth } }); }

  return { getAccessStatus, useAccess, getReadyStudy, useReady, isReleased, startStudy, markOpened, submitPayment, getGeo, setGeo };
}

export type StudyKind = "pvsyst" | "eco";
const pv = createAccess("arsh.pvsyst.access.v1", PVSYST_PROJECT_TYPE, "دراسة PVsyst لمنظومة واحدة");
export const ecoAccess = createAccess("arsh.eco.access.v1", ECO_PROJECT_TYPE, "دراسة جدوى اقتصادية واحدة");
export const pvsystAccess = pv;
export const studyAccess = (kind: StudyKind) => (kind === "eco" ? ecoAccess : pv);

export const getAccessStatus = pv.getAccessStatus;
export const usePvsystAccess = pv.useAccess;
export const getReadyStudy = pv.getReadyStudy;
export const useReadyStudy = pv.useReady;
export const isReleased = pv.isReleased;
export const startStudy = pv.startStudy;
export const markStudyOpened = pv.markOpened;
export const submitStudyPayment = pv.submitPayment;
export const getStudyGeometry = pv.getGeo;
export const setStudyGeometry = pv.setGeo;
