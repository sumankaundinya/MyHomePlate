import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { ChefHat, Heart, ShieldCheck, UtensilsCrossed } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <ChefHat className="h-10 w-10 text-primary" />,
      title: "Local Home Chefs",
      description: "Connect with talented home chefs in your neighborhood cooking authentic Indian dishes",
    },
    {
      icon: <Heart className="h-10 w-10 text-primary" />,
      title: "Homemade with Love",
      description: "Every dish is prepared with care, using traditional recipes and fresh ingredients",
    },
    {
      icon: <ShieldCheck className="h-10 w-10 text-primary" />,
      title: "Safe & Secure",
      description: "Secure payments and transparent platform connecting you directly with chefs",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
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
              Discover delicious homemade Indian dishes from local chefs in your area
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/meals")} className="text-lg shadow-warm">
                <UtensilsCrossed className="mr-2 h-5 w-5" />
                Browse Meals
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/signup")} className="text-lg">
                Become a Chef
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose MyHomePlate?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center shadow-soft hover:shadow-warm transition-shadow">
                <CardHeader>
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-hero text-white shadow-warm max-w-4xl mx-auto">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-3xl md:text-4xl font-bold mb-4">
                Start Your Culinary Journey Today
              </CardTitle>
              <CardDescription className="text-white/90 text-lg">
                Whether you're looking to enjoy authentic homemade food or share your cooking passion
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate("/meals")}
                className="text-lg"
              >
                Order Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/signup")}
                className="text-lg bg-white/10 hover:bg-white/20 text-white border-white/30"
              >
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
            MyHomePlate is a platform connecting home chefs and customers. Each chef is independently responsible for
            food safety and compliance.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
