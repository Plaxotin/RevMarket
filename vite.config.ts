import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { normalizeViteBasePath } from "./src/utils/basePath";

// GitHub Pages (project site): задайте VITE_BASE_PATH=/ИмяРепозитория/ в CI (с слэшем в конце).
// Локально и на Vercel оставьте без переменной — base будет "/".
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: normalizeViteBasePath(process.env.VITE_BASE_PATH),
  root: '.',
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
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
  },
}));
