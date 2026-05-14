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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { toast } from "sonner";
import {
  Calendar,
  ChefHat,
  CheckCircle2,
  Sparkles,
  TrendingDown,
  ShieldCheck,
  Star,
  PauseCircle,
  PlayCircle,
} from "lucide-react";

// ─── Plan definitions (keep in sync with ChefProfile.tsx MEAL_PLANS) ─────────
const MEAL_PLANS = {
  breakfast: {
    label: "Breakfast",
    icon: "🍳",
    tagline: "Idli, dosa, upma, poha, paratha & more",
    weekly:  { meals: 5,  days: 7,  price: 400,  pricePerMeal: 80,  savingsLabel: null },
    monthly: { meals: 20, days: 30, price: 1400, pricePerMeal: 70,  savingsLabel: "Save ₹200 vs 4 weekly orders" },
  },
  lunch: {
    label: "Lunch",
    icon: "🍱",
    tagline: "Dal, rice, sabzi, roti, pickle & more",
    weekly:  { meals: 5,  days: 7,  price: 625,  pricePerMeal: 125, savingsLabel: null },
    monthly: { meals: 20, days: 30, price: 2150, pricePerMeal: 107, savingsLabel: "Save ₹350 vs 4 weekly orders" },
  },
  dinner: {
    label: "Dinner",
    icon: "🍛",
    tagline: "Curry, chapati, rice, dal & more",
    weekly:  { meals: 5,  days: 7,  price: 625,  pricePerMeal: 125, savingsLabel: null },
    monthly: { meals: 20, days: 30, price: 2150, pricePerMeal: 107, savingsLabel: "Save ₹350 vs 4 weekly orders" },
  },
};

type MealType = keyof typeof MEAL_PLANS;
const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

const PLAN_FEATURES = {
  weekly: [
    "5 freshly cooked weekday meals",
    "Choose your preferred home chef",
    "Flexible delivery schedule",
    "Cancel any week — no lock-in",
  ],
  monthly: [
    "20 meals — best price per meal",
    "Priority scheduling with your chef",
    "Pause any week, resume anytime",
    "Mix and match from the full menu",
  ],
};

const FAQS = [
  {
    q: 'What\'s the difference between Breakfast, Lunch, and Dinner plans?',
    a: 'Breakfast plans cover light morning items — idli, dosa, upma, poha, paratha etc. — at ₹80/meal. Lunch and Dinner plans cover a full home-cooked meal — dal, rice, sabzi, roti, curry etc. — at ₹125/meal. You coordinate exact items and delivery time with your chef.',
  },
  {
    q: "Can I choose which meals I receive each day?",
    a: "Yes — when subscribing through a chef's profile you can pick from their available menu. Meal preferences and delivery details are coordinated directly with your chef.",
  },
  {
    q: "What if I want to skip a day?",
    a: "Pause your subscription at any time from 'Your Subscriptions' below. Paused days don't count against your remaining meals.",
  },
  {
    q: "Can I subscribe to more than one chef at a time?",
    a: "Yes. You can have multiple active subscriptions — for example, one chef for breakfast and another for lunch or dinner.",
  },
  {
    q: "Is there a minimum commitment?",
    a: "No. Both plans can be cancelled at any time. Remaining meals stay valid until the subscription period ends.",
  },
];

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "Breakfast 🍳",
  lunch: "Lunch 🍱",
  dinner: "Dinner 🍛",
};

