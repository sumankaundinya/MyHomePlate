import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import SEOHead from "@/components/SEOHead";
import { ChefCard } from "@/components/ChefCard";
import { ChefsMap, type ChefMapPin } from "@/components/ChefsMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ChefHat, Search, MapPin, Map, LayoutGrid } from "lucide-react";

// Haversine formula — real distance between two GPS coords in km
function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Chef {
  id: string;
  user_id: string;
  bio: string | null;
  avg_rating: number;
  total_reviews: number;
  total_orders: number;
  is_featured: boolean;
  verification_status: string;
  latitude: number | null;
  longitude: number | null;
  profiles: { name: string };
  chef_specialties: { specialty: string }[];
  distance?: number;
}

const Chefs = () => {
  const navigate = useNavigate();
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [radiusKm, setRadiusKm] = useState(2);

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

      // Fetch profile names + address coords for each chef
      const chefsWithProfiles = await Promise.all(
        (data || []).map(async (chef) => {
          const [profileRes, addressRes] = await Promise.all([
            supabase.from("profiles").select("name").eq("id", chef.user_id).single(),
            supabase
              .from("addresses")
              .select("latitude, longitude")
              .eq("user_id", chef.user_id)
              .eq("is_primary", true)
              .maybeSingle(),
          ]);

          return {
            ...chef,
            profiles: profileRes.data || { name: "Chef" },
            latitude: addressRes.data?.latitude ?? null,
            longitude: addressRes.data?.longitude ?? null,
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

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        setGpsLoading(false);
        toast.success("Location found! Showing nearby chefs 📍");
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Location access denied. Please allow location in browser settings.");
        } else {
          // Fallback to Nizampet center
          setUserPosition([17.5081, 78.3887]);
          toast.info("Using Nizampet as default location");
        }
      },
      { timeout: 8000, maximumAge: 60000 }
    );
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
      // Real Haversine distance if user GPS + chef address both available
      if (userPosition && chef.latitude !== null && chef.longitude !== null) {
        const dist = haversineKm(
          userPosition[0], userPosition[1],
          chef.latitude, chef.longitude
        );
        return { ...chef, distance: dist };
      }
      return chef;
    })
    .filter((chef) => {
      if (userPosition && chef.distance !== undefined) {
        return chef.distance <= radiusKm;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      return 0;
    });

  // Build map pins only for chefs that have stored coordinates
  const mapPins: ChefMapPin[] = filteredChefs
    .filter((c) => c.latitude !== null && c.longitude !== null)
    .map((c) => ({
      id: c.id,
      name: c.profiles?.name || "Chef",
      bio: c.bio,
      avg_rating: c.avg_rating ?? null,
      latitude: c.latitude!,
      longitude: c.longitude!,
      distance: c.distance,
    }));

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

        {/* Location + Search + View Toggle */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* GPS button */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <Label className="flex items-center gap-2 mb-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                Your Location
              </Label>
              <Button
                onClick={handleUseGPS}
                disabled={gpsLoading}
                className="w-full"
                variant={userPosition ? "outline" : "default"}
              >
                {gpsLoading
                  ? "Detecting…"
                  : userPosition
                  ? "✅ Location Set"
                  : "📍 Use My GPS Location"}
              </Button>
              {userPosition && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-green-600 flex-1">
                    Showing chefs within {radiusKm} km
                  </span>
                  <select
                    className="text-xs border rounded px-1 py-0.5"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                  >
                    <option value={1}>1 km</option>
                    <option value={2}>2 km</option>
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                  </select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <Label className="flex items-center gap-2 mb-2 text-sm">
                <Search className="h-4 w-4 text-primary" />
                Search
              </Label>
              <Input
                placeholder="Search by name or specialty…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* View toggle */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <Label className="flex items-center gap-2 mb-2 text-sm">
                View Mode
              </Label>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4 mr-1" /> Grid
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setViewMode("map")}
                >
                  <Map className="h-4 w-4 mr-1" /> Map
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-muted-foreground mb-4">
            {filteredChefs.length} chef{filteredChefs.length !== 1 ? "s" : ""} found
            {userPosition ? ` within ${radiusKm} km` : ""}
          </p>
        )}

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
                {userPosition
                  ? `No chefs within ${radiusKm} km — try a larger radius`
                  : "Use GPS to find nearby chefs, or search by name"}
              </p>
            </CardContent>
          </Card>
        ) : viewMode === "map" ? (
          <ChefsMap
            chefs={mapPins}
            userPosition={userPosition}
            radiusKm={radiusKm}
          />
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
