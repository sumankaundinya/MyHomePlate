import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import SEOHead from "@/components/SEOHead";
import { ChefCard } from "@/components/ChefCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ChefHat, Search, MapPin } from "lucide-react";

interface Chef {
  id: string;
  user_id: string;
  bio: string | null;
  avg_rating: number;
  total_reviews: number;
  total_orders: number;
  is_featured: boolean;
  verification_status: string;
  profiles: {
    name: string;
  };
  chef_specialties: {
    specialty: string;
  }[];
  distance?: number;
}

const Chefs = () => {
  const navigate = useNavigate();
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userAddress, setUserAddress] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [addressInput, setAddressInput] = useState("");

  useEffect(() => {
    fetchChefs();
  }, []);

  const fetchChefs = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("chefs")
        .select("*, chef_specialties (specialty)")
        .eq("verification_status", "approved")
        .order("is_featured", { ascending: false })
        .order("avg_rating", { ascending: false });

      if (error) throw error;

      // Fetch profile names
      const chefsWithProfiles = await Promise.all(
        (data || []).map(async (chef) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", chef.user_id)
            .single();

          return {
            ...chef,
            profiles: profileData || { name: "Chef" },
          };
        })
      );

      setChefs(chefsWithProfiles as any);
    } catch (error) {
      console.error("Error fetching chefs:", error);
      toast.error("Failed to load chefs");
    } finally {
      setLoading(false);
    }
  };

  const handleSetLocation = () => {
    // Simple geocoding simulation - in production, use a real geocoding API
    if (addressInput.trim()) {
      // For demo: Nizampet coordinates
      const demoLocation = { latitude: 17.5081, longitude: 78.3887 };
      setUserAddress(demoLocation);
      toast.success("Location set! Showing nearby chefs");
    } else {
      toast.error("Please enter your address");
    }
  };

  const filteredChefs = chefs
    .filter((chef) => {
      const name = chef.profiles?.name?.toLowerCase() || "";
      const specialties = chef.chef_specialties
        .map((s) => s.specialty.toLowerCase())
        .join(" ");
      const search = searchTerm.toLowerCase();
      return name.includes(search) || specialties.includes(search);
    })
    .map((chef) => {
      // Calculate distance if user location is set (demo calculation)
      if (userAddress) {
        // In production, calculate actual distance using chef's location
        const randomDistance = Math.random() * 5; // 0-5 km for demo
        return { ...chef, distance: randomDistance };
      }
      return chef;
    })
    .filter((chef) => {
      // Filter by 2km radius if location is set
      if (userAddress && chef.distance !== undefined) {
        return chef.distance <= 2;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort by distance if available
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Our Home Chefs - MyHomePlate"
        description="Meet verified home chefs in your area cooking authentic Indian dishes. Browse profiles, ratings, and specialties. Order fresh homemade meals today."
      />
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
            Discover Home Chefs
          </h1>
          <p className="text-muted-foreground">
            Find authentic home-cooked meals from verified chefs in Nizampet
          </p>
        </div>

        {/* Location and Search */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <Label htmlFor="address" className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                Your Address
              </Label>
              <div className="flex gap-2">
                <Input
                  id="address"
                  placeholder="Enter your address in Nizampet..."
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                />
                <Button onClick={handleSetLocation}>Set</Button>
              </div>
              {userAddress && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ Showing chefs within 2 km
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Label htmlFor="search" className="flex items-center gap-2 mb-2">
                <Search className="h-4 w-4 text-primary" />
                Search
              </Label>
              <Input
                id="search"
                placeholder="Search by name or specialty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ChefHat className="h-12 w-12 text-primary animate-pulse mb-4" />
            <p className="text-muted-foreground">Loading chefs...</p>
          </div>
        ) : filteredChefs.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ChefHat className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No chefs found</h3>
              <p className="text-muted-foreground mb-4">
                {userAddress
                  ? "Try expanding your search area or adjust filters"
                  : "Set your location to find nearby chefs"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChefs.map((chef) => (
              <ChefCard
                key={chef.id}
                id={chef.id}
                name={chef.profiles?.name || "Chef"}
                bio={chef.bio || undefined}
                specialties={chef.chef_specialties.map((s) => s.specialty)}
                rating={chef.avg_rating}
                totalReviews={chef.total_reviews}
                totalOrders={chef.total_orders}
                isVerified={chef.verification_status === "approved"}
                isFeatured={chef.is_featured}
                distance={chef.distance}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Chefs;
