import { supabase } from "@/integrations/supabase/client";

export interface MealSuggestion {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
}

export interface ChefSuggestion {
  id: string;
  name: string;
  bio: string | null;
  avg_rating: number | null;
  cuisine: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  meals?: MealSuggestion[];
  chefs?: ChefSuggestion[];
  action?: { label: string; href: string };
}

// ─── Context Builders ────────────────────────────────────────────────────────

async function fetchAvailableMeals(filter?: string): Promise<MealSuggestion[]> {
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

async function fetchFeaturedChefs(): Promise<ChefSuggestion[]> {
  const { data } = await supabase
    .from("chefs")
    .select(
      `id, bio, avg_rating, user_id,
       profiles:user_id ( full_name )`
    )
    .eq("verification_status", "approved")
    .order("avg_rating", { ascending: false })
    .limit(4);

  if (!data) return [];

  return data.map((c: any) => ({
    id: c.id,
    name: c.profiles?.full_name ?? "Home Chef",
    bio: c.bio,
    avg_rating: c.avg_rating,
    cuisine: c.bio ?? "Home-style cooking",
  }));
}

// ─── System Prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(
  meals: MealSuggestion[],
  chefs: ChefSuggestion[]
): string {
  const mealList = meals
    .map((m) => `• ${m.title} (${m.category}) – ₹${m.price}: ${m.description}`)
    .join("\n");
  const chefList = chefs
    .map(
      (c) =>
        `• ${c.name} | Rating: ${c.avg_rating ?? "N/A"} | ${c.cuisine}`
    )
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
): AIResponse {
  const msg = userMessage.toLowerCase();

  if (
    msg.includes("lunch") ||
    msg.includes("dinner") ||
    msg.includes("breakfast") ||
    msg.includes("meal") ||
    msg.includes("food") ||
    msg.includes("eat") ||
    msg.includes("order")
  ) {
    const filtered = msg.includes("veg")
      ? meals.filter((m) =>
          m.category.toLowerCase().includes("veg") &&
          !m.category.toLowerCase().includes("non")
        )
      : meals.slice(0, 4);
    return {
      content:
        "Here are some delicious home-cooked meals available for pre-order! 🍛 Remember to pick your preferred date and time slot when you order.",
      meals: filtered.length > 0 ? filtered : meals.slice(0, 4),
      action: { label: "Browse All Meals", href: "/meals" },
    };
  }

  if (msg.includes("chef") || msg.includes("cook") || msg.includes("who")) {
    return {
      content:
        "Meet our talented home chefs! 👨‍🍳 Each chef is verified and passionate about authentic home cooking. Click 'View Chef' to see their menu and availability.",
      chefs,
      action: { label: "Explore All Chefs", href: "/chefs" },
    };
  }

  if (
    msg.includes("deliver") ||
    msg.includes("how") ||
    msg.includes("work") ||
    msg.includes("process")
  ) {
    return {
      content:
        "MyHomePlate works on a **pre-order model** 🕐\n\n1. Browse meals or chefs\n2. Select your meal and preferred date/time slot\n3. Chef prepares your order fresh\n4. Delivered to your door!\n\nNo instant delivery — we believe good food takes time. Order at least 2–4 hours in advance.",
      action: { label: "Browse Meals", href: "/meals" },
    };
  }

  if (
    msg.includes("pre-order") ||
    msg.includes("preorder") ||
    msg.includes("schedule") ||
    msg.includes("tomorrow") ||
    msg.includes("today")
  ) {
    return {
      content:
        "Great thinking! 📅 Pre-ordering is easy — choose your meal, pick a delivery date/time, and your chef will prepare it fresh. Ordering for today? Do it at least 3 hours ahead. For tomorrow, you can order anytime now!",
      action: { label: "Pre-order Now", href: "/meals" },
    };
  }

  if (
    msg.includes("price") ||
    msg.includes("cost") ||
    msg.includes("cheap") ||
    msg.includes("afford") ||
    msg.includes("₹") ||
    msg.includes("rupee")
  ) {
    return {
      content:
        "Our home-cooked meals are priced between ₹80–₹350, much more affordable and healthier than restaurant food! 💰 Check out our subscription plans for even better value.",
      action: { label: "View Plans", href: "/subscriptions" },
    };
  }

  if (
    msg.includes("subscription") ||
    msg.includes("plan") ||
    msg.includes("tiffin") ||
    msg.includes("bulk") ||
    msg.includes("weekly")
  ) {
    return {
      content:
        "Our Tiffin Plans are perfect for weekly meals! 🥡 Subscribe for daily/weekly deliveries and save up to 20% compared to single orders. Bulk orders are also available for events and offices.",
      action: { label: "View Subscription Plans", href: "/subscriptions" },
    };
  }

  if (
    msg.includes("veg") &&
    (msg.includes("non") || msg.includes("chicken") || msg.includes("meat"))
  ) {
    const nonVeg = meals.filter(
      (m) =>
        m.category.toLowerCase().includes("non") ||
        m.category.toLowerCase().includes("chicken") ||
        m.category.toLowerCase().includes("meat")
    );
    return {
      content:
        "Here are some non-vegetarian options available for pre-order! 🍗 Fresh, home-cooked, and delicious.",
      meals: nonVeg.length > 0 ? nonVeg : meals.slice(0, 3),
      action: { label: "See All Non-Veg Meals", href: "/meals" },
    };
  }

  if (
    msg.includes("hi") ||
    msg.includes("hello") ||
    msg.includes("hey") ||
    msg.includes("start") ||
    msg.includes("help")
  ) {
    return {
      content:
        "Hi there! I'm Platie, your MyHomePlate food assistant! 👋🍛\n\nI can help you:\n• Find delicious home-cooked meals\n• Discover local chefs\n• Understand how pre-ordering works\n• Set up tiffin subscriptions\n\nWhat are you craving today?",
      action: { label: "Browse Meals", href: "/meals" },
    };
  }

  return {
    content:
      "I'm here to help you find the perfect home-cooked meal! 🏠🍽️ You can ask me about available meals, our home chefs, how pre-ordering works, or our tiffin subscription plans. What would you like to know?",
    action: { label: "Explore Meals", href: "/meals" },
  };
}

