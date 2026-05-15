import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getCommissionPercentage } from "@/lib/commissionUtils";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ChefHat, IndianRupee, Package, User, History } from "lucide-react";
import { PartnerDishes } from "@/components/partner/PartnerDishes";
import { PartnerOrders } from "@/components/partner/PartnerOrders";
import { PartnerProfile } from "@/components/partner/PartnerProfile";
import { PartnerEarnings } from "@/components/partner/PartnerEarnings";

const Partner = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isChef, setIsChef] = useState(false);
  const [chefId, setChefId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
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

      setUserId(user.id);

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
      // Fetch current commission rate
      const commissionRate = await getCommissionPercentage();
      const chefPercentage = (100 - commissionRate) / 100;

      // Fetch all orders in one query, count client-side (avoids RLS issues with head:true)
      const { data: ordersData } = await supabase
        .from("orders")
        .select("id, status, total_price")
        .eq("chef_id", userId);

      const totalOrders = ordersData?.length || 0;
      const pendingOrders = ordersData?.filter(o => o.status === "pending").length || 0;
      const totalEarnings = ordersData
        ?.filter(o => o.status === "delivered")
        .reduce((sum, o) => sum + Number(o.total_price) * chefPercentage, 0) || 0;

      // Active dishes
      const { data: mealsData } = await supabase
        .from("meals")
        .select("id")
        .eq("chef_id", userId)
        .eq("available", true);

      setStats({
        totalOrders,
        pendingOrders,
        totalEarnings,
        activeDishes: mealsData?.length || 0,
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
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Partner Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your kitchen, orders, and earnings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
            <PartnerOrders chefId={chefId} userId={userId} onStatsUpdate={() => userId && fetchStats(userId)} />
          </TabsContent>

          <TabsContent value="dishes">
            <PartnerDishes chefId={chefId} onUpdate={() => checkChefAccess()} />
          </TabsContent>

          <TabsContent value="earnings">
            <div className="mb-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => navigate("/partner/payments")}>
                <History className="h-4 w-4 mr-2" />
                Payment History
              </Button>
            </div>
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
