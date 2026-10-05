import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildPrompt(title: string, category: string, hint?: string): string {
  return `Write one appetizing menu description for a home-cooked dish on an Indian home-chef marketplace.

Dish name: ${title}
Meal category: ${category}
${hint ? `Extra detail from the chef: ${hint}` : ""}

Rules:
- 1-2 sentences, 25-40 words
- Warm, appetizing tone, no clichés like "burst of flavors"
- Do NOT invent specific ingredients, allergens, or health claims that weren't given to you
- Do NOT mention price, delivery, or ordering
- Return ONLY the description text, no quotes, no labels`;
}

async function callGeminiOnce(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 120,
          temperature: 0.8,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }
  );

  if (!response.ok) throw new Error(`Gemini ${response.status}`);
  const json = await response.json();
  const candidate = json.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text?.trim();
  if (!text || (candidate.finishReason && candidate.finishReason !== "STOP")) {
    throw new Error(`Gemini incomplete response (finishReason: ${candidate?.finishReason ?? "none"})`);
  }
  return text;
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const attempts = 2;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await callGeminiOnce(prompt, apiKey);
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw lastErr;
}

async function callGroq(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.8,
      reasoning_effort: "low",
    }),
  });
  if (!response.ok) throw new Error(`Groq ${response.status}`);
  const json = await response.json();
  const choice = json.choices?.[0];
  const text = choice?.message?.content?.trim();
  if (!text || choice?.finish_reason !== "stop") {
    throw new Error(`Groq incomplete response (finish_reason: ${choice?.finish_reason ?? "none"})`);
  }
  return text;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { title, category, hint } = await req.json();
    if (!title || !category) {
      return new Response(JSON.stringify({ error: "title and category are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = buildPrompt(title, category, hint);

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (geminiKey) {
      try {
        const description = await callGemini(prompt, geminiKey);
        return new Response(JSON.stringify({ description }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        console.error("Gemini error:", err);
      }
    }

    const groqKey = Deno.env.get("GROQ_API_KEY");
    if (groqKey) {
      try {
        const description = await callGroq(prompt, groqKey);
        return new Response(JSON.stringify({ description }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        console.error("Groq error:", err);
      }
    }

    return new Response(JSON.stringify({ error: "AI description generation is temporarily unavailable" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
