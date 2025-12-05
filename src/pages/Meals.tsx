import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import SEOHead from "@/components/SEOHead";
import AuthModal from "@/components/AuthModal";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

interface Meal {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string;
  available: boolean;
  chef_name: string;
}

const Meals = () => {
  const navigate = useNavigate();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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
        .select("*")
        .eq("available", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mealsWithChefName = await Promise.all(
        (data || []).map(async (meal: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", meal.chef_id)
            .single();

          return {
            ...meal,
            chef_name: profile?.name || "Unknown Chef",
          };
        })
      );

      setMeals(mealsWithChefName);
    } catch (error) {
      console.error("Error fetching meals:", error);
      toast.error("Failed to load meals");
    } finally {
      setLoading(false);
    }
  };

  const filteredMeals = meals.filter(
    (meal) =>
      meal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOrderClick = (e: React.MouseEvent, mealId: string) => {
    e.stopPropagation();
    if (!user) {
      setShowAuthModal(true);
    } else {
      navigate(`/meals/${mealId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Browse Homemade Meals - MyHomePlate"
        description="Explore authentic Indian home-cooked dishes from verified local chefs. Order fresh, delicious homemade meals delivered to your doorstep."
      />
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Discover Homemade Dishes</h1>
          <p className="text-muted-foreground">
            Authentic Indian cuisine from local home chefs
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for dishes, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Meals Grid */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <UtensilsCrossed className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">
                Loading delicious meals...
              </p>
            </div>
          </div>
        ) : filteredMeals.length === 0 ? (
          <div className="text-center py-12">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No meals found</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try a different search"
                : "Check back soon for new dishes!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMeals.map((meal) => (
              <Card
                key={meal.id}
                className="overflow-hidden hover:shadow-warm transition-shadow cursor-pointer group"
                onClick={() => navigate(`/meals/${meal.id}`)}
              >
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {meal.image_url ? (
                    <img
                      src={meal.image_url}
                      alt={meal.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <UtensilsCrossed className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {meal.title}
                    </CardTitle>
                    <Badge variant="secondary">{meal.category}</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {meal.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    by {meal.chef_name}
                  </p>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-primary">
                    ₹{meal.price}
                  </p>
                  <Button
                    variant="default"
                    onClick={(e) => handleOrderClick(e, meal.id)}
                  >
                    Order Now
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
};

export default Meals;
