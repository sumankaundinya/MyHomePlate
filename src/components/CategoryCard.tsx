import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  isAvailableNow?: boolean;
  nextAvailableTime?: string;
  isPreOrder?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const CategoryCard = ({
  icon,
  title,
  subtitle,
  isAvailableNow = false,
  nextAvailableTime,
  isPreOrder = false,
  onClick,
  className,
  style
}: CategoryCardProps) => {
  return (
    <Card
      onClick={onClick}
      style={style}
      className={cn(
        "relative overflow-hidden cursor-pointer group hover:shadow-warm transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-primary/20 min-w-[280px] snap-start",
        className
      )}
    >
      <div className="p-6">
        {/* Badge */}
        <div className="absolute top-4 right-4">
          {isAvailableNow ? (
            <Badge className="bg-success text-white shadow-soft animate-pulse">
              <TrendingUp className="h-3 w-3 mr-1" />
              Available Now
            </Badge>
          ) : isPreOrder ? (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              <Calendar className="h-3 w-3 mr-1" />
              Pre-Order
            </Badge>
          ) : null}
        </div>

        {/* Icon */}
        <div className="mb-4 w-16 h-16 rounded-2xl bg-gradient-hero flex items-center justify-center text-white shadow-warm group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {subtitle}
        </p>

        {/* Availability info */}
        {nextAvailableTime && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3 pt-3 border-t">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-medium">{nextAvailableTime}</span>
          </div>
        )}
      </div>

      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </Card>
  );
};
