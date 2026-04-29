import { describe, expect, it } from "vitest";
import configFactory from "./vite.config";

const resolveViteConfig = (basePath?: string) => {
  const previousBasePath = process.env.VITE_BASE_PATH;

  if (basePath === undefined) {
    delete process.env.VITE_BASE_PATH;
  } else {
    process.env.VITE_BASE_PATH = basePath;
  }

  try {
    return configFactory({
      command: "build",
      mode: "production",
      isSsrBuild: false,
      isPreview: false,
    });
  } finally {
    if (previousBasePath === undefined) {
      delete process.env.VITE_BASE_PATH;
    } else {
      process.env.VITE_BASE_PATH = previousBasePath;
    }
  }
};

describe("vite base path config", () => {
  it("uses root base when VITE_BASE_PATH is not configured", () => {
    expect(resolveViteConfig()).toMatchObject({ base: "/" });
  });

  it("adds a trailing slash to GitHub Pages project paths", () => {
    expect(resolveViteConfig("/RevMarket")).toMatchObject({
      base: "/RevMarket/",
    });
  });

  it("keeps project paths with a trailing slash stable", () => {
    expect(resolveViteConfig("/RevMarket/")).toMatchObject({
      base: "/RevMarket/",
    });
  });
});
