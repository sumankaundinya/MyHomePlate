import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  ChefHat,
  LogOut,
  ShoppingBag,
  UtensilsCrossed,
  Menu,
  Users,
  CalendarCheck,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setUserRole(session.user.user_metadata?.role || null);
        checkAdminRole(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setUserRole(session.user.user_metadata?.role || null);
        checkAdminRole(session.user.id);
      } else {
        setUserRole(null);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const getUserInitials = () => {
    const name = user?.user_metadata?.name || user?.email || "";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const NavLinks = ({
    mobile = false,
    onClose,
  }: {
    mobile?: boolean;
    onClose?: () => void;
  }) => {
    const linkClass = mobile
      ? "flex items-center space-x-2 px-4 py-3 text-base font-medium hover:bg-accent rounded-lg transition-colors"
      : "text-sm font-medium hover:text-primary transition-colors";

    const handleClick = () => {
      if (onClose) onClose();
    };

    return (
      <>
        <Link to="/meals" className={linkClass} onClick={handleClick}>
          {mobile && <UtensilsCrossed className="h-5 w-5" />}
          <span>Browse Meals</span>
        </Link>
        <Link to="/chefs" className={linkClass} onClick={handleClick}>
          {mobile && <Users className="h-5 w-5" />}
          <span>Our Chefs</span>
        </Link>
        {user && (
          <Link to="/subscriptions" className={linkClass} onClick={handleClick}>
            {mobile && <CalendarCheck className="h-5 w-5" />}
            <span>Subscriptions</span>
          </Link>
        )}
        {user && userRole === "chef" && (
          <Link to="/partner" className={linkClass} onClick={handleClick}>
            {mobile && <ChefHat className="h-5 w-5" />}
            <span>My Kitchen</span>
          </Link>
        )}
        {user && userRole === "customer" && (
          <Link to="/orders" className={linkClass} onClick={handleClick}>
            {mobile && <ShoppingBag className="h-5 w-5" />}
            <span>My Orders</span>
          </Link>
        )}
        {isAdmin && (
          <Link to="/admin" className={linkClass} onClick={handleClick}>
            {mobile && <Shield className="h-5 w-5" />}
            <span>Admin</span>
          </Link>
        )}
      </>
    );
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/favicon.ico"
              alt="MyHomePlate Logo"
              className="h-16 w-12 rounded-full"
            />
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              MyHomePlate
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <NavLinks />
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <div className="flex flex-col space-y-2 mt-6">
                  <NavLinks mobile onClose={() => setMobileOpen(false)} />
                  {!user && (
                    <div className="flex flex-col space-y-2 pt-4 border-t mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigate("/login");
                          setMobileOpen(false);
                        }}
                      >
                        Sign In
                      </Button>
                      <Button
                        onClick={() => {
                          navigate("/signup");
                          setMobileOpen(false);
                        }}
                      >
                        Get Started
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar>
                      <AvatarFallback className="bg-gradient-hero text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.user_metadata?.name || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      {userRole && (
                        <p className="text-xs leading-none text-primary font-medium mt-1">
                          {userRole === "chef" ? "🧑‍🍳 Home Chef" : "👤 Customer"}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userRole === "chef" && (
                    <DropdownMenuItem onClick={() => navigate("/partner")}>
                      <ChefHat className="mr-2 h-4 w-4" />
                      <span>My Kitchen</span>
                    </DropdownMenuItem>
                  )}
                  {userRole === "customer" && (
                    <DropdownMenuItem onClick={() => navigate("/orders")}>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      <span>My Orders</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate("/subscriptions")}>
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    <span>Subscriptions</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/meals")}>
                    <UtensilsCrossed className="mr-2 h-4 w-4" />
                    <span>Browse Meals</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/chefs")}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Our Chefs</span>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" onClick={() => navigate("/login")}>
                  Sign In
                </Button>
                <Button onClick={() => navigate("/signup")}>Get Started</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
