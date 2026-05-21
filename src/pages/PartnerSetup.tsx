import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChefHat, ArrowRight, CheckCircle2, Camera, Loader2 } from "lucide-react";

const CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Snacks", "Dessert", "Other"];

const PartnerSetup = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [chefId, setChefId] = useState<string | null>(null);
  const initialised = useRef(false);

  // Step 1
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("Nizampet");

  // Step 2
  const [mealTitle, setMealTitle] = useState("");
  const [mealPrice, setMealPrice] = useState("");
  const [mealCategory, setMealCategory] = useState("");
  const [mealImage, setMealImage] = useState<File | null>(null);
  const [mealImagePreview, setMealImagePreview] = useState<string | null>(null);

  useEffect(() => {
    // onAuthStateChange handles email confirmation redirect tokens properly
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          initUser(session.user.id);
        } else if (event === "SIGNED_OUT") {
          navigate("/login");
        }
      }
    );
    // Also check immediately for already-logged-in users
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) initUser(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const initUser = async (uid: string) => {
    if (initialised.current) return;
    initialised.current = true;
    setUserId(uid);

    const { data: profile } = await supabase
      .from("profiles").select("name").eq("id", uid).single();
    if (profile?.name) setName(profile.name);

    const { data: chef, error: fetchError } = await (supabase as any)
      .from("chefs").select("id, phone_number")
      .eq("user_id", uid).maybeSingle();

    if (fetchError) {
      console.error("Error fetching chef:", fetchError);
    }

    if (chef) {
      setChefId(chef.id);
      if (chef.phone_number) setPhone(chef.phone_number);
      if (chef.area) setArea(chef.area);
    } else {
      const { data: newChef, error: insertError } = await (supabase as any)
        .from("chefs").insert({ user_id: uid }).select("id").single();
      if (insertError) {
        console.error("Error creating chef profile:", insertError);
        toast.error("Failed to create chef profile. Please try again.");
      }
      if (newChef) setChefId(newChef.id);
    }
  };

  const saveStep1 = async () => {
    if (!name.trim()) { toast.error("Please enter your name"); return; }
    if (!phone.trim()) { toast.error("Please enter your phone number"); return; }
    if (!userId) { toast.error("Session not ready — please wait a moment and try again"); return; }

    setSaving(true);
    try {
      await supabase.from("profiles").update({ name }).eq("id", userId);

      // If chef record wasn't created yet, create or fetch it now
      let activeChefId = chefId;
      if (!activeChefId) {
        const { data: existing } = await (supabase as any)
          .from("chefs").select("id").eq("user_id", userId).maybeSingle();
        if (existing) {
          activeChefId = existing.id;
        } else {
          const { data: newChef, error: insertError } = await (supabase as any)
            .from("chefs").insert({ user_id: userId }).select("id").single();
          if (insertError) throw new Error("Could not create chef profile: " + insertError.message);
          activeChefId = newChef.id;
        }
        setChefId(activeChefId);
      }

      const { error: updateError } = await (supabase as any).from("chefs")
        .update({ phone_number: phone }).eq("id", activeChefId);
      if (updateError) throw new Error("Could not save profile: " + updateError.message);

      setStep(2);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMealImage(file);
    setMealImagePreview(URL.createObjectURL(file));
  };

  const saveStep2 = async () => {
    if (!mealTitle.trim()) { toast.error("Please enter a meal name"); return; }
    if (!mealPrice || Number(mealPrice) < 1) { toast.error("Please enter a valid price"); return; }
    if (!mealCategory) { toast.error("Please select a category"); return; }

    setSaving(true);
    try {
      let imageUrl = null;

      if (mealImage) {
        const ext = mealImage.name.split(".").pop();
        const path = `meals/${chefId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("meal-images").upload(path, mealImage);
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("meal-images").getPublicUrl(path);
          imageUrl = urlData.publicUrl;
        }
      }

      const { error: mealError } = await (supabase as any).from("meals").insert({
        chef_id: userId,
        title: mealTitle,
        description: `Fresh homemade ${mealTitle} prepared in Nizampet.`,
        price: Number(mealPrice),
        category: mealCategory.toLowerCase(),
        image_url: imageUrl,
        available: true,
      });

      if (mealError) throw new Error("Could not save meal: " + mealError.message);
      setStep(3);
    } catch (e: any) {
      toast.error(e.message || "Failed to save meal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex flex-col items-center justify-center p-4">

      {/* Progress dots */}
      <div className="flex items-center gap-3 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
              ${step > s ? "bg-green-500 text-white" : step === s ? "bg-primary text-white scale-110 shadow-lg" : "bg-white text-gray-400 border-2 border-gray-200"}`}>
              {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            {s < 3 && <div className={`w-12 h-1 rounded-full transition-all ${step > s ? "bg-green-500" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ChefHat className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Let's set up your kitchen!</h1>
              <p className="text-muted-foreground text-sm mt-1">Just 2 quick steps to go live</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Your Name</Label>
                <Input
                  placeholder="e.g. Lakshmi Devi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label>WhatsApp Number</Label>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Customers will contact you on this number</p>
              </div>
              <div>
                <Label>Your Area / Locality</Label>
                <Input
                  placeholder="e.g. Nizampet"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={saveStep1} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Next — Add Your First Meal
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🍽️</div>
              <h1 className="text-2xl font-bold">Add your first meal</h1>
              <p className="text-muted-foreground text-sm mt-1">You can add more meals later from your dashboard</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Meal Name</Label>
                <Input
                  placeholder="e.g. Veg Biryani, Idli Sambar..."
                  value={mealTitle}
                  onChange={(e) => setMealTitle(e.target.value)}
                />
              </div>

              <div>
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 120"
                  min={1}
                  value={mealPrice}
                  onChange={(e) => setMealPrice(e.target.value)}
                />
              </div>

              <div>
                <Label>Category</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setMealCategory(cat)}
                      className={`py-2 px-3 rounded-xl text-sm font-medium border-2 transition-all
                        ${mealCategory === cat
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-gray-200 text-gray-600 hover:border-primary/50"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Photo <span className="text-muted-foreground font-normal">(optional but recommended)</span></Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                {mealImagePreview ? (
                  <div className="relative mt-2 rounded-xl overflow-hidden h-36 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}>
                    <img src={mealImagePreview} className="w-full h-full object-cover" alt="meal preview" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white text-sm font-medium">Change photo</span>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 w-full h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors text-muted-foreground"
                  >
                    <Camera className="h-6 w-6" />
                    <span className="text-sm">Tap to add photo</span>
                  </button>
                )}
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={saveStep2} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Go Live! 🚀
            </Button>

            <button
              className="w-full text-sm text-muted-foreground hover:underline"
              onClick={() => navigate("/partner")}
            >
              Skip — I'll add meals later
            </button>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="text-center space-y-6">
            <div className="text-6xl">🎉</div>
            <div>
              <h1 className="text-2xl font-bold text-green-600">You're Live!</h1>
              <p className="text-muted-foreground mt-2">
                Your kitchen is set up and your first meal is ready to receive orders.
              </p>
            </div>

            <div className="bg-green-50 rounded-2xl p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Profile created
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                First meal added — {mealTitle}
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Ready to accept orders
              </div>
            </div>

            <div className="space-y-3">
              <Button className="w-full" size="lg" onClick={() => navigate("/partner")}>
                Go to My Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground">
                Add payout details in your dashboard to start receiving payments
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Step labels */}
      <div className="flex gap-16 mt-4 text-xs text-muted-foreground">
        <span className={step === 1 ? "text-primary font-medium" : ""}>Your Info</span>
        <span className={step === 2 ? "text-primary font-medium" : ""}>First Meal</span>
        <span className={step === 3 ? "text-primary font-medium" : ""}>Go Live</span>
      </div>
    </div>
  );
};

export default PartnerSetup;
