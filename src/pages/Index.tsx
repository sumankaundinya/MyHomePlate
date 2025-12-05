import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import SEOHead from "@/components/SEOHead";
import PopularMeals from "@/components/home/PopularMeals";
import MeetChefs from "@/components/home/MeetChefs";
import HowItWorks from "@/components/home/HowItWorks";
import WhyMyHomePlate from "@/components/home/WhyMyHomePlate";
import { ChefHat, UtensilsCrossed } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="MyHomePlate - Authentic Indian Home Cooking"
        description="Discover delicious homemade Indian dishes from local chefs in your area. Order authentic home-cooked meals or become a home chef on MyHomePlate."
      />
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
              Authentic Indian Home Cooking
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Discover delicious homemade Indian dishes from local chefs in your
              area
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/meals")}
                className="text-lg shadow-warm"
              >
                <UtensilsCrossed className="mr-2 h-5 w-5" />
                Browse Meals
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/signup")}
                className="text-lg"
              >
                <ChefHat className="mr-2 h-5 w-5" />
                Become a Home Chef
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Meals Section */}
      <PopularMeals />

      {/* Meet Our Chefs Section */}
      <MeetChefs />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Why MyHomePlate Section */}
      <WhyMyHomePlate />

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-hero text-primary-foreground shadow-warm max-w-4xl mx-auto border-none">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-3xl md:text-4xl font-bold mb-4">
                Start Your Culinary Journey Today
              </CardTitle>
              <CardDescription className="text-primary-foreground/90 text-lg">
                Whether you're looking to enjoy authentic homemade food or share
                your cooking passion
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate("/meals")}
                className="text-lg"
              >
                <UtensilsCrossed className="mr-2 h-5 w-5" />
                Order Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/signup")}
                className="text-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30"
              >
                <ChefHat className="mr-2 h-5 w-5" />
                Become a Chef
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-card">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 MyHomePlate. All rights reserved.</p>
          <p className="mt-2">
            Designed and owned by{" "}
            <span className="font-medium text-foreground">
              Suman Kumar Kaundinya Jujjuru (sumanj241118@gmail.com)
            </span>
          </p>
          <p className="mt-2">
            MyHomePlate is a platform connecting home chefs and customers. Each
            chef is independently responsible for food safety and compliance.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
