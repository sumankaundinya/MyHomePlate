import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

export const PlatformComparison = () => {
  const features = [
    {
      feature: "Commission from Chefs",
      myHomePlate: "0%*",
      competitors: "20-30%",
      highlight: true
    },
    {
      feature: "Food Preparation",
      myHomePlate: "Real Home Kitchens",
      competitors: "Restaurants & Cloud Kitchens"
    },
    {
      feature: "Order Model",
      myHomePlate: "Pre-Order (Fresh)",
      competitors: "Instant (Pre-cooked)"
    },
    {
      feature: "Support Local Families",
      myHomePlate: true,
      competitors: false
    },
    {
      feature: "Authentic Home Taste",
      myHomePlate: true,
      competitors: false
    }
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="bg-gradient-hero text-white mb-4 px-4 py-1.5">
            Why We're Different
          </Badge>
          <h2 className="text-h2 mb-4">
            MyHomePlate vs. Traditional Platforms
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We're not just another food delivery app. We're building a community that empowers home chefs.
          </p>
        </div>

        <Card className="max-w-4xl mx-auto overflow-hidden shadow-elevated border-2 border-primary/10">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-warm border-b-2 border-primary/20">
                  <th className="text-left p-4 md:p-6 font-bold text-foreground">Feature</th>
                  <th className="text-center p-4 md:p-6">
                    <div className="flex flex-col items-center gap-2">
                      <span className="font-bold text-primary text-lg">MyHomePlate</span>
                      <Badge className="bg-gradient-hero text-white text-xs">Our Platform</Badge>
                    </div>
                  </th>
                  <th className="text-center p-4 md:p-6 text-muted-foreground font-semibold">
                    Swiggy / Zomato / Others
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((item, index) => (
                  <tr 
                    key={index} 
                    className={`border-b last:border-b-0 transition-colors hover:bg-primary/5 ${
                      item.highlight ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="p-4 md:p-6 font-medium">
                      {item.feature}
                      {item.highlight && (
                        <Badge variant="outline" className="ml-2 text-xs bg-primary/10 text-primary border-primary/20">
                          Best Value
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 md:p-6 text-center">
                      {typeof item.myHomePlate === 'boolean' ? (
                        item.myHomePlate ? (
                          <div className="flex justify-center">
                            <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                              <Check className="h-5 w-5 text-success" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                              <X className="h-5 w-5 text-destructive" />
                            </div>
                          </div>
                        )
                      ) : (
                        <span className="font-semibold text-primary">{item.myHomePlate}</span>
                      )}
                    </td>
                    <td className="p-4 md:p-6 text-center text-muted-foreground">
                      {typeof item.competitors === 'boolean' ? (
                        item.competitors ? (
                          <div className="flex justify-center">
                            <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                              <Check className="h-5 w-5 text-success" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <X className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </div>
                        )
                      ) : (
                        <span>{item.competitors}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-gradient-warm text-center border-t">
            <p className="text-sm text-muted-foreground">
              * Limited time offer. Standard payment processing fees apply.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
};
