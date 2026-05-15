import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Home, UtensilsCrossed, ChefHat, CalendarCheck, UserCircle } from "lucide-react";

const HIDDEN_PATHS = [
  "/chef/dashboard",
  "/partner",
  "/admin",
  "/login",
  "/signup",
];

export const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Hide on admin / chef / auth pages
  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null;

  const links = [
    { to: "/home",          icon: Home,            label: "Home"      },
    { to: "/meals",         icon: UtensilsCrossed, label: "Meals"     },
    { to: "/chefs",         icon: ChefHat,         label: "Chefs"     },
    { to: "/subscriptions", icon: CalendarCheck,   label: "Subscribe" },
    { to: isLoggedIn ? "/orders" : "/login",
                            icon: UserCircle,      label: isLoggedIn ? "Orders" : "Sign In" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur border-t border-border safe-bottom">
      <div className="grid grid-cols-5 h-16">
        {links.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || (to !== "/home" && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-transform ${active ? "scale-110" : ""}`}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
