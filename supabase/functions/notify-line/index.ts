import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";

const LINE_GROUP_ID = "C9eff0058bcd3c6863485fd1e00f21e7e";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
    if (!token) throw new Error("LINE_CHANNEL_ACCESS_TOKEN not configured");

    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: LINE_GROUP_ID,
        messages: [{ type: "text", text: message }],
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("LINE API error", res.status, text);
      return new Response(JSON.stringify({ error: text }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error(msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
