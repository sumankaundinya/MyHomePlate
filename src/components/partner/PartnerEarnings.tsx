import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { IndianRupee, TrendingUp, Calendar, Banknote } from "lucide-react";
import { getCommissionPercentage } from "@/lib/commissionUtils";

interface EarningData {
  date: string;
  orders: number;
  revenue: number;
  earnings: number;
}

interface PayoutRecord {
  id: string;
  order_id: string;
  order_amount: number;
  commission_rate: number;
  payout_amount: number;
  payout_method: string;
  razorpay_payout_id: string | null;
  status: string;
  failure_reason: string | null;
  created_at: string;
}

export const PartnerEarnings = () => {
  const [earnings, setEarnings] = useState<EarningData[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState(0);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);

  useEffect(() => {
    fetchCommissionRate();
    fetchEarnings();
    fetchPayouts();
  }, []);

  const fetchCommissionRate = async () => {
    try {
      const rate = await getCommissionPercentage();
      setCommissionRate(rate);
    } catch (error) {
      console.error("Error fetching commission rate:", error);
      setCommissionRate(0);
    }
  };

  const fetchEarnings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch current commission rate for calculations
      const rate = await getCommissionPercentage();
      const chefPercentage = (100 - rate) / 100; // e.g., if 10% commission, chef gets 90%

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
        const earning = revenue * chefPercentage; // Dynamic commission

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
      setCommissionRate(rate);
    } catch (error) {
      console.error("Error fetching earnings:", error);
      toast.error("Failed to load earnings data");
    } finally {
      setLoading(false);
    }
  };

  const fetchPayouts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get chef profile id from user id
      const { data: chef } = await supabase
        .from("chefs")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!chef) return;

      const { data, error } = await (supabase as any)
        .from("chef_payouts")
        .select("*")
        .eq("chef_id", chef.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayouts(data || []);
    } catch (error) {
      console.error("Error fetching payouts:", error);
    } finally {
      setPayoutsLoading(false);
    }
  };

  const getPayoutStatusBadge = (status: string) => {
    switch (status) {
      case "processed":  return <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>;
      case "processing": return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Processing</Badge>;
      case "failed":     return <Badge variant="destructive">Failed</Badge>;
      default:           return <Badge variant="secondary">Pending</Badge>;
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
            <p className="text-xs text-muted-foreground">
              {100 - commissionRate}% of total revenue
              {commissionRate === 0 && " 🎉 (No commission - Launch phase!)"}
            </p>
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

      {/* Payout Ledger */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-green-600" />
            Payout History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payoutsLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading payouts...</p>
          ) : payouts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No payouts yet. Payouts are triggered automatically when you mark an order as delivered.
            </p>
          ) : (
            <div className="space-y-3">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">₹{Number(payout.payout_amount).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(payout.created_at), "MMM dd, yyyy 'at' hh:mm a")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        via {payout.payout_method === "upi" ? "UPI" : "Bank"} · Order ₹{Number(payout.order_amount).toFixed(2)} · {Number(payout.commission_rate)}% fee
                      </p>
                      {payout.failure_reason && (
                        <p className="text-xs text-destructive mt-0.5">{payout.failure_reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {getPayoutStatusBadge(payout.status)}
                    {payout.razorpay_payout_id && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ID: {payout.razorpay_payout_id.slice(-8)}
                      </p>
                    )}
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
