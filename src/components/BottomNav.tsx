import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Search, Calendar, User } from "lucide-react";

interface BottomNavProps {
  active?: "home" | "browse" | "orders" | "profile";
}

export const BottomNav = ({ active = "home" }: BottomNavProps) => {
  const navItems = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      path: "/"
    },
    {
      id: "browse",
      label: "Browse",
      icon: Search,
      path: "/meals"
    },
    {
      id: "orders",
      label: "Orders",
      icon: Calendar,
      path: "/orders"
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      path: "/login"
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-elevated z-50 md:hidden safe-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all thumb-zone flex-1",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              )}
            >
              <Icon className={cn("h-6 w-6", isActive && "scale-110")} />
              <span className={cn("text-xs font-medium", isActive && "font-semibold")}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
