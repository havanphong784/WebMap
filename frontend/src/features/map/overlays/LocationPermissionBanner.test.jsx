import {createElement} from "react";
import {createRoot} from "react-dom/client";
import {act} from "react";
import {describe, expect, it, vi} from "vitest";
import LocationPermissionBanner from "./LocationPermissionBanner.jsx";

describe("LocationPermissionBanner", () => {
  it("explains denial and retries only after the user acts", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    const onRetry = vi.fn();

    await act(() => root.render(createElement(LocationPermissionBanner, {
      permission: "denied",
      onRetry,
    })));

    expect(container.textContent).toContain("Bạn vẫn có thể dùng bản đồ");
    expect(onRetry).not.toHaveBeenCalled();
    container.querySelector("button").click();
    expect(onRetry).toHaveBeenCalledOnce();
    await act(() => root.unmount());
  });
});
