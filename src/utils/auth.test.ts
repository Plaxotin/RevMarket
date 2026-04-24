import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetSession, mockSignOut } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      signOut: mockSignOut,
    },
  },
}));

import { checkAuth, clearAuthData, logout } from "./auth";

type MockStorage = {
  length: number;
  key: (index: number) => string | null;
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const createMockStorage = (initial: Record<string, string> = {}): MockStorage => {
  const map = new Map(Object.entries(initial));

  return {
    get length() {
      return map.size;
    },
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => {
      map.clear();
    },
  };
};

describe("auth utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    Object.defineProperty(globalThis, "localStorage", {
      value: createMockStorage(),
      configurable: true,
      writable: true,
    });

    Object.defineProperty(globalThis, "sessionStorage", {
      value: createMockStorage(),
      configurable: true,
      writable: true,
    });
  });

  describe("checkAuth", () => {
    it("returns unauthenticated when Supabase markers are absent in localStorage", async () => {
      localStorage.setItem("theme", "dark");

      await expect(checkAuth()).resolves.toEqual({
        user: null,
        isAuthenticated: false,
      });
      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it("returns user when session exists and Supabase markers are present", async () => {
      localStorage.setItem("sb-project-auth-token", "token");
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: "user-1" } } },
        error: null,
      });

      await expect(checkAuth()).resolves.toEqual({
        user: { id: "user-1" },
        isAuthenticated: true,
      });
      expect(mockGetSession).toHaveBeenCalledTimes(1);
    });

    it("returns unauthenticated when getSession returns error", async () => {
      localStorage.setItem("supabase.auth.token", "token");
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: { message: "session error" },
      });

      await expect(checkAuth()).resolves.toEqual({
        user: null,
        isAuthenticated: false,
      });
    });
  });

  describe("clearAuthData", () => {
    it("removes only supabase-related keys from both storage scopes", () => {
      localStorage.setItem("sb-a", "1");
      localStorage.setItem("supabase-user", "2");
      localStorage.setItem("language", "ru");
      sessionStorage.setItem("sb-b", "3");
      sessionStorage.setItem("session-theme", "dark");

      clearAuthData();

      expect(localStorage.getItem("sb-a")).toBeNull();
      expect(localStorage.getItem("supabase-user")).toBeNull();
      expect(localStorage.getItem("language")).toBe("ru");
      expect(sessionStorage.getItem("sb-b")).toBeNull();
      expect(sessionStorage.getItem("session-theme")).toBe("dark");
    });
  });

  describe("logout", () => {
    it("returns true and clears auth data even when signOut returns an error object", async () => {
      vi.useFakeTimers();
      localStorage.setItem("sb-a", "1");
      sessionStorage.setItem("supabase-session", "2");
      mockSignOut.mockResolvedValue({ error: { message: "network" } });

      const logoutPromise = logout();
      await vi.advanceTimersByTimeAsync(100);

      await expect(logoutPromise).resolves.toBe(true);
      expect(localStorage.getItem("sb-a")).toBeNull();
      expect(sessionStorage.getItem("supabase-session")).toBeNull();
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it("returns false and still clears auth data when signOut throws", async () => {
      localStorage.setItem("sb-a", "1");
      sessionStorage.setItem("supabase-session", "2");
      mockSignOut.mockRejectedValue(new Error("boom"));

      await expect(logout()).resolves.toBe(false);
      expect(localStorage.getItem("sb-a")).toBeNull();
      expect(sessionStorage.getItem("supabase-session")).toBeNull();
    });
  });
});
