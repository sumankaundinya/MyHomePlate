import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, XCircle, Star } from "lucide-react";

interface Chef {
  id: string;
  user_id: string;
  bio: string | null;
  verification_status: string;
  is_featured: boolean;
  avg_rating: number;
  total_reviews: number;
  total_orders: number;
  profile_name: string;
}

interface AdminChefsProps {
  onUpdate: () => void;
}

export const AdminChefs = ({ onUpdate }: AdminChefsProps) => {
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchChefs();
  }, []);

  const fetchChefs = async () => {
    try {
      const { data, error } = await supabase
        .from("chefs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profile names
      const chefsWithNames = await Promise.all(
        (data || []).map(async (chef) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", chef.user_id)
            .single();
          
          return {
            ...chef,
            profile_name: profileData?.name || "Chef"
          };
        })
      );

      setChefs(chefsWithNames as any);
    } catch (error) {
      console.error("Error fetching chefs:", error);
      toast.error("Failed to load chefs");
    }
  };

  const handleStatusUpdate = async (chefId: string, status: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("chefs")
        .update({ verification_status: status })
        .eq("id", chefId);

      if (error) throw error;
      toast.success(`Chef ${status}`);
      fetchChefs();
      onUpdate();
    } catch (error: any) {
      console.error("Error updating chef status:", error);
      toast.error(error.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (chefId: string, isFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from("chefs")
        .update({ is_featured: !isFeatured })
        .eq("id", chefId);

      if (error) throw error;
      toast.success(isFeatured ? "Removed from featured" : "Added to featured");
      fetchChefs();
      onUpdate();
    } catch (error: any) {
      console.error("Error toggling featured:", error);
      toast.error(error.message || "Failed to update");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const filteredChefs = filterStatus === "all" 
    ? chefs 
    : chefs.filter(chef => chef.verification_status === filterStatus);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Chef Applications</h2>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Chefs</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredChefs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No chefs found
            </CardContent>
          </Card>
        ) : (
          filteredChefs.map((chef) => (
            <Card key={chef.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-gradient-hero text-white text-lg">
                      {chef.profile_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{chef.profile_name}</h3>
                        {chef.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {chef.bio}
                          </p>
                        )}
                      </div>
                      <Badge variant={getStatusColor(chef.verification_status) as any}>
                        {chef.verification_status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {chef.avg_rating.toFixed(1)} ({chef.total_reviews} reviews)
                      </span>
                      <span>{chef.total_orders} orders</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {chef.verification_status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(chef.id, "approved")}
                            disabled={loading}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(chef.id, "rejected")}
                            disabled={loading}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {chef.verification_status === "approved" && (
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`featured-${chef.id}`}
                            checked={chef.is_featured}
                            onCheckedChange={() => handleToggleFeatured(chef.id, chef.is_featured)}
                          />
                          <Label htmlFor={`featured-${chef.id}`} className="cursor-pointer">
                            Featured
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
