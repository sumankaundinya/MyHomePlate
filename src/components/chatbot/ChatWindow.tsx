import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, RotateCcw, Minimize2 } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import type { useChatbot } from "@/hooks/useChatbot";

const QUICK_ACTIONS = [
  "Browse Meals",
  "Today's Lunch",
  "Pre-order Tomorrow",
  "Bulk Orders",
  "Tiffin Plans",
] as const;

type ChatbotHook = ReturnType<typeof useChatbot>;

interface ChatWindowProps {
  messages: ChatbotHook["messages"];
  isLoading: ChatbotHook["isLoading"];
  onClose: ChatbotHook["closeChat"];
  onSend: ChatbotHook["sendMessage"];
  onQuickAction: ChatbotHook["handleQuickAction"];
  onClearHistory: ChatbotHook["clearHistory"];
}

export function ChatWindow({
  messages,
  isLoading,
  onClose,
  onSend,
  onQuickAction,
  onClearHistory,
}: ChatWindowProps) {
  const [input, setInput] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when window opens
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, []);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    setShowQuickActions(false);
    onSend(trimmed);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleQuick(label: string) {
    setShowQuickActions(false);
    onQuickAction(label);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      style={{ background: '#ffffff' }}
      className="
        fixed bottom-[9.5rem] right-4 z-50
        w-[calc(100vw-2rem)] max-w-sm
        md:bottom-[5.5rem] md:right-6
        flex flex-col
        bg-white rounded-2xl shadow-2xl
        border border-gray-200
        overflow-hidden
        h-[520px] max-h-[75vh]
      "
    >
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ background: '#0f766e' }} className="flex items-center gap-3 px-4 py-3 text-white flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
          P
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">Platie</p>
          <p className="text-xs" style={{ color: '#99f6e4' }}>MyHomePlate Food Assistant</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClearHistory}
            title="Clear chat"
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            title="Close"
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── Online status pill ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 border-b border-teal-100 flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-gray-500">
          🏠 Home-cooked meals • Pre-order only • No instant delivery
        </span>
      </div>

      {/* ─── Messages ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scroll-smooth bg-white">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ─── Quick Actions ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showQuickActions && messages.length <= 2 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 pb-2 pt-2 flex flex-wrap gap-1.5 flex-shrink-0 bg-white"
          >
            {QUICK_ACTIONS.map((label) => (
              <button
                key={label}
                onClick={() => handleQuick(label)}
                className="text-xs bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-medium px-2.5 py-1 rounded-full transition-colors whitespace-nowrap"
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Input bar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 bg-slate-50 flex-shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything about meals…"
          disabled={isLoading}
          className="
            flex-1 text-sm bg-white border border-gray-200 rounded-full
            px-4 py-2 outline-none
            focus:border-orange-400 focus:ring-2 focus:ring-orange-100
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all placeholder:text-gray-400
          "
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="
            w-9 h-9 flex items-center justify-center rounded-full
            bg-orange-500 hover:bg-orange-600
            text-white
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors flex-shrink-0
          "
        >
          {isLoading ? (
            <motion.span
              className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </motion.div>
  );
}
