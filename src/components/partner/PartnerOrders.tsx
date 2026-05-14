import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { getCommissionPercentage } from "@/lib/commissionUtils";

interface Order {
  id: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
  customer_id: string;
  meals: {
    title: string;
  };
  profiles: {
    name: string;
    email: string;
  };
}

interface PartnerOrdersProps {
  chefId: string;
  userId?: string | null;
  onStatsUpdate: () => void;
}

export const PartnerOrders = ({ chefId, userId, onStatsUpdate }: PartnerOrdersProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);   // disables action buttons
  const [fetching, setFetching] = useState(true);  // initial data load
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [commissionRate, setCommissionRate] = useState<number>(0);

  useEffect(() => {
    fetchOrders();
    fetchCommissionRate();

    // Realtime — auto-refresh when any order for this chef changes
    const queryId = userId || chefId;
    if (!queryId) return;
    const channel = supabase
      .channel("partner-orders-watch")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `chef_id=eq.${queryId}`,
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, chefId]);

  const fetchCommissionRate = async () => {
    const rate = await getCommissionPercentage();
    setCommissionRate(rate);
  };

  const fetchOrders = async () => {
    setFetching(true);
    try {
      const queryId = userId || chefId;
      if (!queryId) return;

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("chef_id", queryId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch meal titles and customer names
      const ordersWithDetails = await Promise.all(
        (data || []).map(async (order) => {
          const [mealData, profileData] = await Promise.all([
            supabase.from("meals").select("title").eq("id", order.meal_id).single(),
            supabase.from("profiles").select("name, email").eq("id", order.customer_id).single()
          ]);
          
          return {
            ...order,
            meals: mealData.data || { title: "Unknown Meal" },
            profiles: profileData.data || { name: "Customer" }
          };
        })
      );

      setOrders(ordersWithDetails as any);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setFetching(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    // Optimistic update — show new status instantly, no flash
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    setLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) {
        // Revert optimistic update on failure
        fetchOrders();
        throw error;
      }
      toast.success(`Order ${newStatus}`);

      const order = orders.find((o) => o.id === orderId);

      // Send email notification to customer (fire and forget)
      const emailEvents: Record<string, string> = {
        accepted: "accepted", preparing: "preparing",
        ready: "ready", out_for_delivery: "out_for_delivery", delivered: "delivered",
      };
      if (order && emailEvents[newStatus] && order.profiles?.email) {
        supabase.functions.invoke("send-email-notification", {
          body: {
            to: order.profiles.email,
            event: emailEvents[newStatus],
            customerName: order.profiles.name || order.profiles.email,
            chefName: "Your Chef",
            mealTitle: order.meals.title,
            orderId: order.id,
            totalPrice: order.total_price,
            quantity: order.quantity,
          },
        }).catch(() => {});
      }

      fetchOrders();
      onStatsUpdate();
    } catch (error: any) {
      console.error("Error updating order:", error);
      toast.error(error.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":    return "secondary";
      case "accepted":   return "outline";
      case "preparing":  return "outline";
      case "ready":      return "default";
      case "delivered":  return "default";
      case "rejected":
      case "cancelled":  return "destructive";
      default:           return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending:          "⏳ Pending",
      accepted:         "✅ Accepted",
      preparing:        "👨‍🍳 Preparing",
      ready:            "📦 Ready",
      out_for_delivery: "🛵 Out for Delivery",
      delivered:        "🎉 Delivered",
      rejected:         "❌ Rejected",
      cancelled:        "❌ Cancelled",
    };
    return labels[status] ?? status;
  };

  const filteredOrders = filterStatus === "all" 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-3">
        <h2 className="text-xl font-semibold">Orders</h2>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-28 sm:w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {fetching ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading orders…
              </div>
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {filterStatus === "all" ? "No orders yet" : `No ${filterStatus} orders`}
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{order.meals.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Customer: {order.profiles.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), "MMM dd, yyyy 'at' hh:mm a")}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(order.status) as any}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity: {order.quantity}</p>
                    <p className="text-lg font-bold text-primary">₹{order.total_price}</p>
                    <p className="text-xs text-muted-foreground">
                      Your earnings: ₹{(Number(order.total_price) * (1 - commissionRate / 100)).toFixed(2)}
                    </p>
                    {commissionRate > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        (After {commissionRate}% MyHomePlate commission)
                      </p>
                    )}
                    {commissionRate === 0 && (
                      <p className="text-xs text-green-600 font-semibold mt-1">
                        🎉 0% Commission - Launch Phase!
                      </p>
                    )}
                  </div>
                </div>

                {order.status === "pending" && (
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => handleStatusUpdate(order.id, "accepted")}
                      disabled={loading}
                    >
                      Accept Order
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleStatusUpdate(order.id, "rejected")}
                      disabled={loading}
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {order.status === "accepted" && (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleStatusUpdate(order.id, "preparing")}
                    disabled={loading}
                  >
                    👨‍🍳 Start Preparing
                  </Button>
                )}

                {order.status === "preparing" && (
                  <Button
                    className="w-full bg-amber-500 hover:bg-amber-600"
                    onClick={() => handleStatusUpdate(order.id, "ready")}
                    disabled={loading}
                  >
                    📦 Mark as Ready
                  </Button>
                )}

                {order.status === "ready" && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusUpdate(order.id, "delivered")}
                    disabled={loading}
                  >
                    🎉 Mark as Delivered
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
