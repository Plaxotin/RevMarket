import { afterEach, describe, expect, it } from "vitest";
import viteConfig from "./vite.config";

const resolveConfig = () => {
  if (typeof viteConfig === "function") {
    return viteConfig({ command: "build", mode: "production", isSsrBuild: false, isPreview: false });
  }

  return viteConfig;
};

describe("vite base path configuration", () => {
  const originalBasePath = process.env.VITE_BASE_PATH;

  afterEach(() => {
    if (originalBasePath === undefined) {
      delete process.env.VITE_BASE_PATH;
    } else {
      process.env.VITE_BASE_PATH = originalBasePath;
    }
  });

  it("uses root base path when no GitHub Pages base path is configured", () => {
    delete process.env.VITE_BASE_PATH;

    expect(resolveConfig().base).toBe("/");
  });

  it("normalizes a GitHub Pages base path with a trailing slash", () => {
    process.env.VITE_BASE_PATH = "/RevMarket/";

    expect(resolveConfig().base).toBe("/RevMarket/");
  });

  it("adds a trailing slash when GitHub Pages base path omits it", () => {
    process.env.VITE_BASE_PATH = "/RevMarket";

    expect(resolveConfig().base).toBe("/RevMarket/");
  });
});
