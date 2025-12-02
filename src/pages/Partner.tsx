import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ChefHat, IndianRupee, Package, User } from "lucide-react";
import { PartnerDishes } from "@/components/partner/PartnerDishes";
import { PartnerOrders } from "@/components/partner/PartnerOrders";
import { PartnerProfile } from "@/components/partner/PartnerProfile";
import { PartnerEarnings } from "@/components/partner/PartnerEarnings";

const Partner = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isChef, setIsChef] = useState(false);
  const [chefId, setChefId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalEarnings: 0,
    activeDishes: 0
  });

  useEffect(() => {
    checkChefAccess();
  }, []);

  const checkChefAccess = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }

      // Check if user has chef role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "chef")
        .single();

      if (roleError || !roleData) {
        toast.error("You don't have chef access");
        navigate("/");
        return;
      }

      setIsChef(true);

      // Get or create chef profile
      const { data: chefData, error: chefError } = await supabase
        .from("chefs")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (chefError && chefError.code !== "PGRST116") {
        throw chefError;
      }

      if (!chefData) {
        // Create chef profile if doesn't exist
        const { data: newChef, error: createError } = await supabase
          .from("chefs")
          .insert({ user_id: user.id })
          .select("id")
          .single();

        if (createError) throw createError;
        setChefId(newChef.id);
      } else {
        setChefId(chefData.id);
      }

      // Fetch stats
      await fetchStats(user.id);

    } catch (error) {
      console.error("Error checking chef access:", error);
      toast.error("Failed to load partner dashboard");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (userId: string) => {
    try {
      // Get total orders
      const { count: totalOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("chef_id", userId);

      // Get pending orders
      const { count: pendingOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("chef_id", userId)
        .eq("status", "pending");

      // Get active dishes
      const { count: activeDishes } = await supabase
        .from("meals")
        .select("*", { count: "exact", head: true })
        .eq("chef_id", userId)
        .eq("available", true);

      // Calculate total earnings (85% of completed orders)
      const { data: completedOrders } = await supabase
        .from("orders")
        .select("total_price")
        .eq("chef_id", userId)
        .in("status", ["delivered"]);

      const totalEarnings = completedOrders?.reduce((sum, order) => {
        return sum + (Number(order.total_price) * 0.85);
      }, 0) || 0;

      setStats({
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        totalEarnings,
        activeDishes: activeDishes || 0
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
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

  if (!isChef || !chefId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
            Partner Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your kitchen, orders, and earnings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <ChefHat className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Earnings</CardTitle>
              <IndianRupee className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalEarnings.toFixed(0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Dishes</CardTitle>
              <User className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeDishes}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="dishes">Dishes</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <PartnerOrders onStatsUpdate={() => checkChefAccess()} />
          </TabsContent>

          <TabsContent value="dishes">
            <PartnerDishes chefId={chefId} onUpdate={() => checkChefAccess()} />
          </TabsContent>

          <TabsContent value="earnings">
            <PartnerEarnings />
          </TabsContent>

          <TabsContent value="profile">
            <PartnerProfile chefId={chefId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Partner;
