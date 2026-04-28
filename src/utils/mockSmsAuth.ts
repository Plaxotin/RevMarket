import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * В `.env`: VITE_MOCK_SMS_AUTH=true
 * — кнопка «Отправить SMS» не вызывает реальную отправку;
 * — в поле кода подходит любой непустой текст;
 * — подтверждение: signInAnonymously (включите Anonymous в Supabase; без лишнего signOut — меньше сбоев сети).
 */
export function isMockSmsAuth(): boolean {
  const v = import.meta.env.VITE_MOCK_SMS_AUTH;
  return v === "true" || v === "1";
}

export async function signInForSmsMock(supabase: SupabaseClient) {
  const existing = await supabase.auth.getSession();
  const u = existing.data.session?.user;
  if (u?.is_anonymous) {
    return { data: { user: u, session: existing.data.session }, error: null };
  }
  return supabase.auth.signInAnonymously();
}
