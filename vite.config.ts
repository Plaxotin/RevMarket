import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/** .env из родителя (корень npm-воркспейса) и из папки приложения; внутренний файл перекрывает внешний. */
function mergeViteEnv(mode: string) {
  return {
    ...loadEnv(mode, path.resolve(__dirname, ".."), ""),
    ...loadEnv(mode, __dirname, ""),
  };
}

function envDefineBlock(env: Record<string, string>) {
  const define: Record<string, string> = {};
  for (const [key, val] of Object.entries(env)) {
    if (key.startsWith("VITE_")) {
      define[`import.meta.env.${key}`] = JSON.stringify(val);
    }
  }
  return define;
}

// GitHub Pages (project site): задайте VITE_BASE_PATH=/ИмяРепозитория/ в CI (со слэшем в конце).
// Локально и на Vercel оставьте без переменной — base будет "/".
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = mergeViteEnv(mode);
  return {
    define: envDefineBlock(env),
    base: env.VITE_BASE_PATH?.replace(/\/?$/, "/") || "/",
    root: ".",
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      minify: "terser",
    },
  };
});
