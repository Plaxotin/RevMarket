import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMock = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: supabaseMock,
}));

import { checkAuth, clearAuthData, logout } from "./auth";

class MemoryStorage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

const installStorage = () => {
  Object.defineProperty(globalThis, "localStorage", {
    value: new MemoryStorage(),
    configurable: true,
  });
  Object.defineProperty(globalThis, "sessionStorage", {
    value: new MemoryStorage(),
    configurable: true,
  });
};

describe("auth utilities", () => {
  beforeEach(() => {
    installStorage();
    supabaseMock.auth.getSession.mockReset();
    supabaseMock.auth.signOut.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  describe("checkAuth", () => {
    it("returns unauthenticated without calling Supabase when no session keys exist", async () => {
      localStorage.setItem("theme", "dark");

      await expect(checkAuth()).resolves.toEqual({
        user: null,
        isAuthenticated: false,
      });
      expect(supabaseMock.auth.getSession).not.toHaveBeenCalled();
    });

    it("returns authenticated user when Supabase session storage and user exist", async () => {
      const user = { id: "user-123" };
      localStorage.setItem("sb-project-auth-token", "token");
      supabaseMock.auth.getSession.mockResolvedValue({
        data: { session: { user } },
        error: null,
      });

      await expect(checkAuth()).resolves.toEqual({
        user,
        isAuthenticated: true,
      });
    });

    it("returns unauthenticated when Supabase reports a session error", async () => {
      localStorage.setItem("supabase.auth.token", "token");
      supabaseMock.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error("invalid refresh token"),
      });

      await expect(checkAuth()).resolves.toEqual({
        user: null,
        isAuthenticated: false,
      });
    });
  });

  describe("clearAuthData", () => {
    it("removes only Supabase auth keys from both browser storage areas", () => {
      localStorage.setItem("sb-project-auth-token", "token");
      localStorage.setItem("revmarket-supabase-cache", "cache");
      localStorage.setItem("preferred-city", "Москва");
      sessionStorage.setItem("sb-project-code-verifier", "verifier");
      sessionStorage.setItem("supabase.redirect", "/profile");
      sessionStorage.setItem("draft-request", "saved");

      clearAuthData();

      expect(localStorage.getItem("sb-project-auth-token")).toBeNull();
      expect(localStorage.getItem("revmarket-supabase-cache")).toBeNull();
      expect(localStorage.getItem("preferred-city")).toBe("Москва");
      expect(sessionStorage.getItem("sb-project-code-verifier")).toBeNull();
      expect(sessionStorage.getItem("supabase.redirect")).toBeNull();
      expect(sessionStorage.getItem("draft-request")).toBe("saved");
    });
  });

  describe("logout", () => {
    it("clears persisted auth data even when Supabase sign out fails", async () => {
      localStorage.setItem("sb-project-auth-token", "token");
      sessionStorage.setItem("supabase.redirect", "/profile");
      supabaseMock.auth.signOut.mockRejectedValue(new Error("network error"));

      await expect(logout()).resolves.toBe(false);

      expect(localStorage.getItem("sb-project-auth-token")).toBeNull();
      expect(sessionStorage.getItem("supabase.redirect")).toBeNull();
    });
  });
});
