import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import SEOHead from "@/components/SEOHead";
import AuthModal from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowLeft,
  ChefHat,
  Loader2,
  MapPin,
  Plus,
  ShoppingCart,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Meal {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string;
  available: boolean;
  chef_id: string;
  chef_name: string;
  spice_levels: string[] | null;
  oil_options: string[] | null;
}

const MealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [spiceLevel, setSpiceLevel] = useState<string>("");
  const [oilPreference, setOilPreference] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Address state
  interface SavedAddress { id: string; address_line: string; area: string; pincode: string; }
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ address_line: "", area: "", pincode: "" });
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchSavedAddresses(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    fetchMeal();

    return () => subscription.unsubscribe();
  }, [id]);

  const fetchMeal = async () => {
    try {
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", data.chef_id)
        .single();

      const mealData = {
        ...data,
        chef_name: profile?.name || "Unknown Chef",
      };

      setMeal(mealData);

      if (mealData.spice_levels && mealData.spice_levels.length > 0) {
        setSpiceLevel(mealData.spice_levels[0]);
      }
      if (mealData.oil_options && mealData.oil_options.length > 0) {
        setOilPreference(mealData.oil_options[0]);
      }
    } catch (error) {
      console.error("Error fetching meal:", error);
      toast.error("Failed to load meal details");
      navigate("/meals");
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedAddresses = async (userId: string) => {
    const { data } = await supabase
      .from("addresses")
      .select("id, address_line, area, pincode")
      .eq("user_id", userId)
      .order("is_primary", { ascending: false });
    if (data && data.length > 0) {
      setSavedAddresses(data);
      setSelectedAddressId(data[0].id);
    } else {
      setShowNewAddress(true);
    }
  };

  const handleSaveNewAddress = async (): Promise<string | null> => {
    if (!newAddress.address_line.trim() || !newAddress.area.trim() || !newAddress.pincode.trim()) {
      toast.error("Please fill in all address fields");
      return null;
    }
    setSavingAddress(true);
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return null;
      const { data, error } = await supabase
        .from("addresses")
        .insert({
          user_id: u.id,
          address_line: newAddress.address_line.trim(),
          area: newAddress.area.trim(),
          pincode: newAddress.pincode.trim(),
          is_primary: savedAddresses.length === 0,
        })
        .select("id, address_line, area, pincode")
        .single();
      if (error) throw error;
      setSavedAddresses((prev) => [...prev, data]);
      setSelectedAddressId(data.id);
      setShowNewAddress(false);
      setNewAddress({ address_line: "", area: "", pincode: "" });
      return data.id;
    } catch (err: any) {
      toast.error(err.message || "Failed to save address");
      return null;
    } finally {
      setSavingAddress(false);
    }
  };

  const handleOrder = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!meal) return;

    // Resolve delivery address
    let addrId = selectedAddressId;
    if (showNewAddress || !addrId) {
      const saved = await handleSaveNewAddress();
      if (!saved) return;
      addrId = saved;
    }

    const deliveryAddr = savedAddresses.find((a) => a.id === addrId);
    const deliveryText = deliveryAddr
      ? `${deliveryAddr.address_line}, ${deliveryAddr.area} - ${deliveryAddr.pincode}`
      : "";

    setOrdering(true);

    try {
      const totalPrice = meal.price * quantity;

      // 1. Create order (status pending, payment_status pending)
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          meal_id: meal.id,
          customer_id: user.id,
          chef_id: meal.chef_id,
          quantity,
          total_price: totalPrice,
          status: "pending",
          delivery_address: deliveryText,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      await supabase.from("order_items").insert({
        order_id: order.id,
        meal_id: meal.id,
        quantity,
        price_per_unit: meal.price,
        subtotal: totalPrice,
        spice_level: spiceLevel || null,
        oil_preference: oilPreference || null,
      });

      // 2. Open Razorpay checkout
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey || !window.Razorpay) {
        // No Razorpay key — skip payment, mark as pending
        toast.success("Order placed! Awaiting payment setup.");
        navigate("/orders");
        return;
      }

      const options = {
        key: razorpayKey,
        amount: Math.round(totalPrice * 100), // paise
        currency: "INR",
        name: "MyHomePlate",
        description: `${meal.title} x${quantity}`,
        order_id: undefined as string | undefined, // server-side order id (optional for test)
        prefill: {
          email: user.email,
        },
        theme: { color: "#0f766e" },
        handler: async (response: { razorpay_payment_id: string }) => {
          // 3. On payment success — update order with payment_id
          await supabase
            .from("orders")
            .update({
              payment_id: response.razorpay_payment_id,
              payment_status: "paid",
              status: "pending", // chef still needs to accept
            })
            .eq("id", order.id);

          toast.success("Payment successful! Order placed 🎉");
          navigate("/orders");
        },
        modal: {
          ondismiss: async () => {
            // User closed without paying — mark payment failed
            await supabase
              .from("orders")
              .update({ payment_status: "failed" })
              .eq("id", order.id);
            toast.error("Payment cancelled. Order was not confirmed.");
            setOrdering(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", async () => {
        await supabase
          .from("orders")
          .update({ payment_status: "failed" })
          .eq("id", order.id);
        toast.error("Payment failed. Please try again.");
        setOrdering(false);
      });
      rzp.open();
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast.error(error.message || "Failed to place order. Please try again.");
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Meal not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${meal.title} - MyHomePlate`}
        description={`Order ${meal.title} from ${
          meal.chef_name
        }. ${meal.description.substring(0, 120)}...`}
        image={meal.image_url || undefined}
      />
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/meals")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Meals
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
            {meal.image_url ? (
              <img
                src={meal.image_url}
                alt={meal.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <UtensilsCrossed className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-4xl font-bold">{meal.title}</h1>
                <Badge variant="secondary" className="text-sm">
                  {meal.category}
                </Badge>
              </div>
              <div className="flex items-center text-muted-foreground mb-4">
                <ChefHat className="h-4 w-4 mr-2" />
                <span>by {meal.chef_name}</span>
              </div>
              <p className="text-3xl font-bold text-primary mb-6">
                ₹{meal.price}
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                {meal.description}
              </p>
            </div>

            {meal.available ? (
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Place Your Order</CardTitle>
                  <CardDescription>Select quantity and confirm</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max="10"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                      }
                    />
                  </div>

                  {meal.spice_levels && meal.spice_levels.length > 0 && (
                    <div className="space-y-2">
                      <Label>Spice Level</Label>
                      <RadioGroup
                        value={spiceLevel}
                        onValueChange={setSpiceLevel}
                      >
                        {meal.spice_levels.map((level) => (
                          <div
                            key={level}
                            className="flex items-center space-x-2"
                          >
                            <RadioGroupItem
                              value={level}
                              id={`spice-${level}`}
                            />
                            <Label
                              htmlFor={`spice-${level}`}
                              className="capitalize cursor-pointer"
                            >
                              {level}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {meal.oil_options && meal.oil_options.length > 0 && (
                    <div className="space-y-2">
                      <Label>Oil Preference</Label>
                      <RadioGroup
                        value={oilPreference}
                        onValueChange={setOilPreference}
                      >
                        {meal.oil_options.map((option) => (
                          <div
                            key={option}
                            className="flex items-center space-x-2"
                          >
                            <RadioGroupItem
                              value={option}
                              id={`oil-${option}`}
                            />
                            <Label
                              htmlFor={`oil-${option}`}
                              className="capitalize cursor-pointer"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {/* Delivery Address */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Delivery Address
                    </Label>

                    {savedAddresses.length > 0 && !showNewAddress && (
                      <RadioGroup
                        value={selectedAddressId}
                        onValueChange={setSelectedAddressId}
                        className="space-y-2"
                      >
                        {savedAddresses.map((addr) => (
                          <div key={addr.id} className="flex items-start space-x-2 border rounded-md p-3">
                            <RadioGroupItem value={addr.id} id={`addr-${addr.id}`} className="mt-0.5" />
                            <Label htmlFor={`addr-${addr.id}`} className="cursor-pointer leading-snug">
                              {addr.address_line}, {addr.area} — {addr.pincode}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {showNewAddress ? (
                      <div className="border rounded-md p-3 space-y-2">
                        <Input
                          placeholder="Street / Flat / Building"
                          value={newAddress.address_line}
                          onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Area / Locality"
                            value={newAddress.area}
                            onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                          />
                          <Input
                            placeholder="Pincode"
                            value={newAddress.pincode}
                            onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                          />
                        </div>
                        {savedAddresses.length > 0 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewAddress(false)}>
                            ← Use saved address
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setShowNewAddress(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add new address
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      ₹{(meal.price * quantity).toFixed(2)}
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleOrder}
                    disabled={ordering || !meal.available}
                  >
                    {ordering ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Order Now
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    This meal is currently unavailable
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
};

export default MealDetail;
