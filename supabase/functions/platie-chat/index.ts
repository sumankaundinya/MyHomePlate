import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MealSuggestion {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
}

interface ChefSuggestion {
  id: string;
  name: string;
  bio: string | null;
  avg_rating: number | null;
  cuisine: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Context Builders ────────────────────────────────────────────────────────

async function fetchAvailableMeals(
  supabase: ReturnType<typeof createClient>,
  filter?: string
): Promise<MealSuggestion[]> {
  let query = supabase
    .from("meals")
    .select("id, title, description, price, category, image_url")
    .eq("available", true)
    .limit(6);

  if (filter) {
    query = query.ilike("category", `%${filter}%`);
  }

  const { data } = await query;
  return (data ?? []) as MealSuggestion[];
}

async function fetchFeaturedChefs(
  supabase: ReturnType<typeof createClient>
): Promise<ChefSuggestion[]> {
  const { data } = await supabase
    .from("chefs")
    .select(`id, bio, avg_rating, user_id, profiles:profiles(name)`)
    .eq("verification_status", "approved")
    .order("avg_rating", { ascending: false })
    .limit(4);

  if (!data) return [];

  return (data as any[]).map((c) => ({
    id: c.id,
    name: c.profiles?.name ?? "Home Chef",
    bio: c.bio,
    avg_rating: c.avg_rating,
    cuisine: c.bio ?? "Home-style cooking",
  }));
}

// ─── System Prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(meals: MealSuggestion[], chefs: ChefSuggestion[]): string {
  const mealList = meals
    .map((m) => `• ${m.title} (${m.category}) – ₹${m.price}: ${m.description}`)
    .join("\n");
  const chefList = chefs
    .map((c) => `• ${c.name} | Rating: ${c.avg_rating ?? "N/A"} | ${c.cuisine}`)
    .join("\n");

  return `You are Platie, a friendly and knowledgeable food assistant for MyHomePlate — a home-cooked meal marketplace where local home chefs prepare and deliver authentic meals on a pre-order basis.

KEY BUSINESS RULES:
- MyHomePlate does NOT offer instant delivery. All meals are pre-ordered and scheduled.
- Customers must select a delivery date and time slot when ordering.
- Preparation time is typically 2–4 hours depending on the chef.
- Encourage users to plan ahead and pre-order for today or tomorrow.
- Meals are home-cooked, hygienic, and healthier than restaurant food.

AVAILABLE MEALS RIGHT NOW:
${mealList || "Meals are loading — ask me again in a moment!"}

FEATURED CHEFS:
${chefList || "Chefs are loading — ask me again in a moment!"}

YOUR PERSONALITY:
- Warm, helpful, and enthusiastic about home-cooked food
- Keep responses concise (2–4 sentences) unless explaining something complex
- Use light food emojis occasionally 🍛🥘
- Always guide users toward placing an order or exploring the app
- If a user asks about instant delivery, gently clarify the pre-order model

NAVIGATION LINKS you can reference:
- Browse all meals → /meals
- Explore chefs → /chefs
- Place/view orders → /orders
- Subscription plans → /subscriptions

Respond naturally and helpfully. When suggesting meals or chefs, reference ones from the lists above.`;
}

// ─── Fallback Rule-Based Responses ───────────────────────────────────────────

function buildFallbackResponse(
  userMessage: string,
  meals: MealSuggestion[],
  chefs: ChefSuggestion[]
) {
  const msg = userMessage.toLowerCase();

  if (["lunch", "dinner", "breakfast", "meal", "food", "eat", "order"].some((k) => msg.includes(k))) {
    const filtered = msg.includes("veg")
      ? meals.filter((m) => m.category.toLowerCase().includes("veg") && !m.category.toLowerCase().includes("non"))
      : meals.slice(0, 4);
    return {
      content: "Here are some delicious home-cooked meals available for pre-order! 🍛 Remember to pick your preferred date and time slot when you order.",
      meals: filtered.length > 0 ? filtered : meals.slice(0, 4),
      action: { label: "Browse All Meals", href: "/meals" },
    };
  }

  if (["chef", "cook", "who"].some((k) => msg.includes(k))) {
    return {
      content: "Meet our talented home chefs! 👨‍🍳 Each chef is verified and passionate about authentic home cooking. Click 'View Chef' to see their menu and availability.",
      chefs,
      action: { label: "Explore All Chefs", href: "/chefs" },
    };
  }

  if (["deliver", "how", "work", "process"].some((k) => msg.includes(k))) {
    return {
      content: "MyHomePlate works on a **pre-order model** 🕐\n\n1. Browse meals or chefs\n2. Select your meal and preferred date/time slot\n3. Chef prepares your order fresh\n4. Delivered to your door!\n\nNo instant delivery — we believe good food takes time. Order at least 2–4 hours in advance.",
      action: { label: "Browse Meals", href: "/meals" },
    };
  }

  if (["pre-order", "preorder", "schedule", "tomorrow", "today"].some((k) => msg.includes(k))) {
    return {
      content: "Great thinking! 📅 Pre-ordering is easy — choose your meal, pick a delivery date/time, and your chef will prepare it fresh. Ordering for today? Do it at least 3 hours ahead. For tomorrow, you can order anytime now!",
      action: { label: "Pre-order Now", href: "/meals" },
    };
  }

  if (["price", "cost", "cheap", "afford", "₹", "rupee"].some((k) => msg.includes(k))) {
    return {
      content: "Our home-cooked meals are priced between ₹80–₹350, much more affordable and healthier than restaurant food! 💰 Check out our subscription plans for even better value.",
      action: { label: "View Plans", href: "/subscriptions" },
    };
  }

  if (["subscription", "plan", "tiffin", "bulk", "weekly"].some((k) => msg.includes(k))) {
    return {
      content: "Our Tiffin Plans are perfect for weekly meals! 🥡 Subscribe for daily/weekly deliveries and save up to 20% compared to single orders. Bulk orders are also available for events and offices.",
      action: { label: "View Subscription Plans", href: "/subscriptions" },
    };
  }

  if (msg.includes("veg") && ["non", "chicken", "meat"].some((k) => msg.includes(k))) {
    const nonVeg = meals.filter(
      (m) =>
        m.category.toLowerCase().includes("non") ||
        m.category.toLowerCase().includes("chicken") ||
        m.category.toLowerCase().includes("meat")
    );
    return {
      content: "Here are some non-vegetarian options available for pre-order! 🍗 Fresh, home-cooked, and delicious.",
      meals: nonVeg.length > 0 ? nonVeg : meals.slice(0, 3),
      action: { label: "See All Non-Veg Meals", href: "/meals" },
    };
  }

  if (["hi", "hello", "hey", "start", "help"].some((k) => msg.includes(k))) {
    return {
      content: "Hi there! I'm Platie, your MyHomePlate food assistant! 👋🍛\n\nI can help you:\n• Find delicious home-cooked meals\n• Discover local chefs\n• Understand how pre-ordering works\n• Set up tiffin subscriptions\n\nWhat are you craving today?",
      action: { label: "Browse Meals", href: "/meals" },
    };
  }

  return {
    content: "I'm here to help you find the perfect home-cooked meal! 🏠🍽️ You can ask me about available meals, our home chefs, how pre-ordering works, or our tiffin subscription plans. What would you like to know?",
    action: { label: "Explore Meals", href: "/meals" },
  };
}

