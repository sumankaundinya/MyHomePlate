import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Calendar, ChefHat, IndianRupee } from "lucide-react";

const Subscriptions = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [calendarSub, setCalendarSub] = useState<any | null>(null);
  const [pausingId, setPausingId] = useState<string | null>(null);

  const handlePause = async (sub: any) => {
    const newStatus = sub.status === "active" ? "paused" : "active";
    setPausingId(sub.id);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: newStatus })
        .eq("id", sub.id);
      if (error) throw error;
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, status: newStatus } : s))
      );
      toast.success(newStatus === "paused" ? "Subscription paused" : "Subscription resumed");
    } catch (err: any) {
      toast.error(err.message || "Failed to update subscription");
    } finally {
      setPausingId(null);
    }
  };

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      await fetchSubscriptions(user.id);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("customer_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch chef names
      const subsWithChefs = await Promise.all(
        (data || []).map(async (sub) => {
          const { data: chefData } = await supabase
            .from("chefs")
            .select("user_id")
            .eq("id", sub.chef_id)
            .single();

          if (chefData) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("name")
              .eq("id", chefData.user_id)
              .single();

            return { ...sub, chef_name: profileData?.name || "Chef" };
          }
          return { ...sub, chef_name: "Chef" };
        })
      );

      setSubscriptions(subsWithChefs);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
            Tiffin Subscriptions
          </h1>
          <p className="text-muted-foreground">
            Subscribe to your favorite home chefs for regular homemade meals
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="border-2 hover:shadow-warm transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl">Weekly Plan</CardTitle>
              <CardDescription>5 meals per week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold text-primary">₹500-750</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Choose your preferred chef</li>
                <li>✓ Select meals from chef's menu</li>
                <li>✓ Flexible delivery schedule</li>
                <li>✓ Cancel anytime</li>
              </ul>
              <Button className="w-full" onClick={() => navigate("/chefs")}>
                Choose a Chef
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-warm transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl">Monthly Plan</CardTitle>
              <CardDescription>20 meals per month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold text-primary">₹1800-2500</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Best value - save up to 20%</li>
                <li>✓ Priority scheduling</li>
                <li>✓ Mix and match meals</li>
                <li>✓ Pause or reschedule anytime</li>
              </ul>
              <Button className="w-full" onClick={() => navigate("/chefs")}>
                Choose a Chef
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Active Subscriptions */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Your Subscriptions</h2>

          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <ChefHat className="h-12 w-12 text-primary animate-pulse mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Loading subscriptions...
                </p>
              </CardContent>
            </Card>
          ) : subscriptions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  No active subscriptions
                </h3>
                <p className="text-muted-foreground mb-4">
                  Start a subscription to enjoy regular homemade meals
                </p>
                <Button onClick={() => navigate("/chefs")}>Browse Chefs</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <Card key={sub.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {sub.chef_name}
                        </h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {sub.plan_type} Plan
                        </p>
                      </div>
                      <Badge
                        variant={
                          sub.status === "active" ? "default" : "secondary"
                        }
                      >
                        {sub.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Meals Remaining</p>
                        <p className="font-semibold">
                          {sub.meals_remaining} / {sub.meals_count}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Price per Meal</p>
                        <p className="font-semibold">₹{sub.price_per_meal}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">End Date</p>
                        <p className="font-semibold">
                          {new Date(sub.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {(sub.status === "active" || sub.status === "paused") && (
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setCalendarSub(sub)}>
                          <Calendar className="h-3 w-3 mr-1" />
                          View Calendar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pausingId === sub.id}
                          onClick={() => handlePause(sub)}
                        >
                          {pausingId === sub.id
                            ? "Updating…"
                            : sub.status === "active"
                            ? "Pause"
                            : "Resume"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
      {/* Calendar Dialog */}
      {calendarSub && (
        <Dialog open={!!calendarSub} onOpenChange={(open) => { if (!open) setCalendarSub(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {calendarSub.chef_name} — {calendarSub.plan_type === "weekly" ? "Weekly" : "Monthly"} Plan
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-muted-foreground text-center">
                Subscription active from{" "}
                <strong>{new Date(calendarSub.start_date).toLocaleDateString()}</strong>{" "}to{" "}
                <strong>{new Date(calendarSub.end_date).toLocaleDateString()}</strong>
              </p>
              <CalendarComponent
                mode="range"
                selected={{
                  from: new Date(calendarSub.start_date),
                  to: new Date(calendarSub.end_date),
                }}
                defaultMonth={new Date(calendarSub.start_date)}
                disabled={{ before: new Date(calendarSub.start_date), after: new Date(calendarSub.end_date) }}
              />
              <div className="text-sm text-center space-y-1">
                <p><span className="font-semibold">{calendarSub.meals_remaining}</span> meals remaining out of <span className="font-semibold">{calendarSub.meals_count}</span></p>
                <p className="text-muted-foreground">₹{calendarSub.price_per_meal} per meal</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Subscriptions;
