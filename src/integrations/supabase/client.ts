import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
/** Anon / publishable key — в .env часто задают как VITE_SUPABASE_ANON_KEY (как в дашборде Supabase). */
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

if ((!supabaseUrl || !supabaseAnonKey) && import.meta.env.PROD) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (или VITE_SUPABASE_ANON_KEY) for production builds.'
  )
}

if ((!supabaseUrl || !supabaseAnonKey) && import.meta.env.DEV) {
  console.warn(
    '[RevMarket] Нет URL или ключа Supabase (VITE_SUPABASE_PUBLISHABLE_KEY или VITE_SUPABASE_ANON_KEY + VITE_SUPABASE_URL). ' +
      'Файл .env — в папке RevMarket или на уровень выше; после правок перезапустите dev-сервер.'
  )
}

if (supabaseUrl && !supabaseAnonKey && import.meta.env.DEV) {
  console.error(
    '[RevMarket] Задан VITE_SUPABASE_URL, но ключ пустой — подставляется демо JWT и Supabase ответит Invalid API key. ' +
      'Заполните VITE_SUPABASE_PUBLISHABLE_KEY (anon из Dashboard → API).'
  )
}

/** В dev без URL — заглушки; если URL свой, а ключа нет — не подмешиваем демо-ключ (иначе «Invalid API key»). */
const demoAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const resolvedUrl = supabaseUrl || 'https://placeholder.supabase.co'
const resolvedKey = supabaseAnonKey || (!supabaseUrl ? demoAnonKey : '')

export const supabase = createClient<Database>(resolvedUrl, resolvedKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-client-info': 'revmarket-web',
    },
  },
  db: {
    schema: 'public',
  },
})

/**
 * Проверяет доступность Supabase (полезно для обнаружения спящей базы)
 */
export const checkSupabaseHealth = async (): Promise<{
  ok: boolean
  error?: string
}> => {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1)
    if (error) {
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Неизвестная ошибка' }
  }
}
