// ============================================================
// Supabase Edge Function: Уведомление о новом предложении
// ============================================================
// Эта функция вызывается через Database Webhook при INSERT в offers.
//
// Для развертывания:
// 1. Установите Supabase CLI: npm i -g supabase
// 2. supabase functions deploy notify-new-offer
// 3. Добавьте секреты:
//    supabase secrets set RESEND_API_KEY=re_xxxxx
// 4. Создайте Database Webhook в Supabase Console:
//    Table: offers, Events: INSERT, Function: notify-new-offer
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: {
    id: string;
    request_id: string;
    user_id: string;
    company: string;
    price: string;
    description: string;
  };
}

Deno.serve(async (req: Request) => {
  try {
    const payload: WebhookPayload = await req.json();

    if (payload.type !== "INSERT" || payload.table !== "offers") {
      return new Response("Ignored", { status: 200 });
    }

    const offer = payload.record;

    // Initialize Supabase with service role for full access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the request details and buyer's profile
    const { data: request } = await supabase
      .from("requests")
      .select("title, user_id")
      .eq("id", offer.request_id)
      .single();

    if (!request) {
      return new Response("Request not found", { status: 404 });
    }

    // Get buyer's email
    const { data: buyerProfile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", request.user_id)
      .single();

    if (!buyerProfile?.email) {
      console.log("Buyer has no email, skipping notification");
      return new Response("No email", { status: 200 });
    }

    // Send email via Resend
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not set, skipping email");
      return new Response("Email service not configured", { status: 200 });
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "РеверсМаркет <noreply@rev-market.vercel.app>",
        to: [buyerProfile.email],
        subject: `Новое предложение на ваш запрос «${request.title}»`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">🎉 Новое предложение!</h2>
            <p>Здравствуйте, <strong>${buyerProfile.name}</strong>!</p>
            <p>На ваш запрос <strong>«${request.title}»</strong> поступило новое предложение:</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Компания:</strong> ${offer.company}</p>
              <p><strong>Цена:</strong> ${offer.price} ₽</p>
              <p><strong>Описание:</strong> ${offer.description}</p>
            </div>
            <a href="https://rev-market.vercel.app/request/${offer.request_id}"
               style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 8px;">
              Посмотреть предложение
            </a>
            <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
              Это автоматическое уведомление от РеверсМаркет.
            </p>
          </div>
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email sent:", emailResult);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
