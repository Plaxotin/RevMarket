import { describe, expect, it } from "vitest";
import { getRouterBasename } from "./routerBasePath";

describe("getRouterBasename", () => {
  it("leaves root deployments without a basename", () => {
    expect(getRouterBasename("/")).toBeUndefined();
  });

  it("removes the trailing slash from GitHub Pages project paths", () => {
    expect(getRouterBasename("/RevMarket/")).toBe("/RevMarket");
  });

  it("preserves already-normalized and nested base paths", () => {
    expect(getRouterBasename("/RevMarket")).toBe("/RevMarket");
    expect(getRouterBasename("/org/RevMarket/")).toBe("/org/RevMarket");
  });
});
