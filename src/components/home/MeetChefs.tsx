import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Star, ChefHat, CheckCircle2, UtensilsCrossed } from "lucide-react";

interface Chef {
  id: string;
  user_id: string;
  name: string;
  bio: string | null;
  avg_rating: number | null;
  total_orders: number | null;
  verification_status: string | null;
  signature_dish: string | null;
}

const MeetChefs = () => {
  const navigate = useNavigate();
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChefs();
  }, []);

  const fetchChefs = async () => {
    try {
      const { data: chefsData, error } = await supabase
        .from("chefs")
        .select("id, user_id, bio, avg_rating, total_orders, verification_status")
        .eq("verification_status", "approved")
        .order("is_featured", { ascending: false })
        .order("avg_rating", { ascending: false })
        .limit(10);

      if (error) throw error;

      const chefsWithDetails = await Promise.all(
        (chefsData || []).map(async (chef) => {
          // Get chef name
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", chef.user_id)
            .maybeSingle();

          // Get signature dish (first meal)
          const { data: meal } = await supabase
            .from("meals")
            .select("title")
            .eq("chef_id", chef.user_id)
            .eq("available", true)
            .limit(1)
            .maybeSingle();

          return {
            ...chef,
            name: profile?.name || "Home Chef",
            signature_dish: meal?.title || null,
          };
        })
      );

      setChefs(chefsWithDetails);
    } catch (error) {
      console.error("Error fetching chefs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Meet Our Home Chefs</h2>
          <p className="text-muted-foreground text-center mb-12">Talented cooks bringing homemade goodness to your table</p>
          <div className="flex gap-6 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="min-w-[280px]">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (chefs.length === 0) return null;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <ChefHat className="h-6 w-6 text-primary" />
          <h2 className="text-3xl md:text-4xl font-bold text-center">Meet Our Home Chefs</h2>
        </div>
        <p className="text-muted-foreground text-center mb-12">Talented cooks bringing homemade goodness to your table</p>

        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-6 pb-4">
            {chefs.map((chef) => (
              <Card
                key={chef.id}
                className="min-w-[300px] max-w-[300px] hover:shadow-warm transition-all cursor-pointer group"
                onClick={() => navigate(`/chefs/${chef.id}`)}
              >
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                      {chef.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                        {chef.name}
                      </h3>
                      {chef.verification_status === "approved" && (
                        <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{chef.avg_rating?.toFixed(1) || "New"}</span>
                      <span>•</span>
                      <span>{chef.total_orders || 0} orders</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {chef.signature_dish && (
                    <Badge variant="secondary" className="mb-3">
                      🍽️ {chef.signature_dish}
                    </Badge>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2 whitespace-normal">
                    {chef.bio || "Passionate home chef creating delicious homemade dishes"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <div className="text-center mt-10">
          <Button size="lg" variant="outline" onClick={() => navigate("/chefs")} className="border-2 border-primary text-foreground hover:bg-primary hover:text-white font-semibold transition-all">
            View All Chefs
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MeetChefs;