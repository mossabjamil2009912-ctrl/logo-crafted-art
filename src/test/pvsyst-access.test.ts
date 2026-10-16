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
