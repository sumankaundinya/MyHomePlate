import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShieldCheck, Award, Percent } from "lucide-react";

export const TrustBanner = () => {
  return (
    <section className="py-8 bg-gradient-warm">
      <div className="container mx-auto px-4">
        {/* Main trust message */}
        <Card className="bg-white/80 backdrop-blur-sm border-primary/20 shadow-soft">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-hero flex items-center justify-center text-white shadow-warm flex-shrink-0">
                  <Heart className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-1">
                    Meals Made with Love in Real Home Kitchens
                  </h3>
                  <p className="text-muted-foreground">
                    No factories. No shortcuts. Support local home chefs in your community.
                  </p>
                </div>
              </div>
              <Badge className="bg-gradient-hero text-white px-4 py-2 text-sm font-semibold shadow-warm whitespace-nowrap">
                <Percent className="h-4 w-4 mr-1.5" />
                0% Commission*
              </Badge>
            </div>
          </div>
        </Card>

        {/* Trust indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <ShieldCheck className="h-8 w-8 text-success flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Verified Home Chefs</p>
              <p className="text-xs text-muted-foreground">FSSAI & Hygiene Certified</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <Award className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Quality Assured</p>
              <p className="text-xs text-muted-foreground">Freshly Prepared Daily</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <Heart className="h-8 w-8 text-accent flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Support Local</p>
              <p className="text-xs text-muted-foreground">Empower Home Entrepreneurs</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          * Limited time offer. Standard processing fees apply.
        </p>
      </div>
    </section>
  );
};
