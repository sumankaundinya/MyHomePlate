import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { IndianRupee, TrendingUp, RefreshCw } from "lucide-react";
import { getCommissionPercentage } from "@/lib/commissionUtils";

interface RevenueOrder {
  id: string;
  total_price: number;
  created_at: string;
  payment_status: string | null;
  refund_status: string | null;
  meal_title: string;
  chef_name: string;
  customer_name: string;
}

export const AdminRevenue = () => {
  const [orders, setOrders] = useState<RevenueOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const rate = await getCommissionPercentage();
      setCommissionRate(rate);

      const { data, error } = await supabase
        .from("orders")
        .select("id, total_price, created_at, payment_status, refund_status, chef_id, customer_id, meals (title)")
        .not("payment_status", "is", null)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      const enriched = await Promise.all(
        (data || []).map(async (o: any) => {
          const [chefRes, custRes] = await Promise.all([
            supabase.from("profiles").select("name").eq("id", o.chef_id).maybeSingle(),
            supabase.from("profiles").select("name").eq("id", o.customer_id).maybeSingle(),
          ]);
          return {
            id: o.id,
            total_price: Number(o.total_price),
            created_at: o.created_at,
            payment_status: o.payment_status,
            refund_status: o.refund_status,
            meal_title: o.meals?.title ?? "—",
            chef_name: chefRes.data?.name ?? "Unknown",
            customer_name: custRes.data?.name ?? "Unknown",
          };
        })
      );

      setOrders(enriched);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load revenue data");
    } finally {
      setLoading(false);
    }
  };

  const paid = orders.filter((o) => o.payment_status === "paid" && o.refund_status !== "processed");
  const refunded = orders.filter((o) => o.refund_status === "processed");

  const grossRevenue = paid.reduce((s, o) => s + o.total_price, 0);
  const platformRevenue = grossRevenue * (commissionRate / 100);
  const chefPayouts = grossRevenue * ((100 - commissionRate) / 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{grossRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{paid.length} paid orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Platform Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₹{platformRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{commissionRate}% of gross</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chef Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{chefPayouts.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{100 - commissionRate}% of gross</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Refunded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              ₹{refunded.reduce((s, o) => s + o.total_price, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{refunded.length} refunds</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction table */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="py-12 text-center">
              <IndianRupee className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium">Date</th>
                    <th className="text-left px-4 py-3 font-medium">Meal</th>
                    <th className="text-left px-4 py-3 font-medium">Chef</th>
                    <th className="text-left px-4 py-3 font-medium">Customer</th>
                    <th className="text-right px-4 py-3 font-medium">Amount</th>
                    <th className="text-right px-4 py-3 font-medium">Commission</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {format(new Date(o.created_at), "d MMM yy")}
                      </td>
                      <td className="px-4 py-3 max-w-[140px] truncate">{o.meal_title}</td>
                      <td className="px-4 py-3">{o.chef_name}</td>
                      <td className="px-4 py-3">{o.customer_name}</td>
                      <td className="px-4 py-3 text-right font-medium">₹{o.total_price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-blue-600">
                        ₹{(o.total_price * commissionRate / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center flex-wrap">
                          <Badge
                            variant={o.payment_status === "paid" ? "default" : o.payment_status === "failed" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {o.payment_status ?? "pending"}
                          </Badge>
                          {o.refund_status && (
                            <Badge variant="outline" className="text-xs">
                              {o.refund_status === "processed" ? "refunded" : "refund failed"}
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
