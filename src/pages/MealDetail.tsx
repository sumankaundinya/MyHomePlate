import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ChefHat, Loader2, ShoppingCart, UtensilsCrossed } from "lucide-react";
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
  chef_id: string;
  chef_name: string;
}

const MealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    fetchMeal();

    return () => subscription.unsubscribe();
  }, [id]);

  const fetchMeal = async () => {
    try {
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Fetch chef name separately
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", data.chef_id)
        .single();

      setMeal({
        ...data,
        chef_name: profile?.name || "Unknown Chef",
      });
    } catch (error) {
      console.error("Error fetching meal:", error);
      toast.error("Failed to load meal details");
      navigate("/meals");
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!user) {
      toast.error("Please sign in to place an order");
      navigate("/login");
      return;
    }

    if (!meal) return;

    setOrdering(true);

    try {
      const totalPrice = meal.price * quantity;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          meal_id: meal.id,
          customer_id: user.id,
          chef_id: meal.chef_id,
          quantity,
          total_price: totalPrice,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      toast.success("Order placed! Redirecting to payment...");
      
      // TODO: Integrate with Stripe checkout here
      setTimeout(() => {
        navigate("/orders");
      }, 1500);
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Meal not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/meals")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Meals
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
            {meal.image_url ? (
              <img
                src={meal.image_url}
                alt={meal.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <UtensilsCrossed className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-4xl font-bold">{meal.title}</h1>
                <Badge variant="secondary" className="text-sm">
                  {meal.category}
                </Badge>
              </div>
              <div className="flex items-center text-muted-foreground mb-4">
                <ChefHat className="h-4 w-4 mr-2" />
                <span>by {meal.chef_name}</span>
              </div>
              <p className="text-3xl font-bold text-primary mb-6">kr {meal.price}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground leading-relaxed">{meal.description}</p>
            </div>

            {meal.available ? (
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Place Your Order</CardTitle>
                  <CardDescription>Select quantity and confirm</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max="10"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      kr {(meal.price * quantity).toFixed(2)}
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleOrder}
                    disabled={ordering || !meal.available}
                  >
                    {ordering ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Order Now
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    This meal is currently unavailable
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealDetail;