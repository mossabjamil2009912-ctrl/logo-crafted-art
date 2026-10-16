import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/orders", () => ({
  createOrder: vi.fn(),
  setPayment: vi.fn(),
  getStore: () => ({ orders: [], notifs: [] }),
  subscribeStore: () => () => {},
}));

import { getAccessStatus, isReleased, startStudy, STUDY_PRICE_USD, JEEB_NUMBER } from "@/lib/pvsyst-access";

describe("PVsyst study access", () => {
  it("first study is free, ready after 3 minutes, then payment is required", () => {
    vi.useFakeTimers();
    expect(STUDY_PRICE_USD).toBe(5);
    expect(JEEB_NUMBER).toBe("735248111");
    expect(getAccessStatus().kind).toBe("free");
    expect(startStudy("S1", {})).toBe(true);
    expect(getAccessStatus().kind).toBe("waiting");
    expect(isReleased("S1")).toBe(false);
    vi.advanceTimersByTime(3 * 60 * 1000);
    expect(isReleased("S1")).toBe(true);
    expect(getAccessStatus().kind).toBe("pay");
    expect(startStudy("S2", {})).toBe(false);
    vi.useRealTimers();
  });
});

describe("Economic study access", () => {
  it("has its own free study, then requires payment", async () => {
    const { ecoAccess } = await import("@/lib/pvsyst-access");
    vi.useFakeTimers();
    expect(ecoAccess.getAccessStatus().kind).toBe("free");
    expect(ecoAccess.startStudy("E1", {})).toBe(true);
    expect(ecoAccess.getAccessStatus().kind).toBe("waiting");
    vi.advanceTimersByTime(3 * 60 * 1000);
    expect(ecoAccess.getAccessStatus().kind).toBe("pay");
    vi.useRealTimers();
  });
});
