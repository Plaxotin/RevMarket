import { describe, expect, it } from "vitest";
import { buildViteBasePath, getRouterBasename } from "./basePath";

describe("basePath utilities", () => {
  describe("buildViteBasePath", () => {
    it("returns root slash when base path is undefined", () => {
      expect(buildViteBasePath(undefined)).toBe("/");
    });

    it("returns root slash when base path is empty", () => {
      expect(buildViteBasePath("")).toBe("/");
    });

    it("adds trailing slash when missing", () => {
      expect(buildViteBasePath("/RevMarket")).toBe("/RevMarket/");
    });

    it("keeps single trailing slash when already present", () => {
      expect(buildViteBasePath("/RevMarket/")).toBe("/RevMarket/");
    });
  });

  describe("getRouterBasename", () => {
    it("returns undefined for root base URL", () => {
      expect(getRouterBasename("/")).toBeUndefined();
    });

    it("strips trailing slash for project base URL", () => {
      expect(getRouterBasename("/RevMarket/")).toBe("/RevMarket");
    });

    it("keeps non-root path without trailing slash", () => {
      expect(getRouterBasename("/nested/path")).toBe("/nested/path");
    });
  });
});
