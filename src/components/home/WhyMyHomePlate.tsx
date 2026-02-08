import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ShieldCheck, Wallet, Users } from "lucide-react";

const reasons = [
  {
    icon: <Heart className="h-10 w-10" />,
    title: "100% Home-Cooked",
    description:
      "Every dish is prepared fresh in home kitchens with love and traditional recipes",
    gradient: "from-accent/20 to-accent/5"
  },
  {
    icon: <ShieldCheck className="h-10 w-10" />,
    title: "Verified Home Chefs",
    description:
      "All our chefs are verified for hygiene standards and food safety compliance",
    gradient: "from-success/20 to-success/5"
  },
  {
    icon: <Wallet className="h-10 w-10" />,
    title: "Affordable & Fresh",
    description:
      "Get restaurant-quality homemade food at prices that won't break the bank",
    gradient: "from-primary/20 to-primary/5"
  },
  {
    icon: <Users className="h-10 w-10" />,
    title: "Support Local Families",
    description:
      "Every order supports home chefs and their families in your community",
    gradient: "from-secondary/20 to-secondary/5"
  },
];

const WhyMyHomePlate = () => {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <h2 className="text-h2 mb-4">Why Choose MyHomePlate?</h2>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
            We're more than just food delivery — we're building a community of food lovers and home chefs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason, index) => (
            <Card
              key={index}
              className={`text-center shadow-soft hover:shadow-warm transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-primary/20 group relative overflow-hidden animate-fade-in`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${reason.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
              
              <CardHeader className="relative">
                <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <div className="text-primary group-hover:scale-110 transition-transform">
                    {reason.icon}
                  </div>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {reason.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-muted-foreground leading-relaxed">
                  {reason.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyMyHomePlate;
