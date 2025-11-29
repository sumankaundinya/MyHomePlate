import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

interface Order {
  id: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
  chef_id: string;
  meals: {
    title: string;
    image_url: string | null;
  };
  profiles: {
    name: string;
  };
}

const Orders = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Please sign in to view your orders");
      navigate("/login");
      return;
    }

    setUser(session.user);
    fetchOrders(session.user.id);
  };

  const fetchOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, meals (title, image_url)")
        .eq("customer_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch chef names
      const ordersWithChef = await Promise.all(
        (data || []).map(async (order: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", order.chef_id)
            .single();
          
          return {
            ...order,
            profiles: { name: profile?.name || "Unknown Chef" },
          };
        })
      );

      setOrders(ordersWithChef);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "delivered":
        return "default";
      case "pending":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleReviewSubmit = async () => {
    if (!selectedOrder || rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("reviews")
        .insert({
          order_id: selectedOrder.id,
          customer_id: user.id,
          chef_id: selectedOrder.chef_id,
          rating,
          comment: comment || null,
        });

      if (error) throw error;

      toast.success("Review submitted successfully!");
      setReviewDialogOpen(false);
      setRating(0);
      setComment("");
      setSelectedOrder(null);
      if (user) fetchOrders(user.id);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    }
  };

  const openReviewDialog = (order: Order) => {
    setSelectedOrder(order);
    setRating(0);
    setComment("");
    setReviewDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">View your order history</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <ShoppingBag className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your orders...</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="pt-12 pb-12 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-6">
                Start exploring delicious homemade meals from local chefs
              </p>
              <button
                onClick={() => navigate("/meals")}
                className="text-primary hover:underline font-medium"
              >
                Browse Meals
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="shadow-soft hover:shadow-warm transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{order.meals.title}</CardTitle>
                      <CardDescription>
                        Chef: {order.profiles.name} • Quantity: {order.quantity}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(order.status) as any}>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Order Date: {new Date(order.created_at).toLocaleDateString("en-DK", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">Order ID: {order.id.slice(0, 8)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">kr {order.total_price}</p>
                    </div>
                  </div>
                  {order.status === "delivered" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReviewDialog(order)}
                          className="w-full"
                        >
                          Leave Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Review Your Order</DialogTitle>
                          <DialogDescription>
                            Share your experience with {order.profiles.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Rating</Label>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setRating(star)}
                                  className="focus:outline-none transition-transform hover:scale-110"
                                >
                                  <Star
                                    className={`h-8 w-8 ${
                                      star <= rating
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="comment">Comment (Optional)</Label>
                            <Textarea
                              id="comment"
                              placeholder="Share your thoughts about the meal..."
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              rows={4}
                            />
                          </div>
                          <Button onClick={handleReviewSubmit} className="w-full">
                            Submit Review
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;