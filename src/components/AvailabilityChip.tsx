import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvailabilityChipProps {
  type: "lunch" | "dinner" | "tomorrow" | "preorder" | "preparation";
  time?: string;
  prepTime?: string;
  className?: string;
}

export const AvailabilityChip = ({
  type,
  time,
  prepTime,
  className
}: AvailabilityChipProps) => {
  const configs = {
    lunch: {
      icon: <Clock className="h-3 w-3" />,
      label: time || "Lunch Today",
      variant: "default" as const,
      className: "bg-success text-white border-success"
    },
    dinner: {
      icon: <Clock className="h-3 w-3" />,
      label: time || "Dinner Today",
      variant: "default" as const,
      className: "bg-primary text-white border-primary"
    },
    tomorrow: {
      icon: <Calendar className="h-3 w-3" />,
      label: time || "Tomorrow",
      variant: "secondary" as const,
      className: "bg-secondary/10 text-secondary border-secondary/20"
    },
    preorder: {
      icon: <Calendar className="h-3 w-3" />,
      label: "Pre-Order Required",
      variant: "outline" as const,
      className: "bg-warning/10 text-warning border-warning/30"
    },
    preparation: {
      icon: <Timer className="h-3 w-3" />,
      label: prepTime || "2-3 hrs prep",
      variant: "outline" as const,
      className: "bg-muted text-muted-foreground"
    }
  };

  const config = configs[type];

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        config.className,
        className
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
};
