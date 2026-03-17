import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in your .env file.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
