import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { RatingStars } from "@/components/RatingStars";
import { ReviewCard } from "@/components/ReviewCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle2, ChefHat, Award, ShoppingBag, ArrowLeft, Calendar } from "lucide-react";

declare global {
  interface Window { Razorpay: any; }
}

interface ChefData {
  id: string;
  user_id: string;
  bio: string | null;
  kitchen_photo_url: string | null;
  avg_rating: number;
  total_reviews: number;
  total_orders: number;
  hygiene_certificate: boolean;
  fssai_license: boolean;
  profiles: {
    name: string;
  };
  chef_specialties: {
    specialty: string;
  }[];
}

interface Meal {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string;
  available: boolean;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  photo_url: string | null;
  created_at: string;
  profiles: {
    name: string;
  };
}

const ChefProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chef, setChef] = useState<ChefData | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"weekly" | "monthly">("weekly");

  const PLANS = {
    weekly:  { label: "Weekly",  meals: 5,  days: 7,  price: 625,  pricePerMeal: 125 },
    monthly: { label: "Monthly", meals: 20, days: 30, price: 2150, pricePerMeal: 107 },
  };

  const handleSubscribe = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please sign in to subscribe"); navigate("/login"); return; }
    if (!chef) return;

    const plan = PLANS[selectedPlan];
    setSubscribing(true);

    try {
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey || !window.Razorpay) {
        toast.error("Payment not configured");
        return;
      }

      // Create Razorpay order via Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-razorpay-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ amount: plan.price, currency: "INR", receipt: `sub_${Date.now()}` }),
        }
      );
      const rzpOrder = await res.json();
      if (!res.ok || !rzpOrder.order_id) throw new Error(rzpOrder.error || "Payment setup failed");

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.days);

      const options = {
        key: razorpayKey,
        amount: rzpOrder.amount,
        currency: "INR",
        name: "MyHomePlate",
        description: `${plan.label} Tiffin Subscription — ${chef.profiles?.name}`,
        order_id: rzpOrder.order_id,
        prefill: { email: user.email },
        theme: { color: "#0f766e" },
        handler: async (response: { razorpay_payment_id: string }) => {
          // Create subscription record
          const { error } = await supabase.from("subscriptions").insert({
            customer_id: user.id,
            chef_id: chef.id,
            plan_type: selectedPlan,
            meals_count: plan.meals,
            meals_remaining: plan.meals,
            price_per_meal: plan.pricePerMeal,
            total_price: plan.price,
            start_date: startDate.toISOString().split("T")[0],
            end_date: endDate.toISOString().split("T")[0],
            status: "active",
          });
          if (error) { toast.error("Payment succeeded but subscription save failed: " + error.message); return; }
          toast.success(`🎉 Subscribed to ${chef.profiles?.name}'s ${plan.label} plan!`);
          setSubDialogOpen(false);
          navigate("/subscriptions");
        },
        modal: {
          ondismiss: () => { setSubscribing(false); },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || "Failed to start subscription");
      setSubscribing(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchChefData();
    }
  }, [id]);

  const fetchChefData = async () => {
    try {
      setLoading(true);

      // Fetch chef profile
      const { data: chefData, error: chefError } = await supabase
        .from("chefs")
        .select("*, chef_specialties (specialty)")
        .eq("id", id)
        .single();

      if (chefError) throw chefError;
      
      // Fetch chef name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", chefData.user_id)
        .single();

      setChef({
        ...chefData,
        profiles: profileData || { name: "Chef" }
      } as any);

      // Fetch chef's meals
      const { data: mealsData, error: mealsError } = await supabase
        .from("meals")
        .select("*")
        .eq("chef_id", chefData.user_id)
        .eq("available", true);

      if (mealsError) throw mealsError;
      setMeals(mealsData || []);

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .eq("chef_id", id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (reviewsError) throw reviewsError;
      
      // Fetch customer names for reviews
      const reviewsWithProfiles = await Promise.all(
        (reviewsData || []).map(async (review) => {
          const { data: customerProfile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", review.customer_id)
            .single();
          
          return {
            ...review,
            profiles: customerProfile || { name: "Customer" }
          };
        })
      );

      setReviews(reviewsWithProfiles as any);

    } catch (error) {
      console.error("Error fetching chef data:", error);
      toast.error("Failed to load chef profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <ChefHat className="h-12 w-12 text-primary animate-pulse" />
        </div>
      </div>
    );
  }

  if (!chef) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Chef not found</h2>
          <Button onClick={() => navigate("/chefs")}>View All Chefs</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/chefs")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Chefs
        </Button>

        {/* Chef Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-32 w-32">
                <AvatarImage src={chef.kitchen_photo_url || undefined} alt={chef.profiles?.name} />
                <AvatarFallback className="bg-gradient-hero text-white text-4xl">
                  {chef.profiles?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold">{chef.profiles?.name}</h1>
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <RatingStars rating={chef.avg_rating} showNumber />
                    <span className="text-sm text-muted-foreground">
                      {chef.total_reviews} reviews
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {chef.total_orders} orders completed
                    </span>
                  </div>
                </div>

                {chef.bio && (
                  <p className="text-muted-foreground">{chef.bio}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  {chef.chef_specialties.map((s, idx) => (
                    <Badge key={idx} variant="secondary">{s.specialty}</Badge>
                  ))}
                </div>

                {/* Subscribe Button */}
                <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full md:w-auto" variant="default">
                      <Calendar className="h-4 w-4 mr-2" />
                      Subscribe for Daily Tiffin
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] sm:w-auto max-w-md">
                    <DialogHeader>
                      <DialogTitle>Choose a Subscription Plan</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                      <p className="text-sm text-muted-foreground">
                        Get daily home-cooked meals from <strong>{chef.profiles?.name}</strong>
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {(Object.entries(PLANS) as ["weekly" | "monthly", typeof PLANS.weekly][]).map(([key, plan]) => (
                          <button
                            key={key}
                            onClick={() => setSelectedPlan(key)}
                            className={`border-2 rounded-xl p-4 text-left transition-all ${
                              selectedPlan === key
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            <p className="font-bold text-lg">{plan.label}</p>
                            <p className="text-sm text-muted-foreground">{plan.meals} meals</p>
                            <p className="text-xl font-bold text-primary mt-2">₹{plan.price}</p>
                            <p className="text-xs text-muted-foreground">₹{plan.pricePerMeal}/meal</p>
                          </button>
                        ))}
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>✓ Fresh home-cooked meals daily</li>
                        <li>✓ Cancel anytime</li>
                        <li>✓ Secure payment via Razorpay</li>
                      </ul>
                      <Button
                        className="w-full"
                        onClick={handleSubscribe}
                        disabled={subscribing}
                      >
                        {subscribing ? "Processing…" : `Pay ₹${PLANS[selectedPlan].price} & Subscribe`}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Hygiene Checklist */}
                <div className="flex gap-4">
                  {chef.hygiene_certificate && (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Hygiene Certified
                    </Badge>
                  )}
                  {chef.fssai_license && (
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                      <Award className="h-3 w-3 mr-1" />
                      FSSAI Licensed
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meals Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Available Dishes</h2>
          {meals.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No dishes available at the moment
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meals.map((meal) => (
                <Link key={meal.id} to={`/meals/${meal.id}`}>
                  <Card className="hover:shadow-warm transition-shadow h-full">
                    {meal.image_url && (
                      <img 
                        src={meal.image_url} 
                        alt={meal.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    )}
                    <CardContent className="pt-4">
                      <h3 className="font-semibold mb-1">{meal.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {meal.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">
                          ₹{meal.price}
                        </span>
                        <Badge variant="outline">{meal.category}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <Separator className="my-8" />

        {/* Reviews Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No reviews yet
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  customerName={review.profiles?.name || "Customer"}
                  rating={review.rating}
                  comment={review.comment || undefined}
                  photoUrl={review.photo_url || undefined}
                  createdAt={review.created_at}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ChefProfile;
