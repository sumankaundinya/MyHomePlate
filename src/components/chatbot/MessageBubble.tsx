import { motion } from "framer-motion";
import { Star, ExternalLink, IndianRupee } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { DisplayMessage } from "@/hooks/useChatbot";

// ─── Typing dots animation ────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-orange-400"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

// ─── Meal card inside chat ────────────────────────────────────────────────────
function MealCard({
  meal,
}: {
  meal: { id: string; title: string; price: number; category: string; image_url: string | null };
}) {
  const navigate = useNavigate();
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/meals/${meal.id}`)}
      className="flex items-center gap-2 w-full bg-white border border-orange-100 rounded-xl p-2 text-left hover:border-orange-300 hover:shadow-md transition-all"
    >
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-orange-50 flex-shrink-0">
        {meal.image_url ? (
          <img src={meal.image_url} alt={meal.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 text-sm truncate">{meal.title}</p>
        <p className="text-xs text-gray-500 capitalize">{meal.category}</p>
      </div>
      <div className="flex items-center text-orange-600 font-semibold text-sm flex-shrink-0">
        <IndianRupee className="w-3 h-3" />
        {meal.price}
      </div>
    </motion.button>
  );
}

// ─── Chef card inside chat ────────────────────────────────────────────────────
function ChefCard({
  chef,
}: {
  chef: { id: string; name: string; avg_rating: number | null; cuisine: string };
}) {
  const navigate = useNavigate();
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/chefs/${chef.id}`)}
      className="flex items-center gap-2 w-full bg-white border border-orange-100 rounded-xl p-2 text-left hover:border-orange-300 hover:shadow-md transition-all"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {chef.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 text-sm truncate">{chef.name}</p>
        <p className="text-xs text-gray-500 truncate">{chef.cuisine}</p>
      </div>
      {chef.avg_rating !== null && (
        <div className="flex items-center gap-0.5 text-amber-500 flex-shrink-0">
          <Star className="w-3 h-3 fill-current" />
          <span className="text-xs font-semibold">{chef.avg_rating.toFixed(1)}</span>
        </div>
      )}
    </motion.button>
  );
}

// ─── Parse markdown-lite (bold + newlines) ───────────────────────────────────
function renderContent(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Replace **bold** with <strong>
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i}>
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j}>{part.slice(2, -2)}</strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

// ─── Main MessageBubble ───────────────────────────────────────────────────────
interface MessageBubbleProps {
  message: DisplayMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const navigate = useNavigate();
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] flex flex-col gap-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Avatar for assistant */}
        {!isUser && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
              P
            </div>
            <span className="text-xs text-gray-500 font-medium">Platie</span>
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words",
            isUser
              ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-tr-sm"
              : "bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-sm"
          )}
        >
          {message.isTyping ? (
            <TypingIndicator />
          ) : (
            <p>{renderContent(message.content)}</p>
          )}
        </div>

        {/* Meal cards */}
        {message.meals && message.meals.length > 0 && (
          <div className="w-full flex flex-col gap-1.5 mt-1">
            {message.meals.slice(0, 4).map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        )}

        {/* Chef cards */}
        {message.chefs && message.chefs.length > 0 && (
          <div className="w-full flex flex-col gap-1.5 mt-1">
            {message.chefs.slice(0, 3).map((chef) => (
              <ChefCard key={chef.id} chef={chef} />
            ))}
          </div>
        )}

        {/* CTA action button */}
        {message.action && !message.isTyping && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(message.action!.href)}
            className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            {message.action.label}
          </motion.button>
        )}

        {/* Timestamp */}
        <span className="text-xs text-gray-400 px-1">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </motion.div>
  );
}
