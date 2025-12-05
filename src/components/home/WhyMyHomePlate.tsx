import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ShieldCheck, Wallet, Users } from "lucide-react";

const reasons = [
  {
    icon: <Heart className="h-10 w-10 text-primary" />,
    title: "100% Home-Cooked",
    description:
      "Every dish is prepared fresh in home kitchens with love and traditional recipes",
  },
  {
    icon: <ShieldCheck className="h-10 w-10 text-secondary" />,
    title: "Verified Home Chefs",
    description:
      "All our chefs are verified for hygiene standards and food safety compliance",
  },
  {
    icon: <Wallet className="h-10 w-10 text-accent" />,
    title: "Affordable & Fresh",
    description:
      "Get restaurant-quality homemade food at prices that won't break the bank",
  },
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: "Support Local Families",
    description:
      "Every order supports home chefs and their families in your community",
  },
];

const WhyMyHomePlate = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Why MyHomePlate?
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          We're more than just food delivery — we're building a community of
          food lovers
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason, index) => (
            <Card
              key={index}
              className="text-center shadow-soft hover:shadow-warm transition-all hover:-translate-y-1 border-none bg-card"
            >
              <CardHeader>
                <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  {reason.icon}
                </div>
                <CardTitle className="text-xl">{reason.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{reason.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyMyHomePlate;
