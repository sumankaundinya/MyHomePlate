import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { Truck } from "lucide-react";

interface Order {
  id: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
  delivery_partner_id: string | null;
  meal_title: string;
  customer_name: string;
  chef_name: string;
}

interface AdminOrdersProps {
  onUpdate: () => void;
}

export const AdminOrders = ({ onUpdate }: AdminOrdersProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deliveryPartnerId, setDeliveryPartnerId] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch related data
      const ordersWithDetails = await Promise.all(
        (data || []).map(async (order) => {
          const [mealData, customerData, chefData] = await Promise.all([
            supabase.from("meals").select("title").eq("id", order.meal_id).single(),
            supabase.from("profiles").select("name").eq("id", order.customer_id).single(),
            supabase.from("profiles").select("name").eq("id", order.chef_id).single()
          ]);
          
          return {
            ...order,
            meal_title: mealData.data?.title || "Unknown",
            customer_name: customerData.data?.name || "Customer",
            chef_name: chefData.data?.name || "Chef"
          };
        })
      );

      setOrders(ordersWithDetails as any);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    }
  };

  const handleAssignDelivery = async (orderId: string) => {
    if (!deliveryPartnerId.trim()) {
      toast.error("Please enter a delivery partner ID");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          delivery_partner_id: deliveryPartnerId,
          status: "out_for_delivery"
        })
        .eq("id", orderId);

      if (error) throw error;
      toast.success("Delivery partner assigned");
      setSelectedOrder(null);
      setDeliveryPartnerId("");
      fetchOrders();
      onUpdate();
    } catch (error: any) {
      console.error("Error assigning delivery:", error);
      toast.error(error.message || "Failed to assign delivery");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "accepted":
        return "secondary";
      case "preparing":
        return "default";
      case "out_for_delivery":
        return "default";
      case "delivered":
        return "default";
      case "cancelled":
      case "rejected":
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
        <h2 className="text-xl font-semibold">All Orders</h2>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
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
                    <CardTitle className="text-lg">{order.meal_title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Customer: {order.customer_name} | Chef: {order.chef_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), "MMM dd, yyyy 'at' hh:mm a")}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(order.status) as any}>
                    {order.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity: {order.quantity}</p>
                    <p className="text-lg font-bold text-primary">₹{order.total_price}</p>
                  </div>

                  {order.status === "preparing" && !order.delivery_partner_id && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setSelectedOrder(order)}>
                          <Truck className="h-4 w-4 mr-1" />
                          Assign Delivery
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign Delivery Partner</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="partner-id">Delivery Partner ID</Label>
                            <Input
                              id="partner-id"
                              placeholder="Enter partner user ID"
                              value={deliveryPartnerId}
                              onChange={(e) => setDeliveryPartnerId(e.target.value)}
                            />
                          </div>
                          <Button 
                            onClick={() => handleAssignDelivery(order.id)}
                            disabled={loading}
                            className="w-full"
                          >
                            {loading ? "Assigning..." : "Assign"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {order.delivery_partner_id && (
                    <Badge variant="outline">
                      <Truck className="h-3 w-3 mr-1" />
                      Delivery Assigned
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
