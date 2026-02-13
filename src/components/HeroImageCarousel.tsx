import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const foodImages = [
  {
    url: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&q=80",
    alt: "Butter Chicken",
    dish: "Butter Chicken"
  },
  {
    url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80",
    alt: "Biryani",
    dish: "Biryani"
  },
  {
    url: "/images/Masaladosa.webp",
    alt: "Masala Dosa",
    dish: "Masala Dosa"
  },
  {
    url: "/images/completethali.jpg",
    alt: "Thali",
    dish: "Complete Thali"
  }
];

export const HeroImageCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % foodImages.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px] max-h-[70vh] rounded-2xl overflow-hidden shadow-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <img
            src={foodImages[currentIndex].url}
            alt={foodImages[currentIndex].alt}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Dish name */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-6 left-6"
          >
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-1">
              {foodImages[currentIndex].dish}
            </h3>
            <p className="text-sm text-white/90">Freshly made in home kitchen</p>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Progress indicators */}
      <div className="absolute bottom-3 right-6 flex gap-2">
        {foodImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex
                ? "w-8 bg-white"
                : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
