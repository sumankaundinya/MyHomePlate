import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Star } from "lucide-react";
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
import { FoodAnimatedIcon } from "@/components/FoodAnimatedIcon";
import { LiveActivityIndicator } from "@/components/LiveActivityIndicator";
import { DiscountBadge } from "@/components/DiscountBadge";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-warm-50 via-white to-warm-50">
      <SEOHead
        title="MyHomePlate - Explore Home-Cooked Meals & Local Chefs"
        description="Discover authentic home-cooked meals, meet local chefs, and learn how MyHomePlate connects neighbors through food."
      />
      
      <Navbar />

      {/* Floating Action Menu */}

      {/* Page Header */}
      <section className="pt-24 pb-12 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Poppins, Montserrat, sans-serif' }}>
              Discover Your Neighborhood Kitchen
            </h1>
            <p className="text-xl text-orange-100 max-w-2xl mx-auto">
              Everything you need to know about home-cooked meals from your neighbors
            </p>
          </motion.div>
        </div>
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
                  <span>🏠 Nizampet's first home chef marketplace</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <span>✅ Verified home chefs only</span>
                </div>
                <span>•</span>
                <span>🔒 Secure payments via Razorpay</span>
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
            Developed and Founded by Suman Kumar Kaundinya • <a href="mailto:sumanj241118@gmail.com" className="hover:text-orange-200 transition-colors">sumanj241118@gmail.com</a>
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

export default Home;
