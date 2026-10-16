import {describe, expect, it, vi} from "vitest";
import {createGoogleAuthAdapter} from "./auth.js";

vi.mock("../config/firebase.js", () => ({auth: {}, googleProvider: {}}));

describe("Google authentication adapter", () => {
  it("uses Firebase popup on web", async () => {
    const credential = {user: {uid: "web-user"}};
    const signInWithPopup = vi.fn().mockResolvedValue(credential);
    const adapter = createGoogleAuthAdapter({nativeAndroid: false, signInWithPopup});

    await expect(adapter.signInWithGoogle()).resolves.toBe(credential);
  });

  it("exchanges the native Google ID token for the canonical Firebase Web session", async () => {
    const webCredential = {user: {uid: "native-user"}};
    const nativeAuth = {
      signInWithGoogle: vi.fn().mockResolvedValue({
        user: {uid: "native-layer-user"},
        credential: {idToken: "google-id-token", accessToken: "access-token"},
        additionalUserInfo: null,
      }),
    };
    const googleCredential = vi.fn().mockReturnValue({providerId: "google.com"});
    const signInWithCredential = vi.fn().mockResolvedValue(webCredential);
    const adapter = createGoogleAuthAdapter({
      nativeAndroid: true,
      nativeAuth,
      googleCredential,
      signInWithCredential,
    });

    await expect(adapter.signInWithGoogle()).resolves.toBe(webCredential);
    expect(googleCredential).toHaveBeenCalledWith("google-id-token", "access-token");
    expect(signInWithCredential).toHaveBeenCalledWith(expect.anything(), {providerId: "google.com"});
  });

  it("normalizes native cancellation without touching the web session", async () => {
    const signInWithCredential = vi.fn();
    const adapter = createGoogleAuthAdapter({
      nativeAndroid: true,
      nativeAuth: {signInWithGoogle: vi.fn().mockRejectedValue({code: "12501", message: "cancelled"})},
      signInWithCredential,
    });

    await expect(adapter.signInWithGoogle()).rejects.toMatchObject({code: "AUTH_CANCELLED"});
    expect(signInWithCredential).not.toHaveBeenCalled();
  });

  it("rejects a native response without an ID token", async () => {
    const signInWithCredential = vi.fn();
    const adapter = createGoogleAuthAdapter({
      nativeAndroid: true,
      nativeAuth: {signInWithGoogle: vi.fn().mockResolvedValue({credential: {accessToken: "only-access"}})},
      signInWithCredential,
    });

    await expect(adapter.signInWithGoogle()).rejects.toMatchObject({code: "AUTH_INVALID_CREDENTIAL"});
    expect(signInWithCredential).not.toHaveBeenCalled();
  });
});
