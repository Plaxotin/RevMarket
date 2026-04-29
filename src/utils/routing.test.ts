import { describe, expect, it } from "vitest";
import { getRouterBasename } from "./routing";

describe("getRouterBasename", () => {
  it("leaves root deployments without a basename", () => {
    expect(getRouterBasename("/")).toBeUndefined();
  });

  it("removes the trailing slash from project-site base paths", () => {
    expect(getRouterBasename("/RevMarket/")).toBe("/RevMarket");
  });

  it("keeps already-normalized project-site base paths stable", () => {
    expect(getRouterBasename("/RevMarket")).toBe("/RevMarket");
  });
});
