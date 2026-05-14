import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getCommissionPercentage } from "@/lib/commissionUtils";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  UtensilsCrossed,
  IndianRupee,
  ShoppingBag,
  ImagePlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useRef } from "react";
import type { User } from "@supabase/supabase-js";

const MEAL_CATEGORIES = [
  { value: "breakfast", label: "Breakfast", icon: "🍳", hint: "Idli, dosa, upma, paratha & more" },
  { value: "lunch",     label: "Lunch",     icon: "🍱", hint: "Dal, rice, sabzi, roti & more" },
  { value: "dinner",    label: "Dinner",    icon: "🍛", hint: "Curry, chapati, rice & more" },
  { value: "snacks",    label: "Snacks",    icon: "🥪", hint: "Samosa, sandwich, tea-time bites" },
  { value: "dessert",   label: "Dessert",   icon: "🍰", hint: "Kheer, halwa, gulab jamun & more" },
  { value: "other",     label: "Other",     icon: "🍽️", hint: "Anything that doesn't fit above" },
] as const;

const categoryMeta = (value: string) =>
  MEAL_CATEGORIES.find((c) => c.value === value) ?? { icon: "🍽️", label: value };

interface Meal {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string;
  available: boolean;
}

interface Order {
  id: string;
  quantity: number;
  total_price: number;
  status: string;
  payment_status: string | null;
  payment_id: string | null;
  created_at: string;
  customer_id: string;
  meals: { title: string };
  profiles: { name: string; email: string };
}

const ChefDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ totalEarnings: 0, totalOrders: 0 });
  const [commissionRate, setCommissionRate] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    image_url: "",
    available: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      toast.error("Please sign in to access chef dashboard");
      navigate("/login");
      return;
    }

    setUser(session.user);

    // Check if user is a chef
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "chef")
      .single();

    if (!roles) {
      toast.error("You must be a chef to access this page");
      navigate("/");
      return;
    }

    fetchMeals(session.user.id);
    fetchOrders(session.user.id);

    // Realtime — refresh orders when a new one lands for this chef
    const channel = supabase
      .channel("chef-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `chef_id=eq.${session.user.id}` },
        () => {
          fetchOrders(session.user.id);
          toast.info("New order received!");
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const fetchMeals = async (userId: string) => {
    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq("chef_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load meals");
      return;
    }

    setMeals(data || []);
  };

  const fetchOrders = async (userId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, meals (title)")
      .eq("chef_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load orders");
      return;
    }

    // Fetch customer names and emails
    const ordersWithCustomer = await Promise.all(
      (data || []).map(async (order: any) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, email")
          .eq("id", order.customer_id)
          .single();

        return {
          ...order,
          profiles: { name: profile?.name || "Unknown", email: profile?.email || "" },
        };
      })
    );

    setOrders(ordersWithCustomer);

    // Calculate stats with dynamic commission
    const rate = await getCommissionPercentage();
    setCommissionRate(rate);
    const chefPercentage = (100 - rate) / 100;
    const earnings =
      data?.reduce((sum, order) => {
        if (order.status === "paid" || order.status === "delivered") {
          return sum + Number(order.total_price) * chefPercentage; // Dynamic commission
        }
        return sum;
      }, 0) || 0;

    setStats({
      totalEarnings: earnings,
      totalOrders: data?.length || 0,
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData((f) => ({ ...f, image_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("images")
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUploading(true);
    try {
      let imageUrl = formData.image_url;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, user.id);
      }

      const mealData = {
        ...formData,
        price: parseFloat(formData.price),
        chef_id: user.id,
        image_url: imageUrl || null,
      };

      if (editingMeal) {
        const { error } = await supabase.from("meals").update(mealData).eq("id", editingMeal.id);
        if (error) throw error;
        toast.success("Meal updated successfully");
      } else {
        const { error } = await supabase.from("meals").insert(mealData);
        if (error) throw error;
        toast.success("Meal added to your menu!");
      }

      setDialogOpen(false);
      resetForm();
      fetchMeals(user.id);
    } catch (error: any) {
      console.error("Error saving meal:", error);
      toast.error(error.message || "Failed to save meal");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (meal: Meal) => {
    setEditingMeal(meal);
    setFormData({
      title: meal.title,
      description: meal.description,
      price: meal.price.toString(),
      category: meal.category,
      image_url: meal.image_url || "",
      available: meal.available,
    });
    setImageFile(null);
    setImagePreview(meal.image_url || "");
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this meal?")) return;

    const { error } = await supabase.from("meals").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete meal");
      return;
    }

    toast.success("Meal deleted");
    if (user) fetchMeals(user.id);
  };

  const updateOrderStatus = async (order: Order, newStatus: string) => {
    // If chef is rejecting a paid order, trigger a full refund first
    if (newStatus === "cancelled" && order.payment_id && order.payment_status === "paid") {
      const refundRes = await supabase.functions.invoke("process-refund", {
        body: {
          payment_id: order.payment_id,
          notes: { reason: "Chef rejected order" },
        },
      });

      if (refundRes.error) {
        toast.error("Refund failed — order not cancelled. Contact support.");
        return;
      }

      // Mark payment as refunded alongside cancellation
      await supabase
        .from("orders")
        .update({ status: "cancelled", payment_status: "refunded" })
        .eq("id", order.id);

      toast.success("Order rejected — customer refund initiated");
    } else {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", order.id);

      if (error) { toast.error("Failed to update order"); return; }

      toast.success(`Order ${newStatus}`);
    }

    if (user) fetchOrders(user.id);

    // Email customer about status change
    supabase.functions.invoke("send-email-notification", {
      body: {
        to: order.profiles.email,
        event: newStatus,
        customerName: order.profiles.name,
        chefName: "",
        mealTitle: order.meals.title,
        orderId: order.id,
        totalPrice: order.total_price,
        quantity: order.quantity,
      },
    }).catch(() => {});
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", price: "", category: "", image_url: "", available: true });
    setEditingMeal(null);
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Kitchen</h1>
            <p className="text-muted-foreground">
              Manage your meals and orders
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Meal
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-auto max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingMeal ? "Edit Meal" : "Add New Meal"}
                </DialogTitle>
                <DialogDescription>
                  Fill in the details of your homemade dish
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Dish Name</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="1"
                      min="1"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="e.g. 120"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Meal Type <span className="text-destructive">*</span></Label>
                    <div className="flex flex-wrap gap-2">
                      {MEAL_CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat.value })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-sm font-medium transition-all ${
                            formData.category === cat.value
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                    {formData.category && (
                      <p className="text-xs text-muted-foreground">
                        {MEAL_CATEGORIES.find((c) => c.value === formData.category)?.hint}
                      </p>
                    )}
                    {!formData.category && (
                      <p className="text-xs text-destructive">Please select a meal type</p>
                    )}
                  </div>
                </div>

                {/* Image upload */}
                <div className="space-y-2">
                  <Label>Dish Photo <span className="text-muted-foreground font-normal">(optional · max 5 MB)</span></Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-44 object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); clearImage(); }}
                          className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                          Click to change photo
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                        <ImagePlus className="h-9 w-9" />
                        <p className="text-sm font-medium">Click to upload a photo</p>
                        <p className="text-xs">JPG, PNG, WebP or GIF</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="available"
                    checked={formData.available}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, available: checked })
                    }
                  />
                  <Label htmlFor="available">Available for orders</Label>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading
                      ? (imageFile ? "Uploading photo…" : "Saving…")
                      : editingMeal ? "Update Meal" : "Add Meal"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Earnings ({100 - commissionRate}%)
              </CardTitle>
              <IndianRupee className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                INR {stats.totalEarnings.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Orders
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Active Meals
              </CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {meals.filter((m) => m.available).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Meals */}
        <Card className="mb-8 shadow-soft">
          <CardHeader>
            <CardTitle>My Meals</CardTitle>
            <CardDescription>Manage your menu</CardDescription>
          </CardHeader>
          <CardContent>
            {meals.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium mb-1">No meals yet</p>
                <p className="text-sm">Add your first dish to start taking orders!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {MEAL_CATEGORIES.filter((cat) =>
                  meals.some((m) => m.category === cat.value)
                ).map((cat) => {
                  const group = meals.filter((m) => m.category === cat.value);
                  return (
                    <div key={cat.value}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">{cat.icon}</span>
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                          {cat.label}
                        </h3>
                        <span className="text-xs text-muted-foreground">({group.length})</span>
                      </div>
                      <div className="space-y-2">
                        {group.map((meal) => {
                          const meta = categoryMeta(meal.category);
                          return (
                            <div
                              key={meal.id}
                              className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/40 transition-colors gap-3"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                                  {meal.image_url ? (
                                    <img src={meal.image_url} alt={meal.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-2xl">{meta.icon}</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-sm truncate">{meal.title}</h3>
                                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                    {meal.description}
                                  </p>
                                  <Badge
                                    variant={meal.available ? "default" : "outline"}
                                    className="text-[10px] mt-1 h-4 px-1.5"
                                  >
                                    {meal.available ? "On menu" : "Hidden"}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <p className="text-base font-bold text-primary">₹{meal.price}</p>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(meal)}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(meal.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {/* Meals with unrecognised categories */}
                {meals.filter((m) => !MEAL_CATEGORIES.some((c) => c.value === m.category)).length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">🍽️</span>
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Other</h3>
                    </div>
                    <div className="space-y-2">
                      {meals.filter((m) => !MEAL_CATEGORIES.some((c) => c.value === m.category)).map((meal) => (
                        <div key={meal.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/40 transition-colors gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                              {meal.image_url ? (
                                <img src={meal.image_url} alt={meal.title} className="w-full h-full object-cover" />
                              ) : (
                                <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm truncate">{meal.title}</h3>
                              <Badge variant="secondary" className="text-[10px] mt-1">{meal.category}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <p className="text-base font-bold text-primary">₹{meal.price}</p>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(meal)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(meal.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Orders from customers</CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-start justify-between p-4 border rounded-lg gap-4"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{order.meals.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Customer: {order.profiles.name} • Qty: {order.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="font-bold text-primary">₹{order.total_price}</p>
                      <Badge
                        variant={
                          order.status === "delivered" || order.status === "accepted"
                            ? "default"
                            : order.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {order.status}
                      </Badge>
                      {order.status === "pending" && order.payment_status === "paid" && (
                        <div className="flex gap-2 mt-1">
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order, "accepted")}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateOrderStatus(order, "cancelled")}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChefDashboard;
