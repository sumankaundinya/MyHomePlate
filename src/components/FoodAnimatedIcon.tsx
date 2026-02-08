import { motion } from "framer-motion";

interface FoodAnimatedIconProps {
  emoji: string;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  delay?: number;
}

export const FoodAnimatedIcon = ({ 
  emoji, 
  size = "md", 
  animate = true,
  delay = 0
}: FoodAnimatedIconProps) => {
  const sizeClasses = {
    sm: "text-4xl",
    md: "text-6xl",
    lg: "text-8xl"
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} inline-block`}
      animate={animate ? {
        y: [0, -10, 0],
        rotate: [0, 5, -5, 0],
      } : {}}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      }}
      whileHover={{
        scale: 1.2,
        rotate: 360,
        transition: { duration: 0.5 }
      }}
    >
      {emoji}
    </motion.div>
  );
};

// Preset food icons
export const FoodIcons = {
  biryani: "🍛",
  thali: "🍱",
  curry: "🍲",
  roti: "🫓",
  dessert: "🍮",
  tea: "🫖",
  dosa: "🥞",
  samosa: "🥟",
  chef: "👨‍🍳",
  spice: "🌶️",
  heart: "❤️",
  fire: "🔥"
};
