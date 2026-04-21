export function normalizeViteBasePath(basePath?: string): string {
  if (!basePath) {
    return "/";
  }

  return basePath.replace(/\/?$/, "/");
}

export function getRouterBasename(baseUrl: string): string | undefined {
  if (baseUrl === "/") {
    return undefined;
  }

  return baseUrl.replace(/\/$/, "");
}
