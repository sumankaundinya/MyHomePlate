import { useState, useCallback, useRef, useEffect } from "react";
import { sendChatMessage, type AIResponse, type MealSuggestion, type ChefSuggestion } from "@/services/aiService";

const STORAGE_KEY = "mhp_chat_history";
const MAX_STORED_MESSAGES = 30;

export interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  meals?: MealSuggestion[];
  chefs?: ChefSuggestion[];
  action?: { label: string; href: string };
  isTyping?: boolean;
}

function loadPersistedMessages(): DisplayMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DisplayMessage[];
    return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
}

function persistMessages(messages: DisplayMessage[]) {
  try {
    const toStore = messages
      .filter((m) => !m.isTyping)
      .slice(-MAX_STORED_MESSAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // storage quota exceeded — ignore
  }
}

let idCounter = 0;
function uid() {
  return `msg-${Date.now()}-${++idCounter}`;
}

export function useChatbot() {
  const [messages, setMessages] = useState<DisplayMessage[]>(() => {
    const stored = loadPersistedMessages();
    if (stored.length === 0) {
      return [
        {
          id: uid(),
          role: "assistant",
          content:
            "Hi! I'm Platie, your MyHomePlate food assistant 🍛\n\nI can help you find home-cooked meals, discover local chefs, and understand how pre-ordering works. What are you craving today?",
          timestamp: new Date(),
          action: { label: "Browse Meals", href: "/meals" },
        },
      ];
    }
    return stored;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist messages whenever they change
  useEffect(() => {
    persistMessages(messages);
  }, [messages]);

  // Track unread messages when chat is closed
  useEffect(() => {
    if (!isOpen) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "assistant" && !lastMsg.isTyping) {
        setUnreadCount((c) => Math.min(c + 1, 9));
      }
    }
  }, [messages, isOpen]);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
  }, []);

  const closeChat = useCallback(() => setIsOpen(false), []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([
      {
        id: uid(),
        role: "assistant",
        content:
          "Chat cleared! I'm Platie 🍛 How can I help you find your next home-cooked meal?",
        timestamp: new Date(),
        action: { label: "Browse Meals", href: "/meals" },
      },
    ]);
  }, []);

  const sendMessage = useCallback(
    (userText: string) => {
      const trimmed = userText.trim();
      if (!trimmed || isLoading) return;

      // Clear any pending debounce
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      const userMsg: DisplayMessage = {
        id: uid(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      const typingMsg: DisplayMessage = {
        id: uid(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isTyping: true,
      };

      setMessages((prev) => [...prev, userMsg, typingMsg]);
      setIsLoading(true);

      // Build history for API (exclude typing indicator)
      const historyForApi = messages
        .filter((m) => !m.isTyping)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      debounceTimer.current = setTimeout(async () => {
        try {
          const response: AIResponse = await sendChatMessage(historyForApi, trimmed);
          const assistantMsg: DisplayMessage = {
            id: uid(),
            role: "assistant",
            content: response.content,
            timestamp: new Date(),
            meals: response.meals,
            chefs: response.chefs,
            action: response.action,
          };

          setMessages((prev) => [
            ...prev.filter((m) => !m.isTyping),
            assistantMsg,
          ]);
        } catch {
          setMessages((prev) => [
            ...prev.filter((m) => !m.isTyping),
            {
              id: uid(),
              role: "assistant",
              content:
                "Oops! Something went wrong on my end 😅 Please try again, or visit /meals to browse directly.",
              timestamp: new Date(),
              action: { label: "Browse Meals", href: "/meals" },
            },
          ]);
        } finally {
          setIsLoading(false);
        }
      }, 300); // 300ms debounce
    },
    [isLoading, messages]
  );

  const handleQuickAction = useCallback(
    (label: string) => {
      const promptMap: Record<string, string> = {
        "Browse Meals": "Show me available meals",
        "Today's Lunch": "What can I order for lunch today?",
        "Pre-order Tomorrow": "I want to pre-order for tomorrow",
        "Bulk Orders": "Tell me about bulk orders for events",
        "Tiffin Plans": "What tiffin subscription plans do you offer?",
      };
      sendMessage(promptMap[label] ?? label);
    },
    [sendMessage]
  );

  return {
    messages,
    isLoading,
    isOpen,
    unreadCount,
    openChat,
    closeChat,
    sendMessage,
    handleQuickAction,
    clearHistory,
  };
}
