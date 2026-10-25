import {afterEach, describe, expect, it, vi} from "vitest";
import {closeTopOverlay, registerBackHandler, resetBackHandlersForTests} from "./backStack.js";

describe("back stack", () => {
  afterEach(() => resetBackHandlersForTests());

  it("closes the highest-priority handler that consumes Back", () => {
    const low = vi.fn(() => true);
    const high = vi.fn(() => true);
    registerBackHandler("sidebar", low, 10);
    registerBackHandler("modal", high, 30);

    expect(closeTopOverlay()).toBe(true);
    expect(high).toHaveBeenCalledOnce();
    expect(low).not.toHaveBeenCalled();
  });

  it("unregisters handlers and skips handlers that decline Back", () => {
    const low = vi.fn(() => true);
    const high = vi.fn(() => false);
    registerBackHandler("sidebar", low, 10);
    const unregister = registerBackHandler("modal", high, 30);

    expect(closeTopOverlay()).toBe(true);
    expect(high).toHaveBeenCalledOnce();
    expect(low).toHaveBeenCalledOnce();

    unregister();
    high.mockClear();
    low.mockClear();
    expect(closeTopOverlay()).toBe(true);
    expect(high).not.toHaveBeenCalled();
    expect(low).toHaveBeenCalledOnce();
  });

  it("evaluates handlers with same priority in LIFO registration order", () => {
    const first = vi.fn(() => false);
    const second = vi.fn(() => true);
    registerBackHandler("first", first, 10);
    registerBackHandler("second", second, 10);

    expect(closeTopOverlay()).toBe(true);
    expect(second).toHaveBeenCalledOnce();
    expect(first).not.toHaveBeenCalled();
  });
});
