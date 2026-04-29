import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://rev-market.vercel.app";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "RevMarket <onboarding@resend.dev>";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return json({ error: "Invalid session" }, 401);
    }

    const { requestId } = (await req.json()) as { requestId?: string };
    if (!requestId) {
      return json({ error: "requestId is required" }, 400);
    }

    const admin = createClient(supabaseUrl, supabaseService);
    const { data: request, error: requestError } = await admin
      .from("requests")
      .select("id, user_id, title")
      .eq("id", requestId)
      .single();

    if (requestError || !request || request.user_id !== user.id) {
      return json({ error: "Forbidden or request not found" }, 403);
    }

    const { data: subscription } = await admin
      .from("notification_subscriptions")
      .select("email, ai_results_enabled, digest_frequency")
      .eq("user_id", request.user_id)
      .eq("is_active", true)
      .single();

    if (!subscription || subscription.ai_results_enabled === false || subscription.digest_frequency === "daily") {
      return json({ success: true, message: "Instant AI notification skipped" });
    }

    const { data: matches } = await admin
      .from("ai_offer_matches")
      .select("title, price, source_name, match_score")
      .eq("request_id", requestId)
      .order("match_score", { ascending: false })
      .limit(3);

    if (!subscription.email || !RESEND_API_KEY) {
      return json({ success: true, message: "Email channel unavailable" });
    }

    const requestUrl = `${SITE_URL}/request/${requestId}`;
    const items = (matches || [])
      .map(
        (match) =>
          `<li><strong>${escapeHtml(match.title)}</strong> — ${escapeHtml(match.price || "цена уточняется")} (${escapeHtml(match.source_name)}, ${match.match_score}%)</li>`,
      )
      .join("");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [subscription.email],
        subject: `AI-подборка готова: ${request.title}`,
        html: `
          <h2>AI-подборка готова</h2>
          <p>Мы нашли варианты по запросу: <strong>${escapeHtml(request.title)}</strong></p>
          <ol>${items}</ol>
          <p><a href="${requestUrl}">Посмотреть все предложения</a></p>
        `,
      }),
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    return json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error in send-ai-results-notification:", error);
    return json({ error: message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
