import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RatingStars } from "./RatingStars";
import { CheckCircle2, MapPin } from "lucide-react";

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
  distance
}: ChefCardProps) => {
  return (
    <Link to={`/chefs/${id}`}>
      <Card className="hover:shadow-warm transition-shadow h-full">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-16 w-16">
                <AvatarImage src={photo} alt={name} />
                <AvatarFallback className="bg-gradient-hero text-white text-lg">
                  {name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{name}</h3>
                  {isVerified && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <RatingStars rating={rating} size="sm" showNumber />
                  <span className="text-xs text-muted-foreground">
                    ({totalReviews} reviews)
                  </span>
                </div>
              </div>
            </div>
            {isFeatured && (
              <Badge className="bg-gradient-hero">Featured</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {bio && (
            <p className="text-sm text-muted-foreground line-clamp-2">{bio}</p>
          )}
          <div className="flex flex-wrap gap-1">
            {specialties.slice(0, 3).map((specialty, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {specialty}
              </Badge>
            ))}
            {specialties.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{specialties.length - 3} more
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">
              {totalOrders} orders completed
            </span>
            {distance !== undefined && (
              <div className="flex items-center gap-1 text-primary">
                <MapPin className="h-3 w-3" />
                <span className="font-medium">{distance.toFixed(1)} km</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
