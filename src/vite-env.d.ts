/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  /** Только dev/стейджинг: показать маршрут /seed-data */
  readonly VITE_ENABLE_SEED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
