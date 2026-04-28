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
        className="fixed bottom-24 right-4 z-50 md:bottom-8 md:right-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
      >
        {/* Pulse ring when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-teal-400 opacity-30 animate-ping" />
        )}

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={isOpen ? closeChat : openChat}
          aria-label={isOpen ? "Close chat assistant" : "Open chat assistant"}
          style={{ background: 'linear-gradient(135deg, #0f766e, #0d9488)' }}
          className="
            relative w-14 h-14 rounded-full shadow-xl
            text-white flex items-center justify-center
            hover:shadow-teal-200 hover:shadow-2xl
            transition-shadow
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
                <X className="w-6 h-6" />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <MessageCircle className="w-6 h-6" />
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

        {/* Tooltip label */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: 1.5 }}
              className="
                absolute right-16 top-1/2 -translate-y-1/2
                bg-gray-900 text-white text-xs font-medium
                px-2.5 py-1.5 rounded-lg whitespace-nowrap
                pointer-events-none
                after:content-[''] after:absolute after:left-full after:top-1/2 after:-translate-y-1/2
                after:border-4 after:border-transparent after:border-l-gray-900
              "
            >
              🍛 Ask Platie
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
