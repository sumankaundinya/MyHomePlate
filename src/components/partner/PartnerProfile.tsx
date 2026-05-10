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
import { Plus, X, MapPin, Navigation } from "lucide-react";
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
    notification_opt_in: true
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

  useEffect(() => {
    fetchProfile();
    fetchSpecialties();
    fetchAddress();
  }, [chefId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("chefs")
        .select("bio, kitchen_photo_url, hygiene_certificate, fssai_license, phone_number, notification_opt_in")
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
          notification_opt_in: data.notification_opt_in ?? true
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

      <Card>
        <CardHeader>
          <CardTitle>Specialties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a specialty (e.g., Biryani, South Indian)"
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSpecialty())}
            />
            <Button onClick={handleAddSpecialty}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {specialties.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No specialties added yet
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
