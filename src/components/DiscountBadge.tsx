import { motion } from "framer-motion";
import { Percent, Gift, Zap } from "lucide-react";

interface DiscountBadgeProps {
  type: "percentage" | "free-delivery" | "flash-sale";
  value?: string;
  discount?: number;
  className?: string;
}

export const DiscountBadge = ({ type, value, discount, className }: DiscountBadgeProps) => {
  const configs = {
    percentage: {
      icon: <Percent className="h-4 w-4" />,
      gradient: "from-green-500 to-emerald-600",
      text: value || (discount ? `${discount}% OFF` : "20% OFF"),
      pulse: true
    },
    "free-delivery": {
      icon: <Gift className="h-4 w-4" />,
      gradient: "from-purple-500 to-pink-600",
      text: "FREE DELIVERY",
      pulse: false
    },
    "flash-sale": {
      icon: <Zap className="h-4 w-4" />,
      gradient: "from-orange-500 to-red-600",
      text: value || (discount ? `${discount}% OFF - FLASH SALE` : "FLASH SALE"),
      pulse: true
    }
  };

  const config = configs[type];

  return (
    <motion.div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${config.gradient} text-white font-bold text-xs shadow-lg ${className}`}
      animate={config.pulse ? {
        scale: [1, 1.05, 1],
      } : {}}
      transition={{
        duration: 2,
        repeat: Infinity,
      }}
      whileHover={{ scale: 1.1 }}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
        animate={{
          x: ["-100%", "200%"],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1,
        }}
      />
      
      <div className="relative z-10 flex items-center gap-1.5">
        {config.icon}
        <span>{config.text}</span>
      </div>
    </motion.div>
  );
};
