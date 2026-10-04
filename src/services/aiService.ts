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

export async function sendChatMessage(
  history: ChatMessage[],
  userMessage: string
): Promise<AIResponse> {
  const { data, error } = await supabase.functions.invoke("platie-chat", {
    body: { history, userMessage },
  });

  if (error) {
    console.error("platie-chat error:", error);
    return {
      content: "Sorry, I'm having trouble connecting right now. Please try again in a moment! 🙏",
    };
  }

  return data as AIResponse;
}