// ─── LLM Providers ─────────────────────────────────────────────────────────────

async function callGeminiOnce(systemPrompt: string, history: ChatMessage[], userMessage: string, apiKey: string): Promise<string> {
  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Understood! I'm Platie, ready to help with home-cooked meals on MyHomePlate." }] },
    ...history.slice(-8).map((m) => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: 400,
          temperature: 0.7,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }
  );

  if (!response.ok) throw new Error(`Gemini ${response.status}`);
  const json = await response.json();

  const candidate = json.candidates?.[0];
  const finishReason = candidate?.finishReason;
  const text = candidate?.content?.parts?.[0]?.text;

  // Gemini is prone to transient truncation under load — treat anything
  // that didn't cleanly finish, or came back suspiciously short, as a
  // failure so the caller retries/falls through instead of showing junk.
  if (!text || (finishReason && finishReason !== "STOP") || text.trim().length < 15) {
    throw new Error(`Gemini incomplete response (finishReason: ${finishReason ?? "none"})`);
  }

  return text;
}

async function callGemini(systemPrompt: string, history: ChatMessage[], userMessage: string, apiKey: string): Promise<string> {
  const attempts = 2;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await callGeminiOnce(systemPrompt, history, userMessage, apiKey);
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw lastErr;
}

async function callGroq(systemPrompt: string, history: ChatMessage[], userMessage: string, apiKey: string): Promise<string> {
  const messages = [{ role: "system", content: systemPrompt }, ...history.slice(-8), { role: "user", content: userMessage }];
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages, max_tokens: 400, temperature: 0.7 }),
  });
  if (!response.ok) throw new Error(`Groq ${response.status}`);
  const json = await response.json();
  return json.choices?.[0]?.message?.content ?? "Sorry, I couldn't understand that.";
}

async function callOpenAI(systemPrompt: string, history: ChatMessage[], userMessage: string, apiKey: string): Promise<string> {
  const messages = [{ role: "system", content: systemPrompt }, ...history.slice(-8), { role: "user", content: userMessage }];
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-4o-mini", messages, max_tokens: 400, temperature: 0.7 }),
  });
  if (!response.ok) throw new Error(`OpenAI ${response.status}`);
  const json = await response.json();
  return json.choices?.[0]?.message?.content ?? "Sorry, I couldn't understand that.";
}

function attachCards(content: string, meals: MealSuggestion[], chefs: ChefSuggestion[]) {
  const lower = content.toLowerCase();
  return {
    content,
    meals: lower.includes("meal") || lower.includes("dish") || lower.includes("food") ? meals.slice(0, 4) : undefined,
    chefs: lower.includes("chef") || lower.includes("cook") ? chefs.slice(0, 3) : undefined,
  };
}

// ─── Entry Point ───────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { history = [], userMessage } = await req.json();
    if (!userMessage || typeof userMessage !== "string") {
      return new Response(JSON.stringify({ error: "userMessage is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [meals, chefs] = await Promise.all([fetchAvailableMeals(supabase), fetchFeaturedChefs(supabase)]);
    const systemPrompt = buildSystemPrompt(meals, chefs);

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (geminiKey) {
      try {
        const content = await callGemini(systemPrompt, history, userMessage, geminiKey);
        return new Response(JSON.stringify(attachCards(content, meals, chefs)), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        console.error("Gemini error:", err);
      }
    }

    const groqKey = Deno.env.get("GROQ_API_KEY");
    if (groqKey) {
      try {
        const content = await callGroq(systemPrompt, history, userMessage, groqKey);
        return new Response(JSON.stringify(attachCards(content, meals, chefs)), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        console.error("Groq error:", err);
      }
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (openaiKey) {
      try {
        const content = await callOpenAI(systemPrompt, history, userMessage, openaiKey);
        return new Response(JSON.stringify(attachCards(content, meals, chefs)), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        console.error("OpenAI error:", err);
      }
    }

    return new Response(JSON.stringify(buildFallbackResponse(userMessage, meals, chefs)), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
