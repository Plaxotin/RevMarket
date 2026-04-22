export const buildViteBasePath = (basePath?: string): string => {
  return basePath?.replace(/\/?$/, "/") || "/";
};

export const getRouterBasename = (baseUrl: string): string | undefined => {
  return baseUrl === "/" ? undefined : baseUrl.replace(/\/$/, "");
};
