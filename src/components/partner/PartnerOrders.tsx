import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { Clock, Check, X, Package } from "lucide-react";

interface Order {
  id: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
  meals: {
    title: string;
  };
  profiles: {
    name: string;
  };
}

interface PartnerOrdersProps {
  onStatsUpdate: () => void;
}

export const PartnerOrders = ({ onStatsUpdate }: PartnerOrdersProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("chef_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch meal titles and customer names
      const ordersWithDetails = await Promise.all(
        (data || []).map(async (order) => {
          const [mealData, profileData] = await Promise.all([
            supabase.from("meals").select("title").eq("id", order.meal_id).single(),
            supabase.from("profiles").select("name").eq("id", order.customer_id).single()
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
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      toast.success(`Order ${newStatus}`);
      fetchOrders();
      onStatsUpdate();
    } catch (error: any) {
      console.error("Error updating order:", error);
      toast.error(error.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "accepted":
      case "preparing":
        return <Package className="h-4 w-4" />;
      case "delivered":
        return <Check className="h-4 w-4" />;
      case "rejected":
      case "cancelled":
        return <X className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default";
      case "accepted":
      case "preparing":
        return "secondary";
      case "delivered":
        return "default";
      case "rejected":
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const filteredOrders = filterStatus === "all" 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Orders</h2>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
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
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No orders found
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
                    {getStatusIcon(order.status)}
                    <span className="ml-1 capitalize">{order.status.replace("_", " ")}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity: {order.quantity}</p>
                    <p className="text-lg font-bold text-primary">₹{order.total_price}</p>
                    <p className="text-xs text-muted-foreground">
                      Your earnings: ₹{(Number(order.total_price) * 0.85).toFixed(2)}
                    </p>
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
                    className="w-full"
                    onClick={() => handleStatusUpdate(order.id, "preparing")}
                    disabled={loading}
                  >
                    Mark as Preparing
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
