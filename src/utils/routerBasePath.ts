export const getRouterBasename = (baseUrl: string): string | undefined => {
  return baseUrl === "/" ? undefined : baseUrl.replace(/\/$/, "");
};
