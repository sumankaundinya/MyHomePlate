import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import SEOHead from "@/components/SEOHead";
import AuthModal from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  UtensilsCrossed,
  ChefHat,
  Home,
  ArrowRight,
  X,
} from "lucide-react";
import { toast } from "sonner";

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
  delivery_fee?: number;
}

type SortOption = "newest" | "price-asc" | "price-desc";

const CATEGORY_TABS = ["All", "Breakfast", "Lunch", "Dinner", "Snacks"];

const MealSkeleton = () => (
  <div className="rounded-xl overflow-hidden border bg-card">
    <Skeleton className="aspect-[4/3] w-full" />
    <div className="p-3 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-7 w-20 rounded-md" />
      </div>
    </div>
  </div>
);

const MealCard = ({
  meal,
  onOrder,
}: {
  meal: Meal;
  onOrder: (e: React.MouseEvent, id: string) => void;
}) => {
  const navigate = useNavigate();
  return (
    <div
      className="rounded-xl overflow-hidden border-2 border-transparent hover:border-primary/20 bg-card hover:shadow-warm hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group"
      onClick={() => navigate(`/meals/${meal.id}`)}
    >
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {meal.image_url ? (
          <img
            src={meal.image_url}
            alt={meal.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <UtensilsCrossed className="h-10 w-10 text-primary/40" />
          </div>
        )}
        <span className="absolute top-2 left-2 text-[10px] font-semibold bg-black/55 text-white backdrop-blur-sm px-1.5 py-0.5 rounded-full capitalize max-w-[45%] truncate">
          {meal.category || "other"}
        </span>
        {/* Mobile: icon only · sm+: icon + text */}
        <span className="absolute top-2 right-2 text-[10px] font-semibold bg-primary/90 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <Home className="h-2.5 w-2.5 shrink-0" />
          <span className="hidden sm:inline">Homemade</span>
        </span>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pt-6 pb-2 px-3">
          <div className="flex items-end justify-between">
            <span className="text-white font-bold text-base">₹{meal.price}</span>
            <span className="text-white/75 text-[10px]">
              {(meal.delivery_fee ?? 0) === 0 ? "Free delivery" : `+₹${meal.delivery_fee} del`}
            </span>
          </div>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors mb-0.5">
          {meal.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1 sm:line-clamp-2 leading-relaxed mb-2">
          {meal.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
            <ChefHat className="h-3 w-3 text-primary shrink-0" />
            <span className="truncate">{meal.chef_name}</span>
          </span>
          <Button
            size="sm"
            className="h-7 text-xs px-2.5 shrink-0 ml-2"
            onClick={(e) => onOrder(e, meal.id)}
          >
            Order
          </Button>
        </div>
      </div>
    </div>
  );
};

const Meals = () => {
  const navigate = useNavigate();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sort, setSort] = useState<SortOption>("newest");

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    try {
      const { data: approvedChefs } = await supabase
        .from("chefs")
        .select("user_id")
        .eq("verification_status", "approved");

      const approvedChefIds = (approvedChefs || []).map((c) => c.user_id);
      if (approvedChefIds.length === 0) { setMeals([]); setLoading(false); return; }

      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("available", true)
        .in("chef_id", approvedChefIds)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const uniqueChefIds = [...new Set((data || []).map((m: any) => m.chef_id))];

      const [{ data: profiles }, { data: chefData }] = await Promise.all([
        supabase.from("profiles").select("id, name").in("id", uniqueChefIds),
        (supabase as any).from("chefs").select("user_id, delivery_fee").in("user_id", uniqueChefIds),
      ]);

      const profileMap = Object.fromEntries(
        (profiles || []).map((p) => [p.id, p.name])
      );
      const deliveryMap = Object.fromEntries(
        (chefData || []).map((c: any) => [c.user_id, c.delivery_fee ?? 0])
      );

      setMeals(
        (data || []).map((meal: any) => ({
          ...meal,
          chef_name: profileMap[meal.chef_id] || "Home Chef",
          delivery_fee: deliveryMap[meal.chef_id] ?? 0,
        }))
      );
    } catch {
      toast.error("Failed to load meals");
    } finally {
      setLoading(false);
    }
  };

  const filteredMeals = useMemo(() => {
    let result = meals;
    if (activeCategory !== "All") {
      result = result.filter((m) =>
        (m.category || "").toLowerCase() === activeCategory.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((m) =>
        (m.title || "").toLowerCase().includes(q) ||
        (m.description || "").toLowerCase().includes(q) ||
        (m.category || "").toLowerCase().includes(q) ||
        (m.chef_name || "").toLowerCase().includes(q)
      );
    }
    if (sort === "price-asc") return [...result].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return [...result].sort((a, b) => b.price - a.price);
    return result;
  }, [meals, activeCategory, searchQuery, sort]);

  const handleOrderClick = async (e: React.MouseEvent, mealId: string) => {
    e.stopPropagation();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) setShowAuthModal(true);
    else navigate(`/meals/${mealId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Browse Homemade Meals — MyHomePlate"
        description="Explore authentic Indian home-cooked dishes from verified local chefs."
      />
      <Navbar />

      <main className="container mx-auto px-4 pt-5 pb-12 max-w-6xl">

        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground">
            Homemade Dishes
          </h1>
          {!loading && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {filteredMeals.length} meal{filteredMeals.length !== 1 ? "s" : ""} available
              {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
            </p>
          )}
        </div>

        {/* Subscription strip */}
        <Link
          to="/subscriptions"
          className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5 mb-4 hover:bg-primary/10 transition-colors group"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <div>
              <p className="text-xs font-semibold text-primary">Want daily meals?</p>
              <p className="text-[11px] text-muted-foreground">
                Subscribe for Breakfast, Lunch or Dinner — from ₹70/meal
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Search + Sort */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search dishes, chefs or categories…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-24 sm:w-36 h-9 text-xs shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest" className="text-xs">Newest First</SelectItem>
              <SelectItem value="price-asc" className="text-xs">Price: Low → High</SelectItem>
              <SelectItem value="price-desc" className="text-xs">Price: High → Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category pills — always static so they don't flicker on data load */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                activeCategory === cat
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40 bg-background"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <MealSkeleton key={i} />)}
          </div>
        ) : filteredMeals.length === 0 ? (
          <div className="text-center py-16">
            <UtensilsCrossed className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">No meals found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : activeCategory !== "All"
                ? `No ${activeCategory} meals available right now`
                : "Check back soon for new dishes!"}
            </p>
            {(searchQuery || activeCategory !== "All") && (
              <Button variant="outline" size="sm"
                onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filteredMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} onOrder={handleOrderClick} />
            ))}
          </div>
        )}

      </main>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
};

export default Meals;
