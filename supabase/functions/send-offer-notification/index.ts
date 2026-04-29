import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { requestId, offerId } = body as { requestId?: string; offerId?: string };
    if (!requestId || !offerId) {
      return new Response(JSON.stringify({ error: "requestId and offerId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, supabaseService);
    const { data: offer, error: offerErr } = await admin
      .from("offers")
      .select("id, user_id, request_id, company, price, description, contact")
      .eq("id", offerId)
      .single();

    if (offerErr || !offer || offer.request_id !== requestId || offer.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden or offer not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: request, error: requestError } = await admin
      .from("requests")
      .select("title, id, user_id, description")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      throw new Error("Request not found");
    }

    const { data: subscription } = await admin
      .from("notification_subscriptions")
      .select("email, telegram_username, seller_offers_enabled, digest_frequency")
      .eq("user_id", request.user_id)
      .eq("is_active", true)
      .single();

    if (!subscription || subscription.seller_offers_enabled === false) {
      return new Response(
        JSON.stringify({ success: true, message: "User not subscribed to seller offers" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (subscription.digest_frequency === "daily") {
      return new Response(
        JSON.stringify({ success: true, message: "Daily digest selected; instant seller notification skipped" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const offerUrl = `${SITE_URL}/request/${requestId}`;
    const emailSubject = `🔔 Новое предложение: ${request.title}`;
    const emailBody = `
      <h2>Новое предложение на ваш запрос!</h2>
      <p><strong>Запрос:</strong> ${escapeHtml(request.title)}</p>
      <p><strong>Описание запроса:</strong> ${escapeHtml(request.description)}</p>
      <hr>
      <p><strong>Предложение от:</strong> ${escapeHtml(offer.company)}</p>
      <p><strong>Цена:</strong> ${escapeHtml(String(offer.price))} ₽</p>
      <p><strong>Описание предложения:</strong> ${escapeHtml(offer.description)}</p>
      <p><strong>Контакты:</strong> ${escapeHtml(offer.contact)}</p>
      <p><a href="${offerUrl}">Просмотреть предложение</a></p>
    `;

    const descShort = request.description.length > 100
      ? request.description.substring(0, 100) + "..."
      : request.description;
    const offerDescShort = offer.description.length > 200
      ? offer.description.substring(0, 200) + "..."
      : offer.description;

    const telegramMessage =
      `🔔Новое предложение на ваш запрос!` +
      `\n\nЗапрос: ${request.title}` +
      `\nОписание: ${descShort}\n\n` +
      `Предложение от: ${offer.company}\n` +
      `Цена: ${offer.price} ₽\n` +
      `Описание: ${offerDescShort}\n` +
      `Контакты: ${offer.contact}\n\n` +
      `${offerUrl}`;

    const results = {
      email: false,
      telegram: false,
      errors: [] as string[],
    };

    if (subscription.email && RESEND_API_KEY) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: RESEND_FROM,
            to: [subscription.email],
            subject: emailSubject,
            html: emailBody,
          }),
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `Resend HTTP ${res.status}`);
        }
        results.email = true;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        results.errors.push(`Email: ${msg}`);
        console.error("Resend error:", e);
      }
    } else if (subscription.email && !RESEND_API_KEY) {
      results.errors.push("Email: RESEND_API_KEY не настроен");
    }

    if (TELEGRAM_BOT_TOKEN && subscription.telegram_username) {
      try {
        const raw = subscription.telegram_username.trim().replace(/^@/, "");
        const chatId: number | string = /^\d+$/.test(raw) ? parseInt(raw, 10) : raw;

        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: telegramMessage,
              disable_web_page_preview: false,
            }),
          },
        );

        if (!telegramResponse.ok) {
          const errorData = await telegramResponse.json();
          throw new Error((errorData as { description?: string }).description || "Telegram API error");
        }

        results.telegram = true;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        results.errors.push(`Telegram: ${msg}`);
        console.error("Telegram error:", e);
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error in send-offer-notification:", error);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
