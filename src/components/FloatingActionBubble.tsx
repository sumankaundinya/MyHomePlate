import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const FloatingActionBubble = () => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: ShoppingBag, label: "Cart", color: "bg-primary" },
    { icon: Heart, label: "Favorites", color: "bg-red-500" },
    { icon: Share2, label: "Share", color: "bg-blue-500" },
  ];

  return (
    <div className="fixed bottom-24 right-6 z-50 md:bottom-8">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute bottom-16 right-0 flex flex-col gap-3"
          >
            {actions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  size="icon"
                  className={`${action.color} text-white shadow-lg hover:scale-110 transition-transform`}
                  title={action.label}
                >
                  <action.icon className="h-5 w-5" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-full bg-gradient-hero text-white shadow-elevated"
          onClick={() => setIsOpen(!isOpen)}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isOpen ? <X className="h-6 w-6" /> : <ShoppingBag className="h-6 w-6" />}
          </motion.div>
        </Button>
      </motion.div>
    </div>
  );
};