// ─── Component ────────────────────────────────────────────────────────────────
const Subscriptions = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [calendarSub, setCalendarSub] = useState<any | null>(null);
  const [pausingId, setPausingId] = useState<string | null>(null);
  const [activeMealType, setActiveMealType] = useState<MealType>("lunch");

  useEffect(() => { checkAuthAndFetch(); }, []);

  const checkAuthAndFetch = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      await fetchSubscriptions(user.id);
    } catch {
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

      const subsWithChefs = await Promise.all(
        (data || []).map(async (sub) => {
          const { data: chefData } = await supabase
            .from("chefs").select("user_id").eq("id", sub.chef_id).single();
          if (chefData) {
            const { data: profileData } = await supabase
              .from("profiles").select("name").eq("id", chefData.user_id).single();
            return { ...sub, chef_name: profileData?.name || "Chef" };
          }
          return { ...sub, chef_name: "Chef" };
        })
      );
      setSubscriptions(subsWithChefs);
    } catch {
      // silently fail — subscriptions just won't show
    }
  };

  const handlePause = async (sub: any) => {
    const newStatus = sub.status === "active" ? "paused" : "active";
    setPausingId(sub.id);
    try {
      const { error } = await supabase
        .from("subscriptions").update({ status: newStatus }).eq("id", sub.id);
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

  const daysRemaining = (endDate: string) =>
    Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000));

  const activePlan = MEAL_PLANS[activeMealType];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-6 pb-12 max-w-5xl">

        {/* ── Compact header ── */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Daily Meal Subscriptions
          </h1>
          <div className="flex flex-wrap gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingDown className="h-3.5 w-3.5 text-green-600" />
              Breakfast from ₹70/meal · Lunch &amp; Dinner from ₹107/meal
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Cancel or pause anytime
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 text-amber-500" />
              Verified home chefs only
            </span>
          </div>
        </div>

        {/* ── Meal type tabs ── */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {MEAL_TYPES.map((mt) => {
            const m = MEAL_PLANS[mt];
            return (
              <button
                key={mt}
                onClick={() => setActiveMealType(mt)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                  activeMealType === mt
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <span className="text-lg leading-none">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Meal type tagline */}
        <p className="text-xs text-muted-foreground mb-4">{activePlan.tagline}</p>

        {/* ── Plan cards ── */}
        <div className="grid md:grid-cols-2 gap-6 mb-4">
          {(["weekly", "monthly"] as const).map((planKey) => {
            const plan = activePlan[planKey];
            const isMonthly = planKey === "monthly";
            return (
              <Card
                key={planKey}
                className={`border-2 relative transition-shadow hover:shadow-warm ${
                  isMonthly ? "border-primary/60" : "border-border"
                }`}
              >
                {isMonthly && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs gap-1">
                      <Sparkles className="h-3 w-3" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-2 pt-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl capitalize">{planKey} Plan</CardTitle>
                      <CardDescription>{plan.meals} meals · {plan.days} days</CardDescription>
                    </div>
                    {isMonthly && (
                      <span className="text-[11px] bg-green-100 text-green-700 font-semibold px-2 py-1 rounded-full shrink-0">
                        Best Value
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pb-5">
                  <div>
                    <div className="flex items-end gap-1.5">
                      <span className="text-3xl font-bold text-primary">₹{plan.price}</span>
                      <span className="text-xs text-muted-foreground mb-1">
                        / {planKey === "weekly" ? "week" : "month"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">₹{plan.pricePerMeal} per meal</p>
                    {plan.savingsLabel && (
                      <p className="text-xs font-semibold text-green-600 mt-0.5">{plan.savingsLabel}</p>
                    )}
                  </div>

                  <Separator />

                  <ul className="space-y-1.5">
                    {PLAN_FEATURES[planKey].map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    size="sm"
                    variant={isMonthly ? "default" : "outline"}
                    onClick={() => navigate("/chefs", { state: { fromSubscriptions: true } })}
                  >
                    Choose a Chef →
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Fine print */}
        <p className="text-center text-xs text-muted-foreground mb-5">
          Razorpay secured · No hidden charges · Verified home chefs
        </p>

        {/* ── Compact "How it works" strip ── */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          {[
            { step: "01", text: "Pick a home chef from our verified list" },
            { step: "02", text: "Choose your meal type and Weekly or Monthly plan" },
            { step: "03", text: "Pay once — get fresh meals delivered every day" },
          ].map((s) => (
            <div key={s.step} className="flex items-center gap-2 flex-1 bg-muted/40 rounded-lg px-3 py-2">
              <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                {s.step}
              </span>
              <p className="text-xs text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>

        <Separator className="mb-6" />

        {/* ── Your Subscriptions ── */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">Your Subscriptions</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/chefs", { state: { fromSubscriptions: true } })}
            >
              + New
            </Button>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <ChefHat className="h-8 w-8 text-primary animate-pulse mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading…</p>
              </CardContent>
            </Card>
          ) : subscriptions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-1">No subscriptions yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Pick a chef and subscribe to Breakfast, Lunch, or Dinner to start receiving fresh meals daily.
                </p>
                <Button size="sm" onClick={() => navigate("/chefs", { state: { fromSubscriptions: true } })}>
                  Browse Chefs
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((sub) => {
                const mealsUsed = sub.meals_count - sub.meals_remaining;
                const progressPct = Math.round((mealsUsed / sub.meals_count) * 100);
                const days = daysRemaining(sub.end_date);
                const isActive = sub.status === "active";
                const isPaused = sub.status === "paused";

                return (
                  <Card key={sub.id} className={isPaused ? "opacity-75" : ""}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{sub.chef_name}</h3>
                            {sub.meal_type && (
                              <Badge variant="outline" className="text-xs">
                                {MEAL_TYPE_LABELS[sub.meal_type]}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground capitalize mt-0.5">
                            {sub.plan_type} Plan · ₹{sub.price_per_meal}/meal
                          </p>
                        </div>
                        <Badge variant={isActive ? "default" : "secondary"} className="capitalize text-xs">
                          {isActive && (
                            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
                          )}
                          {sub.status}
                        </Badge>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{mealsUsed} delivered</span>
                          <span>{sub.meals_remaining} of {sub.meals_count} remaining</span>
                        </div>
                        <Progress value={progressPct} className="h-1.5" />
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                        <div>
                          <p className="text-muted-foreground">Days Left</p>
                          <p className="font-semibold">{days}d</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">End Date</p>
                          <p className="font-semibold">
                            {new Date(sub.end_date).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short",
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Paid</p>
                          <p className="font-semibold">
                            ₹{sub.total_price ?? sub.price_per_meal * sub.meals_count}
                          </p>
                        </div>
                      </div>

                      {(isActive || isPaused) && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2"
                            onClick={() => setCalendarSub(sub)}>
                            <Calendar className="h-3 w-3 mr-1" />
                            Calendar
                          </Button>
                          <Button
                            size="sm"
                            variant={isPaused ? "default" : "outline"}
                            className="h-7 text-xs px-2"
                            disabled={pausingId === sub.id}
                            onClick={() => handlePause(sub)}
                          >
                            {pausingId === sub.id ? "…" : isPaused
                              ? <><PlayCircle className="h-3 w-3 mr-1" />Resume</>
                              : <><PauseCircle className="h-3 w-3 mr-1" />Pause</>}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <Separator className="mb-6" />

        {/* ── FAQ ── */}
        <section>
          <h2 className="text-xl font-bold mb-3">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border rounded-xl px-4">
                <AccordionTrigger className="text-sm font-medium text-left py-3 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground pb-3 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

      </main>

      {/* ── Calendar Dialog ── */}
      {calendarSub && (
        <Dialog open={!!calendarSub} onOpenChange={(open) => { if (!open) setCalendarSub(null); }}>
          <DialogContent className="w-[95vw] max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {calendarSub.chef_name} —{" "}
                {calendarSub.meal_type ? MEAL_TYPE_LABELS[calendarSub.meal_type] : ""}{" "}
                {calendarSub.plan_type === "weekly" ? "Weekly" : "Monthly"} Plan
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-3">
              <p className="text-xs text-muted-foreground text-center">
                Active from{" "}
                <strong>
                  {new Date(calendarSub.start_date).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </strong>{" "}
                to{" "}
                <strong>
                  {new Date(calendarSub.end_date).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </strong>
              </p>
              <div className="overflow-x-auto w-full flex justify-center">
                <CalendarComponent
                  mode="range"
                  selected={{
                    from: new Date(calendarSub.start_date),
                    to: new Date(calendarSub.end_date),
                  }}
                  defaultMonth={new Date(calendarSub.start_date)}
                  disabled={{
                    before: new Date(calendarSub.start_date),
                    after: new Date(calendarSub.end_date),
                  }}
                />
              </div>
              <div className="w-full space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Meals remaining</span>
                  <span className="font-semibold text-xs">
                    {calendarSub.meals_remaining} / {calendarSub.meals_count}
                  </span>
                </div>
                <Progress
                  value={Math.round(
                    ((calendarSub.meals_count - calendarSub.meals_remaining) /
                      calendarSub.meals_count) * 100
                  )}
                  className="h-1.5"
                />
                <p className="text-xs text-muted-foreground text-center">
                  ₹{calendarSub.price_per_meal} per meal
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Subscriptions;