// ─── Gemini API ───────────────────────────────────────────────────────────────

async function callGemini(
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string,
  apiKey: string
): Promise<string> {
  // Build Gemini contents array: system prompt as first user turn + model ack,
  // then conversation history, then current user message.
  const contents: { role: string; parts: { text: string }[] }[] = [
    { role: "user", parts: [{ text: systemPrompt }] },
    {
      role: "model",
      parts: [{ text: "Understood! I'm Platie, ready to help with home-cooked meals on MyHomePlate." }],
    },
    ...history.slice(-8).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
      }),
    }
  );

  if (!response.ok) throw new Error(`Gemini ${response.status}`);

  const json = await response.json();
  const text: string =
    json.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I couldn't understand that.";
  return text;
}

// ─── Shared post-processing ───────────────────────────────────────────────────

function attachCards(
  content: string,
  meals: MealSuggestion[],
  chefs: ChefSuggestion[]
): AIResponse {
  const lower = content.toLowerCase();
  return {
    content,
    meals:
      lower.includes("meal") || lower.includes("dish") || lower.includes("food")
        ? meals.slice(0, 4)
        : undefined,
    chefs:
      lower.includes("chef") || lower.includes("cook")
        ? chefs.slice(0, 3)
        : undefined,
  };
}

// ─── Main Send Function ───────────────────────────────────────────────────────

export async function sendChatMessage(
  history: ChatMessage[],
  userMessage: string
): Promise<AIResponse> {
  const [meals, chefs] = await Promise.all([
    fetchAvailableMeals(),
    fetchFeaturedChefs(),
  ]);

  const systemPrompt = buildSystemPrompt(meals, chefs);

  // 1. Try Gemini (free tier — primary)
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (geminiKey) {
    try {
      const content = await callGemini(systemPrompt, history, userMessage, geminiKey);
      return attachCards(content, meals, chefs);
    } catch {
      // Fall through to OpenAI
    }
  }

  // 2. Try OpenAI (secondary)
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (openaiKey && openaiKey.startsWith("sk-")) {
    try {
      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...history.slice(-8),
        { role: "user" as const, content: userMessage },
      ];
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({ model: "gpt-4o-mini", messages, max_tokens: 400, temperature: 0.7 }),
      });
      if (!response.ok) throw new Error(`OpenAI ${response.status}`);
      const json = await response.json();
      const content: string = json.choices?.[0]?.message?.content ?? "Sorry, I couldn't understand that.";
      return attachCards(content, meals, chefs);
    } catch {
      // Fall through to rule-based
    }
  }

  // 3. Rule-based fallback (no API key needed)
  return buildFallbackResponse(userMessage, meals, chefs);
}
