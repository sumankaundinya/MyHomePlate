import { Search, ChefHat, CreditCard, Utensils } from "lucide-react";

const steps = [
  {
    icon: <Search className="h-8 w-8" />,
    title: "Browse Meals",
    description:
      "Explore authentic homemade dishes from local chefs in your area",
  },
  {
    icon: <ChefHat className="h-8 w-8" />,
    title: "Choose Your Chef",
    description: "Find a home chef whose cooking style matches your taste",
  },
  {
    icon: <CreditCard className="h-8 w-8" />,
    title: "Order Securely",
    description: "Pay safely with PhonePe, Google Pay, PayTM or cards",
  },
  {
    icon: <Utensils className="h-8 w-8" />,
    title: "Enjoy Your Meal",
    description: "Fresh homemade food delivered right to your doorstep",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          How It Works
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Getting delicious homemade food is simple with MyHomePlate
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center group">
              {/* Step number */}
              <div className="relative mx-auto mb-6">
                <div
                  className="
  w-20 h-20 rounded-full 
  bg-gradient-to-br from-primary to-accent 
  flex items-center justify-center 
  text-primary-foreground shadow-warm 
  group-hover:scale-110 transition-transform
  
  translate-x-36        /* mobile */
  md:translate-x-32   /* tablet */
  lg:translate-x-24    /* laptop/desktop */
"
                >
                  {step.icon}
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
