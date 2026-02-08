import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Flame, TrendingUp, Users } from "lucide-react";

interface LiveActivityIndicatorProps {
  type: "trending" | "popular" | "live-orders" | "limited-stock";
  count?: number;
  text?: string;
  label?: string;
  className?: string;
}

export const LiveActivityIndicator = ({ 
  type, 
  count,
  text,
  label,
  className = ""
}: LiveActivityIndicatorProps) => {
  const configs = {
    "trending": {
      icon: <Flame className="h-3.5 w-3.5" />,
      color: "bg-gradient-to-r from-orange-500 to-red-500",
      label: label || text || "Trending Now"
    },
    "popular": {
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
      label: label || text || "Most Popular"
    },
    "live-orders": {
      icon: <Users className="h-3.5 w-3.5" />,
      color: "bg-gradient-to-r from-green-500 to-emerald-500",
      label: label || text || `${count || 0} ordering now`
    },
    "limited-stock": {
      icon: <Flame className="h-3.5 w-3.5" />,
      color: "bg-gradient-to-r from-red-500 to-orange-500",
      label: label || text || `${count || 0} left`
    }
  };

  const config = configs[type];

  return (
    <Badge className={`${config.color} text-white border-none shadow-lg relative overflow-hidden ${className}`}>
      {/* Animated pulse background */}
      <motion.div
        className="absolute inset-0 bg-white"
        animate={{
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <div className="relative flex items-center gap-1.5">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        >
          {config.icon}
        </motion.div>
        <span className="text-xs font-semibold">{config.label}</span>
      </div>
    </Badge>
  );
};
