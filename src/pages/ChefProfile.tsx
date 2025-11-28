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
import { toast } from "sonner";
import { CheckCircle2, ChefHat, Award, ShoppingBag, ArrowLeft } from "lucide-react";

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
