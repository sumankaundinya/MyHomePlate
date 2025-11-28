import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { RatingStars } from "./RatingStars";
import { format } from "date-fns";

interface ReviewCardProps {
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment?: string;
  photoUrl?: string;
  createdAt: string;
}

export const ReviewCard = ({
  customerName,
  customerAvatar,
  rating,
  comment,
  photoUrl,
  createdAt
}: ReviewCardProps) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={customerAvatar} alt={customerName} />
              <AvatarFallback className="bg-gradient-hero text-white">
                {customerName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{customerName}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(createdAt), "MMM dd, yyyy")}
              </p>
            </div>
          </div>
          <RatingStars rating={rating} size="sm" />
        </div>
        {comment && (
          <p className="text-sm text-muted-foreground">{comment}</p>
        )}
        {photoUrl && (
          <img 
            src={photoUrl} 
            alt="Review" 
            className="w-full h-48 object-cover rounded-md"
          />
        )}
      </CardContent>
    </Card>
  );
};
