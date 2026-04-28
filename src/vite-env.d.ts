/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  /** Тот же anon key из Supabase, если не задан VITE_SUPABASE_PUBLISHABLE_KEY. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Только dev/стейджинг: показать маршрут /seed-data */
  readonly VITE_ENABLE_SEED?: string;
  /** Подкаталог для GitHub Pages, например /RevMarket/ (со слэшем в конце). Задаётся в CI. */
  readonly VITE_BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
