import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RatingStars } from "./RatingStars";
import { AvailabilityChip } from "./AvailabilityChip";
import { CheckCircle2, MapPin, UtensilsCrossed, Timer } from "lucide-react";

interface ChefCardProps {
  id: string;
  name: string;
  photo?: string;
  bio?: string;
  specialties: string[];
  rating: number;
  totalReviews: number;
  totalOrders: number;
  isVerified: boolean;
  isFeatured: boolean;
  distance?: number;
  nextAvailableSlot?: "lunch" | "dinner" | "tomorrow";
  prepTime?: string;
}

export const ChefCard = ({
  id,
  name,
  photo,
  bio,
  specialties,
  rating,
  totalReviews,
  totalOrders,
  isVerified,
  isFeatured,
  distance,
  nextAvailableSlot = "tomorrow",
  prepTime = "2-3 hrs"
}: ChefCardProps) => {
  return (
    <Link to={`/chefs/${id}`}>
      <Card className="group hover:shadow-warm transition-all duration-300 h-full border-2 border-transparent hover:border-primary/20 hover:-translate-y-1 overflow-hidden">
        {/* Featured gradient bar */}
        {isFeatured && (
          <div className="h-1.5 bg-gradient-hero" />
        )}
        
        <CardHeader className="space-y-4 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-16 w-16 border-2 border-primary/10 shadow-soft">
                <AvatarImage src={photo} alt={name} />
                <AvatarFallback className="bg-gradient-hero text-white text-xl font-semibold">
                  {name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                    {name}
                  </h3>
                  {isVerified && (
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <RatingStars rating={rating} size="sm" showNumber />
                  <span className="text-xs text-muted-foreground">
                    ({totalReviews})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-0">
          {bio && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {bio}
            </p>
          )}
          
          {/* Specialties */}
          <div className="flex flex-wrap gap-1.5">
            {specialties.slice(0, 3).map((specialty, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
              >
                {specialty}
              </Badge>
            ))}
            {specialties.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{specialties.length - 3}
              </Badge>
            )}
          </div>

          {/* Availability Section */}
          <div className="space-y-2 pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5" />
                Next Available:
              </span>
              <AvailabilityChip type={nextAvailableSlot} />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Preparation time: {prepTime}</span>
            </div>
          </div>

          {/* Footer info */}
          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <UtensilsCrossed className="h-3.5 w-3.5" />
              {totalOrders} orders
            </span>
            {distance !== undefined && (
              <div className="flex items-center gap-1 text-primary">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">{distance.toFixed(1)} km</span>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <Button 
            className="w-full mt-2 shadow-soft group-hover:shadow-warm transition-all"
            size="sm"
          >
            Pre-Order Meal
          </Button>
        </CardContent>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </Card>
    </Link>
  );
};
