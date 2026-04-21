import { describe, expect, it } from "vitest";
import { getRouterBasename, normalizeViteBasePath } from "./basePath";

describe("basePath utilities", () => {
  describe("normalizeViteBasePath", () => {
    it("defaults to root when env value is missing", () => {
      expect(normalizeViteBasePath(undefined)).toBe("/");
    });

    it("ensures trailing slash for repository base paths", () => {
      expect(normalizeViteBasePath("/RevMarket")).toBe("/RevMarket/");
      expect(normalizeViteBasePath("/RevMarket/")).toBe("/RevMarket/");
    });

    it("normalizes empty string to root", () => {
      expect(normalizeViteBasePath("")).toBe("/");
    });
  });

  describe("getRouterBasename", () => {
    it("returns undefined for root base URL", () => {
      expect(getRouterBasename("/")).toBeUndefined();
    });

    it("removes trailing slash for non-root base URL", () => {
      expect(getRouterBasename("/RevMarket/")).toBe("/RevMarket");
    });

    it("keeps non-root base URL without trailing slash unchanged", () => {
      expect(getRouterBasename("/RevMarket")).toBe("/RevMarket");
    });
  });
});
