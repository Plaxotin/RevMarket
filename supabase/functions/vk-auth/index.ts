// ============================================================
// Supabase Edge Function: VK ID авторизация
// ============================================================
// Принимает authorization code от VK SDK (фронтенд),
// обменивает его на access_token, получает данные пользователя,
// создаёт/находит Supabase-пользователя и возвращает сессию.
//
// Секреты (supabase secrets set ...):
//   VK_CLIENT_SECRET — секрет приложения VK ID
//
// Переменные среды (доступны автоматически):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --------------- constants ---------------

const VK_CLIENT_ID = "54306382";
const REDIRECT_URI = "https://rev-market.vercel.app/";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// --------------- helpers ---------------

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/** POST form-urlencoded and return parsed JSON. */
async function postForm(url: string, params: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  return res.json();
}

// --------------- handler ---------------

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // -------- 1. Parse & validate input --------
    const body = await req.json().catch(() => null);
    const code = body?.code;
    const deviceId = body?.device_id;

    if (
      !code ||
      typeof code !== "string" ||
      !deviceId ||
      typeof deviceId !== "string"
    ) {
      return json(
        { error: "Missing or invalid parameters: code, device_id" },
        400,
      );
    }

    const VK_CLIENT_SECRET = Deno.env.get("VK_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!VK_CLIENT_SECRET) {
      console.error("VK_CLIENT_SECRET is not configured");
      return json({ error: "Server configuration error" }, 500);
    }

    // -------- 2. Exchange code → VK access_token --------
    // VK ID OAuth 2.0 token endpoint.
    // We send client_secret (confidential-client flow) instead of
    // code_verifier (PKCE / public-client flow).
    const tokenData = await postForm("https://id.vk.com/oauth2/auth", {
      grant_type: "authorization_code",
      code,
      client_id: VK_CLIENT_ID,
      client_secret: VK_CLIENT_SECRET,
      device_id: deviceId,
      redirect_uri: REDIRECT_URI,
    });

    if (tokenData.error || !tokenData.access_token) {
      console.error("VK token exchange failed:", JSON.stringify(tokenData));
      return json(
        {
          error: "VK authorization failed",
          details: tokenData.error_description || tokenData.error,
        },
        401,
      );
    }

    // -------- 3. Get VK user profile --------
    const userInfoData = await postForm(
      "https://id.vk.com/oauth2/user_info",
      {
        client_id: VK_CLIENT_ID,
        access_token: tokenData.access_token,
      },
    );

    if (userInfoData.error || !userInfoData.user) {
      console.error("VK user_info failed:", JSON.stringify(userInfoData));
      return json({ error: "Failed to retrieve VK user data" }, 502);
    }

    const vkUser = userInfoData.user;
    const vkUserId = String(vkUser.user_id ?? tokenData.user_id);
    const firstName: string = vkUser.first_name ?? "";
    const lastName: string = vkUser.last_name ?? "";
    const fullName =
      [firstName, lastName].filter(Boolean).join(" ") || "Пользователь VK";
    const avatar: string = vkUser.avatar ?? vkUser.photo_200 ?? "";
    const vkPhone: string = vkUser.phone ?? "";
    const vkEmail: string = vkUser.email ?? "";

    // -------- 4. Upsert Supabase Auth user --------
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Deterministic email lets us identify returning VK users without
    // scanning the entire users table.
    const authEmail = `vk_${vkUserId}@vk.revmarket.local`;

    const metadata = {
      vk_id: vkUserId,
      name: fullName,
      vk_first_name: firstName,
      vk_last_name: lastName,
      vk_avatar: avatar,
      provider: "vkid",
    };

    // createUser is idempotent: if the email already exists Supabase
    // returns a "User already registered" error which we silently ignore.
    const { error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: authEmail,
        email_confirm: true,
        user_metadata: metadata,
      });

    if (
      createError &&
      !createError.message.includes("already been registered")
    ) {
      console.error("createUser error:", createError);
      throw new Error("Failed to create user account");
    }

    // -------- 5. Generate session (magic-link → verify) --------
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: authEmail,
      });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("generateLink error:", linkError);
      throw new Error("Failed to generate authentication token");
    }

    const userId = linkData.user.id;

    // Refresh VK metadata on every login so avatar/name stay current.
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: metadata,
    });

    // Patch the profile with real VK contact data (phone / email)
    // when available.  The auto-create trigger already inserted a row
    // on the very first createUser call.
    const profilePatch: Record<string, string> = { name: fullName };
    if (vkPhone) profilePatch.phone = vkPhone;
    if (vkEmail) profilePatch.email = vkEmail;
    await supabaseAdmin.from("profiles").update(profilePatch).eq("id", userId);

    // Exchange the magic-link token_hash for a real access/refresh pair.
    const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        type: "magiclink",
        token_hash: linkData.properties.hashed_token,
      }),
    });

    if (!verifyRes.ok) {
      const errText = await verifyRes.text();
      console.error("verify error:", verifyRes.status, errText);
      throw new Error("Failed to create session");
    }

    const session = await verifyRes.json();

    // -------- 6. Return session to the client --------
    return json({
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        token_type: session.token_type,
        user: session.user,
      },
    });
  } catch (err) {
    console.error("vk-auth unhandled:", err);
    return json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      500,
    );
  }
});
