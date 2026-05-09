import { motion } from "framer-motion";
import { ArrowRight, MapPin, BookOpen, ChefHat, Users, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import { HeroImageCarousel } from "@/components/HeroImageCarousel";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-warm-50 via-white to-warm-50">
      <SEOHead
        title="MyHomePlate - Nizampet's Home-Cooked Food Community"
        description="Authentic, home-cooked meals by local chefs in Nizampet. No industrial kitchens—just real food from your neighbors. Order today!"
      />
      
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero" style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center' }}>
        <div className="w-full mx-auto px-6 md:px-10" style={{ maxWidth: '1200px' }}>
          <div className="grid md:grid-cols-2 lg:grid-cols-[55%_45%] gap-6 lg:gap-8 items-center py-5 pb-14">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-white z-10"
            >
              {/* Location Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full mb-4 border border-white/25"
              >
                <MapPin className="h-3.5 w-3.5 text-orange-200" />
                <span className="text-xs font-semibold tracking-widest uppercase text-orange-100">Nizampet · Now Live</span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-3xl md:text-4xl font-extrabold leading-[1.1] mb-3 tracking-tight"
              >
                Real Food.<br />
                <span className="text-orange-200">Real Neighbors.</span><br />
                Real Home.
              </motion.h1>

              {/* Subtext */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="text-sm mb-4 text-white/75 leading-relaxed max-w-md"
              >
                Fresh home-cooked meals delivered from local kitchens in Nizampet — every single day.
              </motion.p>

              {/* Stats Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-wrap gap-4 mb-5"
              >
                {[
                  { icon: "🍽", value: "120+", label: "meals daily" },
                  { icon: "⭐", value: "4.8", label: "rated" },
                  { icon: "👨‍🍳", value: "15+", label: "home chefs" },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2">
                    <span className="text-lg">{stat.icon}</span>
                    <div>
                      <p className="text-base font-bold leading-none">{stat.value}</p>
                      <p className="text-xs text-white/60">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.6 }}
                className="flex flex-wrap gap-3"
              >
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-orange-50 text-sm font-bold px-6 py-4 rounded-2xl shadow-warm group"
                  onClick={() => window.location.href = '/meals'}
                >
                  Browse Today's Menu
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="border border-white/40 text-white/90 hover:bg-white/10 hover:text-white text-sm px-6 py-4 rounded-2xl"
                  onClick={() => window.location.href = '/partner'}
                >
                  Cook with us
                </Button>
              </motion.div>
            </motion.div>

            {/* Right: Carousel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="flex items-center justify-center"
            >
              <div className="w-full rounded-2xl overflow-hidden shadow-2xl" style={{ height: 'min(380px, 52vh)' }}>
                <HeroImageCarousel />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl animate-float-delayed" />
      </section>



      {/* Navigation Cards Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Would You Like To Do?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose your path and explore MyHomePlate's community of home-cooked meals
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Order Meals Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card
                className="p-8 hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary h-full"
                onClick={() => window.location.href = '/meals'}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <UtensilsCrossed className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Order Meals</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse today's fresh home-cooked meals
                  </p>
                </div>
              </Card>
            </motion.div>

            {/* Become Chef Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card
                className="p-8 hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary h-full"
                onClick={() => window.location.href = '/partner'}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <ChefHat className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Become a Chef</h3>
                  <p className="text-sm text-muted-foreground">
                    Share your cooking and earn from home
                  </p>
                </div>
              </Card>
            </motion.div>

            {/* Meet Chefs Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card
                className="p-8 hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary h-full"
                onClick={() => window.location.href = '/chefs'}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Meet Chefs</h3>
                  <p className="text-sm text-muted-foreground">
                    Discover talented home chefs nearby
                  </p>
                </div>
              </Card>
            </motion.div>

            {/* Learn More Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card
                className="p-8 hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary h-full"
                onClick={() => window.location.href = '/home'}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Learn More</h3>
                  <p className="text-sm text-muted-foreground">
                    See how MyHomePlate works
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2c1810] text-white py-12 mt-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mt-4 mb-2">MyHomePlate</h3>
          <p className="text-orange-100/80 mb-6">
            Where every meal tells a story, and every chef is your neighbor.
          </p>
          <p className="text-orange-100/60 text-sm">
            © 2026 MyHomePlate. All rights reserved.
          </p>
          <p className="text-orange-100/50 text-xs mt-2">
            Developed and Owned by Suman Kumar Kaundinya • <a href="mailto:sumanj241118@gmail.com" className="hover:text-orange-200 transition-colors">sumanj241118@gmail.com</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
