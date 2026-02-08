import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UtensilsCrossed, MapPin } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import type { User } from "@supabase/supabase-js";

interface Meal {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  category: string;
  chef_name: string;
}

const PopularMeals = () => {
  const navigate = useNavigate();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    fetchMeals();

    return () => subscription.unsubscribe();
  }, []);

  const fetchMeals = async () => {
    try {
      const { data, error } = await supabase
        .from("meals")
        .select("id, title, price, image_url, category, chef_id")
        .eq("available", true)
        .limit(8);

      if (error) throw error;

      const mealsWithChefName = await Promise.all(
        (data || []).map(async (meal) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", meal.chef_id)
            .maybeSingle();

          return {
            ...meal,
            chef_name: profile?.name || "Home Chef",
          };
        })
      );

      setMeals(mealsWithChefName);
    } catch (error) {
      console.error("Error fetching popular meals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = (e: React.MouseEvent, mealId: string) => {
    e.stopPropagation();
    if (!user) {
      setShowAuthModal(true);
    } else {
      navigate(`/meals/${mealId}`);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="h-6 w-6 text-primary" />
            <h2 className="text-h2 text-center">Popular in Your Area</h2>
          </div>
          <p className="text-muted-foreground text-center mb-12 text-lg">
            Homemade favorites from chefs near you
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <Skeleton className="aspect-video skeleton-shimmer" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 skeleton-shimmer" />
                  <Skeleton className="h-4 w-1/2 skeleton-shimmer" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/3 skeleton-shimmer" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (meals.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <MapPin className="h-6 w-6 text-primary" />
          <h2 className="text-h2 text-center">Popular in Your Area</h2>
        </div>
        <p className="text-muted-foreground text-center mb-12 text-lg">
          Discover the most-loved homemade meals from chefs near you
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {meals.map((meal, index) => (
            <Card
              key={meal.id}
              className="overflow-hidden hover:shadow-warm transition-all duration-300 cursor-pointer group border-2 border-transparent hover:border-primary/20 hover:-translate-y-1 animate-fade-in"
              onClick={() => navigate(`/meals/${meal.id}`)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="aspect-video bg-muted relative overflow-hidden">
                {meal.image_url ? (
                  <img
                    src={meal.image_url}
                    alt={meal.title}
                    loading="lazy"
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-card">
                    <UtensilsCrossed className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <Badge className="absolute top-3 right-3 bg-white/95 text-foreground border shadow-soft">
                  {meal.category}
                </Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-1">
                  {meal.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <UtensilsCrossed className="h-3.5 w-3.5" />
                  by {meal.chef_name}
                </p>
              </CardContent>
              <CardFooter className="flex items-center justify-between pt-0 gap-3">
                <p className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  ₹{meal.price}
                </p>
                <Button 
                  size="sm" 
                  onClick={(e) => handleOrderClick(e, meal.id)}
                  className="shadow-soft hover:shadow-warm transition-all"
                >
                  Pre-Order
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/meals")}
            className="border-2 border-primary text-foreground hover:bg-primary hover:text-white font-semibold transition-all"
          >
            View All Meals
          </Button>
        </div>
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </section>
  );
};

export default PopularMeals;
