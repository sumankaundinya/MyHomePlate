import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useChatbot } from "@/hooks/useChatbot";
import { ChatWindow } from "./ChatWindow";

export function ChatWidget() {
  const {
    messages,
    isLoading,
    isOpen,
    unreadCount,
    openChat,
    closeChat,
    sendMessage,
    handleQuickAction,
    clearHistory,
  } = useChatbot();

  return (
    <>
      {/* ─── Chat Window ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            onClose={closeChat}
            onSend={sendMessage}
            onQuickAction={handleQuickAction}
            onClearHistory={clearHistory}
          />
        )}
      </AnimatePresence>

      {/* ─── Floating Toggle Button ───────────────────────────────────────── */}
      <motion.div
        className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-5"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
      >
        {/* Pulse ring — brand orange */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-orange-400 opacity-30 animate-ping" />
        )}

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={isOpen ? closeChat : openChat}
          aria-label={isOpen ? "Close chat assistant" : "Open chat assistant"}
          style={{ background: 'linear-gradient(135deg, hsl(28,90%,52%), hsl(355,82%,52%))' }}
          className="
            relative w-12 h-12 rounded-full shadow-lg
            text-white flex items-center justify-center
            hover:shadow-xl transition-shadow
          "
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-5 h-5" />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <MessageCircle className="w-5 h-5" />
              </motion.span>
            )}
          </AnimatePresence>

          {/* Unread badge */}
          <AnimatePresence>
            {!isOpen && unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="
                  absolute -top-1 -right-1 w-5 h-5
                  bg-red-500 text-white text-xs font-bold
                  rounded-full flex items-center justify-center
                  border-2 border-white
                "
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>
    </>
  );
}
