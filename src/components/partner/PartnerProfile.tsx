import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, X, MapPin, Navigation, IndianRupee } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

interface PartnerProfileProps {
  chefId: string;
}

export const PartnerProfile = ({ chefId }: PartnerProfileProps) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    bio: "",
    kitchen_photo_url: "",
    hygiene_certificate: false,
    fssai_license: false,
    phone_number: "",
    notification_opt_in: true,
    delivery_fee: 0,
    delivery_radius_km: 3,
  });
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [address, setAddress] = useState({
    id: "",
    address_line: "",
    area: "",
    pincode: "",
    latitude: "",
    longitude: "",
  });
  const [addressLoading, setAddressLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [payoutDetails, setPayoutDetails] = useState({
    payout_method: "upi" as "upi" | "bank",
    upi_id: "",
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
  });
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutExists, setPayoutExists] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchSpecialties();
    fetchAddress();
    fetchPayoutDetails();
  }, [chefId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("chefs")
        .select("bio, kitchen_photo_url, hygiene_certificate, fssai_license, phone_number, notification_opt_in, delivery_fee, delivery_radius_km")
        .eq("id", chefId)
        .single();

      if (error) throw error;
      if (data) {
        setProfile({
          bio: data.bio || "",
          kitchen_photo_url: data.kitchen_photo_url || "",
          hygiene_certificate: data.hygiene_certificate,
          fssai_license: data.fssai_license,
          phone_number: data.phone_number || "",
          notification_opt_in: data.notification_opt_in ?? true,
          delivery_fee: data.delivery_fee ?? 0,
          delivery_radius_km: data.delivery_radius_km ?? 3,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchSpecialties = async () => {
    try {
      const { data, error } = await supabase
        .from("chef_specialties")
        .select("specialty")
        .eq("chef_id", chefId);

      if (error) throw error;
      setSpecialties(data?.map(s => s.specialty) || []);
    } catch (error) {
      console.error("Error fetching specialties:", error);
    }
  };

  const fetchAddress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_primary", true)
        .maybeSingle();
      if (data) {
        setAddress({
          id: data.id,
          address_line: data.address_line || "",
          area: data.area || "",
          pincode: data.pincode || "",
          latitude: data.latitude?.toString() || "",
          longitude: data.longitude?.toString() || "",
        });
      }
    } catch (error) {
      console.error("Error fetching address:", error);
    }
  };

  const fetchPayoutDetails = async () => {
    try {
      const { data } = await (supabase as any)
        .from("chef_payout_details")
        .select("payout_method, upi_id, account_holder_name, account_number, ifsc_code")
        .eq("chef_id", chefId)
        .maybeSingle();

      if (data) {
        setPayoutExists(true);
        setPayoutDetails({
          payout_method: data.payout_method || "upi",
          upi_id: data.upi_id || "",
          account_holder_name: data.account_holder_name || "",
          account_number: data.account_number || "",
          ifsc_code: data.ifsc_code || "",
        });
      }
    } catch (error) {
      console.error("Error fetching payout details:", error);
    }
  };

  const handleSavePayoutDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payoutDetails.payout_method === "upi" && !payoutDetails.upi_id.trim()) {
      toast.error("Please enter your UPI ID");
      return;
    }
    if (payoutDetails.payout_method === "bank") {
      if (!payoutDetails.account_holder_name.trim() || !payoutDetails.account_number.trim() || !payoutDetails.ifsc_code.trim()) {
        toast.error("Please fill in all bank account details");
        return;
      }
    }
    setPayoutLoading(true);
    try {
      const payload = {
        chef_id: chefId,
        payout_method: payoutDetails.payout_method,
        upi_id: payoutDetails.payout_method === "upi" ? payoutDetails.upi_id.trim() : null,
        account_holder_name: payoutDetails.payout_method === "bank" ? payoutDetails.account_holder_name.trim() : null,
        account_number: payoutDetails.payout_method === "bank" ? payoutDetails.account_number.trim() : null,
        ifsc_code: payoutDetails.payout_method === "bank" ? payoutDetails.ifsc_code.trim().toUpperCase() : null,
        // Reset Razorpay IDs when bank details change so they get recreated
        razorpay_contact_id: null,
        razorpay_fund_account_id: null,
      };

      if (payoutExists) {
        const { error } = await (supabase as any)
          .from("chef_payout_details")
          .update(payload)
          .eq("chef_id", chefId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("chef_payout_details")
          .insert(payload);
        if (error) throw error;
        setPayoutExists(true);
      }
      toast.success("Payout details saved! Earnings will be transferred here after each delivery.");
    } catch (error: any) {
      console.error("Error saving payout details:", error);
      toast.error(error.message || "Failed to save payout details");
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAddress((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setGpsLoading(false);
        toast.success("GPS coordinates detected!");
      },
      () => {
        setGpsLoading(false);
        toast.error("Could not detect location. Enter coordinates manually.");
      },
      { timeout: 8000 }
    );
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.address_line.trim() || !address.area.trim() || !address.pincode.trim()) {
      toast.error("Please fill in address, area, and pincode");
      return;
    }
    setAddressLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        user_id: user.id,
        address_line: address.address_line.trim(),
        area: address.area.trim(),
        pincode: address.pincode.trim(),
        latitude: address.latitude ? parseFloat(address.latitude) : null,
        longitude: address.longitude ? parseFloat(address.longitude) : null,
        is_primary: true,
      };

      if (address.id) {
        const { error } = await supabase
          .from("addresses")
          .update(payload)
          .eq("id", address.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("addresses")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        setAddress((prev) => ({ ...prev, id: data.id }));
      }
      toast.success("Kitchen address saved! You'll now appear on the map.");
    } catch (error: any) {
      console.error("Error saving address:", error);
      toast.error(error.message || "Failed to save address");
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("chefs")
        .update(profile)
        .eq("id", chefId);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSpecialty = async () => {
    if (!newSpecialty.trim()) return;

    try {
      const { error } = await supabase
        .from("chef_specialties")
        .insert({ chef_id: chefId, specialty: newSpecialty.trim() });

      if (error) throw error;
      setNewSpecialty("");
      fetchSpecialties();
      toast.success("Specialty added!");
    } catch (error: any) {
      console.error("Error adding specialty:", error);
      toast.error(error.message || "Failed to add specialty");
    }
  };

  const handleRemoveSpecialty = async (specialty: string) => {
    try {
      const { error } = await supabase
        .from("chef_specialties")
        .delete()
        .eq("chef_id", chefId)
        .eq("specialty", specialty);

      if (error) throw error;
      fetchSpecialties();
      toast.success("Specialty removed!");
    } catch (error: any) {
      console.error("Error removing specialty:", error);
      toast.error(error.message || "Failed to remove specialty");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chef Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell customers about yourself and your cooking style..."
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number (for order notifications)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={profile.phone_number}
                onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                We'll send you SMS notifications when customers order. No need to open the app!
              </p>
            </div>

            <div className="space-y-3">
              <Label>Notifications</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="notifications"
                  checked={profile.notification_opt_in}
                  onCheckedChange={(checked) => 
                    setProfile({ ...profile, notification_opt_in: checked })
                  }
                />
                <Label htmlFor="notifications" className="cursor-pointer">
                  Receive SMS notifications for new orders
                </Label>
              </div>
            </div>

            <div>
              <Label>Kitchen Photo</Label>
              <ImageUpload
                bucket="images"
                folder="kitchens"
                currentUrl={profile.kitchen_photo_url}
                onUpload={(url) => setProfile({ ...profile, kitchen_photo_url: url })}
                label="Upload kitchen photo"
              />
            </div>

            <div className="space-y-3">
              <Label>Certifications</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="hygiene"
                  checked={profile.hygiene_certificate}
                  onCheckedChange={(checked) => 
                    setProfile({ ...profile, hygiene_certificate: checked })
                  }
                />
                <Label htmlFor="hygiene" className="cursor-pointer">
                  Hygiene Certificate
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="fssai"
                  checked={profile.fssai_license}
                  onCheckedChange={(checked) => 
                    setProfile({ ...profile, fssai_license: checked })
                  }
                />
                <Label htmlFor="fssai" className="cursor-pointer">
                  FSSAI License
                </Label>
              </div>
            </div>

            {/* Delivery Settings */}
            <div className="space-y-3 border rounded-xl p-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-primary" />
                <Label className="font-semibold">Delivery Settings</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Set a flat delivery fee for your area. Customers pay this on every order. Enter 0 for free delivery.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="delivery_fee">Delivery Fee (₹)</Label>
                  <Input
                    id="delivery_fee"
                    type="number"
                    min="0"
                    step="5"
                    value={profile.delivery_fee}
                    onChange={(e) => setProfile({ ...profile, delivery_fee: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 30"
                  />
                  <p className="text-xs text-muted-foreground mt-1">0 = free delivery</p>
                </div>
                <div>
                  <Label htmlFor="delivery_radius">Delivery Radius (km)</Label>
                  <Input
                    id="delivery_radius"
                    type="number"
                    min="1"
                    max="20"
                    step="1"
                    value={profile.delivery_radius_km}
                    onChange={(e) => setProfile({ ...profile, delivery_radius_km: parseInt(e.target.value) || 3 })}
                    placeholder="e.g. 3"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Max km you deliver to</p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
                Most chefs in Nizampet charge <strong>₹30–₹50</strong> for deliveries within <strong>3 km</strong>. Your delivery fee applies to all your dishes.
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Kitchen Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Kitchen Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveAddress} className="space-y-4">
            <div>
              <Label htmlFor="address_line">Street / Flat / Building</Label>
              <Input
                id="address_line"
                placeholder="e.g. Plot 12, Sai Nagar Colony"
                value={address.address_line}
                onChange={(e) => setAddress({ ...address, address_line: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="area">Area / Locality</Label>
                <Input
                  id="area"
                  placeholder="e.g. Nizampet"
                  value={address.area}
                  onChange={(e) => setAddress({ ...address, area: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  placeholder="e.g. 500090"
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>GPS Coordinates (for map visibility)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Input
                    placeholder="Latitude e.g. 17.5081"
                    value={address.latitude}
                    onChange={(e) => setAddress({ ...address, latitude: e.target.value })}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Longitude e.g. 78.3887"
                    value={address.longitude}
                    onChange={(e) => setAddress({ ...address, longitude: e.target.value })}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDetectGPS}
                disabled={gpsLoading}
                className="w-full"
              >
                <Navigation className="h-4 w-4 mr-2" />
                {gpsLoading ? "Detecting…" : "Auto-detect my GPS coordinates"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Coordinates let customers find you on the map. Use "Auto-detect" or enter manually.
              </p>
            </div>

            <Button type="submit" disabled={addressLoading} className="w-full">
              {addressLoading ? "Saving…" : "Save Kitchen Address"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Payout Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-green-600" />
            Payout Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Add your UPI ID or bank account so MyHomePlate can automatically transfer your earnings when an order is delivered.
          </p>
          <form onSubmit={handleSavePayoutDetails} className="space-y-4">
            <div>
              <Label>Payout Method</Label>
              <div className="flex gap-6 mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="payout_method"
                    value="upi"
                    checked={payoutDetails.payout_method === "upi"}
                    onChange={() => setPayoutDetails({ ...payoutDetails, payout_method: "upi" })}
                  />
                  UPI
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="payout_method"
                    value="bank"
                    checked={payoutDetails.payout_method === "bank"}
                    onChange={() => setPayoutDetails({ ...payoutDetails, payout_method: "bank" })}
                  />
                  Bank Account
                </label>
              </div>
            </div>

            {payoutDetails.payout_method === "upi" ? (
              <div>
                <Label htmlFor="upi_id">UPI ID</Label>
                <Input
                  id="upi_id"
                  placeholder="e.g. yourname@upi or 9876543210@ybl"
                  value={payoutDetails.upi_id}
                  onChange={(e) => setPayoutDetails({ ...payoutDetails, upi_id: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Earnings will be sent here instantly after each delivery
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="account_holder_name">Account Holder Name</Label>
                  <Input
                    id="account_holder_name"
                    placeholder="Name exactly as on bank account"
                    value={payoutDetails.account_holder_name}
                    onChange={(e) => setPayoutDetails({ ...payoutDetails, account_holder_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="account_number">Account Number</Label>
                  <Input
                    id="account_number"
                    placeholder="Your bank account number"
                    value={payoutDetails.account_number}
                    onChange={(e) => setPayoutDetails({ ...payoutDetails, account_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ifsc_code">IFSC Code</Label>
                  <Input
                    id="ifsc_code"
                    placeholder="e.g. HDFC0001234"
                    value={payoutDetails.ifsc_code}
                    onChange={(e) => setPayoutDetails({ ...payoutDetails, ifsc_code: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
            )}

            <Button type="submit" disabled={payoutLoading} className="w-full">
              {payoutLoading ? "Saving..." : payoutExists ? "Update Payout Details" : "Save Payout Details"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Specialties</CardTitle>
          <p className="text-sm text-muted-foreground">
            Add the cuisines and dishes you specialise in — these appear on your chef profile so customers know what to expect.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Biryani, South Indian, Hyderabadi…"
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSpecialty())}
            />
            <Button
              type="button"
              onClick={handleAddSpecialty}
              disabled={!newSpecialty.trim()}
              className="shrink-0"
            >
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {specialties.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No specialties added yet — type one above and click Add
              </p>
            ) : (
              specialties.map((specialty, index) => (
                <Badge key={index} variant="secondary" className="pl-3 pr-1">
                  {specialty}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 ml-1"
                    onClick={() => handleRemoveSpecialty(specialty)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
