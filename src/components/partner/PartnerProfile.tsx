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
import { Plus, X } from "lucide-react";

interface PartnerProfileProps {
  chefId: string;
}

export const PartnerProfile = ({ chefId }: PartnerProfileProps) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    bio: "",
    kitchen_photo_url: "",
    hygiene_certificate: false,
    fssai_license: false
  });
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [newSpecialty, setNewSpecialty] = useState("");

  useEffect(() => {
    fetchProfile();
    fetchSpecialties();
  }, [chefId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("chefs")
        .select("bio, kitchen_photo_url, hygiene_certificate, fssai_license")
        .eq("id", chefId)
        .single();

      if (error) throw error;
      if (data) {
        setProfile({
          bio: data.bio || "",
          kitchen_photo_url: data.kitchen_photo_url || "",
          hygiene_certificate: data.hygiene_certificate,
          fssai_license: data.fssai_license
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
              <Label htmlFor="kitchen_photo">Kitchen Photo URL</Label>
              <Input
                id="kitchen_photo"
                type="url"
                placeholder="https://example.com/kitchen.jpg"
                value={profile.kitchen_photo_url}
                onChange={(e) => setProfile({ ...profile, kitchen_photo_url: e.target.value })}
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
