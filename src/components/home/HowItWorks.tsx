import { Search, Calendar, ChefHat, Truck } from "lucide-react";

const steps = [
  {
    icon: <Search className="h-8 w-8" />,
    number: "1",
    title: "Browse Home-Made Dishes",
    description: "Explore authentic meals from verified home chefs near you",
  },
  {
    icon: <Calendar className="h-8 w-8" />,
    number: "2",
    title: "Choose Meal & Schedule",
    description: "Pre-order for today's lunch/dinner or schedule for tomorrow",
  },
  {
    icon: <ChefHat className="h-8 w-8" />,
    number: "3",
    title: "Chef Prepares Fresh",
    description: "Your meal is cooked fresh in a real home kitchen with love",
  },
  {
    icon: <Truck className="h-8 w-8" />,
    number: "4",
    title: "Delivery or Pickup",
    description: "Get your hot, fresh homemade meal delivered to your door",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-gradient-warm relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <h2 className="text-h2 mb-4">How It Works</h2>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
            Getting delicious homemade food is simple with MyHomePlate
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6 relative">
          {/* Connection lines for desktop */}
          <div className="hidden lg:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="relative group animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Step card */}
              <div className="text-center relative z-10">
                {/* Number badge */}
                <div className="relative mx-auto mb-6 w-20 h-20">
                  <div className="absolute inset-0 bg-gradient-hero rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-hero flex items-center justify-center text-white shadow-warm group-hover:scale-110 transition-all duration-300">
                    {step.icon}
                  </div>
                  {/* Step number */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white border-2 border-primary shadow-soft flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{step.number}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Mobile connector */}
              {index < steps.length - 1 && (
                <div className="lg:hidden flex justify-center my-6">
                  <div className="w-0.5 h-8 bg-gradient-to-b from-primary/50 to-primary/20" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA hint */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            🕒 <span className="font-semibold">Note:</span> Pre-order required for freshly prepared meals
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
