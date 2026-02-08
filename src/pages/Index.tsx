import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import HowItWorks from "@/components/home/HowItWorks";
import MeetChefs from "@/components/home/MeetChefs";
import PopularMeals from "@/components/home/PopularMeals";
import WhyMyHomePlate from "@/components/home/WhyMyHomePlate";
import CategoriesSection from "@/components/home/CategoriesSection";
import { TrustBanner } from "@/components/TrustBanner";
import { PlatformComparison } from "@/components/PlatformComparison";

// NEW: Import animated components
import { HeroImageCarousel } from "@/components/HeroImageCarousel";
import { FoodAnimatedIcon } from "@/components/FoodAnimatedIcon";
import { LiveActivityIndicator } from "@/components/LiveActivityIndicator";
import { FloatingActionBubble } from "@/components/FloatingActionBubble";
import { DiscountBadge } from "@/components/DiscountBadge";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-warm-50 via-white to-warm-50">
      <SEOHead
        title="MyHomePlate - Nizampet's Home-Cooked Food Community"
        description="Authentic, home-cooked meals by local chefs in Nizampet. No industrial kitchens—just real food from your neighbors. Order today!"
      />
      
      <Navbar />

      {/* NEW: Floating Action Menu */}
      <FloatingActionBubble />

      {/* Hero Section - Above the Fold Optimized */}
      <section className="relative overflow-hidden bg-gradient-hero pt-12 pb-12 md:pt-14 md:pb-16">
        <div className="mx-auto px-6 md:px-8" style={{ maxWidth: '1200px' }}>
          <div className="grid md:grid-cols-2 lg:grid-cols-[58%_42%] gap-8 lg:gap-10 items-center">
            {/* Left: Content - 58% */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-white z-10"
            >
              {/* Nizampet Location Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-3 border border-white/30"
              >
                <MapPin className="h-4 w-4 text-orange-200" />
                <span className="text-sm font-semibold">Now Serving Nizampet Neighbors</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-2"
                style={{ fontFamily: 'Poppins, Montserrat, sans-serif' }}
              >
                Taste the <span className="text-orange-200">Home.</span>{" "}
                <br />
                Support the <span className="text-orange-200">Neighborhood.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-base md:text-lg mb-3 text-orange-50 leading-relaxed"
              >
                Authentic, home-cooked meals by local chefs in <strong className="text-white">Nizampet</strong>.{" "}
                <strong className="text-white">No industrial kitchens</strong>—just real food from your neighbors.
              </motion.p>

              {/* Order Windows - Compact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 mb-3 border border-white/20 inline-block"
              >
                <p className="text-white text-sm font-semibold">
                  ⏰ Pre-order by <span className="text-orange-200 font-bold">11 AM</span> for Lunch • <span className="text-orange-200 font-bold">2 PM</span> for Dinner
                </p>
              </motion.div>

              {/* Simplified Social Proof - Nizampet Specific */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex items-center gap-2 mb-3"
              >
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                  <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                  <span className="text-sm font-semibold">4.8/5 - Rated by your Nizampet Neighbors</span>
                </div>
              </motion.div>

              {/* CTA Buttons - Primary + Ghost Secondary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="flex flex-wrap gap-3"
              >
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-orange-50 text-base md:text-lg px-6 py-5 rounded-xl shadow-warm group font-semibold"
                  onClick={() => window.location.href = '/meals'}
                >
                  Browse Today's Menu
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="border-2 border-white/50 text-white hover:bg-white/10 text-base md:text-lg px-6 py-5 rounded-xl backdrop-blur-sm"
                  onClick={() => window.location.href = '/partner'}
                >
                  Become a Home Chef
                </Button>
              </motion.div>
            </motion.div>

            {/* Right: Carousel - 42% */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="hidden md:flex items-center justify-center"
              style={{ minHeight: '400px', maxHeight: '70vh' }}
            >
              <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                <HeroImageCarousel />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl animate-float-delayed" />
      </section>

      {/* Trust Banner */}
      <TrustBanner />

      {/* Categories Section */}
      <AnimatedSection>
        <CategoriesSection />
      </AnimatedSection>

      {/* Popular Meals with Enhanced Cards */}
      <AnimatedSection>
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-12">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <FoodAnimatedIcon emoji="🔥" size="lg" />
                  <h2 className="text-3xl md:text-4xl font-bold">
                    What's Cooking Today
                  </h2>
                </div>
                <p className="text-lg text-muted-foreground">
                  Fresh meals your neighbors are loving right now
                </p>
              </div>
              <LiveActivityIndicator type="popular" count={1247} />
            </div>

            <PopularMeals />
          </div>
        </section>
      </AnimatedSection>

      {/* Flash Sale Section (Example) */}
      <AnimatedSection>
        <section className="py-16 bg-gradient-to-br from-red-50 to-orange-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <FoodAnimatedIcon emoji="⚡" size="lg" />
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-2">
                    Today's Chef Specials!
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Limited portions - Grab before they're gone
                  </p>
                </div>
              </div>
              <DiscountBadge type="flash-sale" discount={50} />
            </div>

            {/* Example flash sale cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="group overflow-hidden hover:shadow-elevated transition-all">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={`https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=400&fit=crop`}
                      alt="Meal"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <DiscountBadge type="percentage" discount={40} />
                    </div>
                    <LiveActivityIndicator
                      type="limited-stock"
                      count={5}
                      label="left"
                      className="absolute bottom-3 left-3"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-2">Special Biryani</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl font-bold text-primary">₹180</span>
                      <span className="text-lg text-muted-foreground line-through">₹300</span>
                    </div>
                    <Button className="w-full bg-gradient-hero">
                      Pre-Order Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Meet Our Chefs */}
      <AnimatedSection>
        <div className="flex items-center gap-3 mb-8 container mx-auto px-4">
          <FoodAnimatedIcon emoji="👨‍🍳" size="lg" />
          <h2 className="text-3xl md:text-4xl font-bold">Meet Our Home Chefs</h2>
        </div>
        <MeetChefs />
      </AnimatedSection>

      {/* How It Works */}
      <AnimatedSection>
        <HowItWorks />
      </AnimatedSection>

      {/* Why MyHomePlate */}
      <AnimatedSection>
        <WhyMyHomePlate />
      </AnimatedSection>

      {/* Platform Comparison */}
      <AnimatedSection>
        <PlatformComparison />
      </AnimatedSection>

      {/* Final CTA */}
      <AnimatedSection>
        <section className="py-20 bg-gradient-hero text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex justify-center gap-3 mb-6">
                <FoodAnimatedIcon emoji="🍛" size="lg" />
                <FoodAnimatedIcon emoji="🥘" size="lg" delay={0.2} />
                <FoodAnimatedIcon emoji="🍜" size="lg" delay={0.4} />
              </div>

              <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: 'Poppins, Montserrat, sans-serif' }}>
                Join Your Community Kitchen
              </h2>
              <p className="text-xl mb-8 text-orange-100 max-w-2xl mx-auto">
                Be part of a <strong className="text-white">neighborhood movement</strong> where every meal tells a story.
                <br />Real kitchens. Real neighbors. Real food—made with heart. 🧡
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-orange-50 text-lg px-8 py-6 rounded-xl shadow-warm"
                  onClick={() => window.location.href = '/chefs'}
                >
                  Meet Your Neighbors
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-6 rounded-xl bg-white/10 backdrop-blur-sm font-semibold"
                  onClick={() => window.location.href = '/meals'}
                >
                  Browse Today's Menu
                </Button>
              </div>

              <div className="mt-12 flex flex-wrap gap-6 justify-center items-center text-orange-100">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
                  <span>4.8/5 from 12K+ reviews</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <LiveActivityIndicator type="trending" count={50000} label="happy plates served" />
                </div>
                <span>•</span>
                <span>500+ Home Chefs in 15 cities</span>
              </div>
            </motion.div>
          </div>
        </section>
      </AnimatedSection>

      {/* Footer */}
      <footer className="bg-[#2c1810] text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <FoodAnimatedIcon emoji="🏠" size="lg" />
          <h3 className="text-2xl font-bold mt-4 mb-2">MyHomePlate</h3>
          <p className="text-orange-100/80 mb-6">
            Where every meal tells a story, and every chef is your neighbor.
          </p>
          <p className="text-orange-100/60 text-sm">
            © 2026 MyHomePlate. All rights reserved.
          </p>
          <p className="text-orange-100/50 text-xs mt-2">
            Developed by Suman Kumar Kaundinya • <a href="mailto:sumanj241118@gmail.com" className="hover:text-orange-200 transition-colors">sumanj241118@gmail.com</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

/**
 * Animated Section Wrapper
 * Adds scroll-triggered fade-up animation to sections
 */
const AnimatedSection = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

export default Index;
