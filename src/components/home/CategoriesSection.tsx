import { useNavigate } from "react-router-dom";
import { CategoryCard } from "@/components/CategoryCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Utensils, UtensilsCrossed, Calendar, PartyPopper, Coffee, CalendarRange } from "lucide-react";

const categories = [
  {
    icon: <Utensils className="h-7 w-7" />,
    title: "Home Lunch (Today)",
    subtitle: "Fresh home-cooked lunch delivered by 12-2 PM",
    isAvailableNow: true,
    nextAvailableTime: "Available until 11:30 AM",
    path: "/meals?category=lunch&when=today"
  },
  {
    icon: <UtensilsCrossed className="h-7 w-7" />,
    title: "Home Dinner (Today)",
    subtitle: "Authentic dinner meals ready by 6-8 PM",
    isAvailableNow: true,
    nextAvailableTime: "Available until 4:30 PM",
    path: "/meals?category=dinner&when=today"
  },
  {
    icon: <Calendar className="h-7 w-7" />,
    title: "Pre-Order for Tomorrow",
    subtitle: "Schedule your meals in advance",
    isPreOrder: true,
    nextAvailableTime: "Order anytime today",
    path: "/meals?when=tomorrow"
  },
  {
    icon: <PartyPopper className="h-7 w-7" />,
    title: "Party & Bulk Orders",
    subtitle: "Large orders for events, parties, and gatherings",
    isPreOrder: true,
    nextAvailableTime: "Minimum 24 hrs notice",
    path: "/meals?type=bulk"
  },
  {
    icon: <Coffee className="h-7 w-7" />,
    title: "Breakfast & Tiffin",
    subtitle: "Daily breakfast and tiffin services",
    isPreOrder: true,
    nextAvailableTime: "Book by 8 PM for next day",
    path: "/meals?category=breakfast"
  },
  {
    icon: <CalendarRange className="h-7 w-7" />,
    title: "Monthly Meal Plans",
    subtitle: "Subscribe to regular home-cooked meals",
    isPreOrder: true,
    nextAvailableTime: "Flexible plans available",
    path: "/subscriptions"
  }
];

const CategoriesSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-h2 mb-3">What Would You Like to Order?</h2>
          <p className="text-muted-foreground text-lg">
            All meals require pre-ordering to ensure freshness and quality
          </p>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <ScrollArea className="w-full whitespace-nowrap lg:whitespace-normal">
          <div className="flex lg:grid lg:grid-cols-3 gap-4 pb-4 snap-x snap-mandatory lg:snap-none">
            {categories.map((category, index) => (
              <CategoryCard
                key={index}
                icon={category.icon}
                title={category.title}
                subtitle={category.subtitle}
                isAvailableNow={category.isAvailableNow}
                isPreOrder={category.isPreOrder}
                nextAvailableTime={category.nextAvailableTime}
                onClick={() => navigate(category.path)}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` } as any}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="lg:hidden" />
        </ScrollArea>
      </div>
    </section>
  );
};

export default CategoriesSection;
