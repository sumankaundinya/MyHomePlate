import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { IndianRupee, TrendingUp, Calendar } from "lucide-react";

interface EarningData {
  date: string;
  orders: number;
  revenue: number;
  earnings: number;
}

export const PartnerEarnings = () => {
  const [earnings, setEarnings] = useState<EarningData[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch completed orders
      const { data: orders, error } = await supabase
        .from("orders")
        .select("total_price, created_at")
        .eq("chef_id", user.id)
        .in("status", ["delivered"]);

      if (error) throw error;

      // Group by date and calculate earnings
      const earningsByDate: { [key: string]: EarningData } = {};
      let total = 0;

      orders?.forEach(order => {
        const date = format(new Date(order.created_at), "yyyy-MM-dd");
        const revenue = Number(order.total_price);
        const earning = revenue * 0.85; // 85% goes to chef

        if (!earningsByDate[date]) {
          earningsByDate[date] = {
            date,
            orders: 0,
            revenue: 0,
            earnings: 0
          };
        }

        earningsByDate[date].orders += 1;
        earningsByDate[date].revenue += revenue;
        earningsByDate[date].earnings += earning;
        total += earning;
      });

      setEarnings(Object.values(earningsByDate).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
      setTotalEarnings(total);
    } catch (error) {
      console.error("Error fetching earnings:", error);
      toast.error("Failed to load earnings data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading earnings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">85% of total revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {earnings.reduce((sum, e) => sum + e.orders, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. per Order</CardTitle>
            <IndianRupee className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{earnings.length > 0 
                ? (totalEarnings / earnings.reduce((sum, e) => sum + e.orders, 0)).toFixed(2)
                : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Your average earnings</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings History</CardTitle>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No earnings data yet
            </p>
          ) : (
            <div className="space-y-4">
              {earnings.map((earning) => (
                <div 
                  key={earning.date}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {format(new Date(earning.date), "MMM dd, yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {earning.orders} {earning.orders === 1 ? "order" : "orders"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      ₹{earning.earnings.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      from ₹{earning.revenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
