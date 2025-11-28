import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";

interface Dish {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  image_url: string | null;
}

interface PartnerDishesProps {
  chefId: string;
  onUpdate: () => void;
}

export const PartnerDishes = ({ chefId, onUpdate }: PartnerDishesProps) => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "main course",
    available: true,
    image_url: ""
  });

  useEffect(() => {
    fetchDishes();
  }, []);

  const fetchDishes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("chef_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDishes(data || []);
    } catch (error) {
      console.error("Error fetching dishes:", error);
      toast.error("Failed to load dishes");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dishData = {
        ...formData,
        price: parseFloat(formData.price),
        chef_id: user.id
      };

      if (editingDish) {
        const { error } = await supabase
          .from("meals")
          .update(dishData)
          .eq("id", editingDish.id);

        if (error) throw error;
        toast.success("Dish updated successfully!");
      } else {
        const { error } = await supabase
          .from("meals")
          .insert(dishData);

        if (error) throw error;
        toast.success("Dish added successfully!");
      }

      setDialogOpen(false);
      resetForm();
      fetchDishes();
      onUpdate();
    } catch (error: any) {
      console.error("Error saving dish:", error);
      toast.error(error.message || "Failed to save dish");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this dish?")) return;

    try {
      const { error } = await supabase
        .from("meals")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Dish deleted successfully!");
      fetchDishes();
      onUpdate();
    } catch (error: any) {
      console.error("Error deleting dish:", error);
      toast.error(error.message || "Failed to delete dish");
    }
  };

  const handleToggleAvailability = async (dish: Dish) => {
    try {
      const { error } = await supabase
        .from("meals")
        .update({ available: !dish.available })
        .eq("id", dish.id);

      if (error) throw error;
      toast.success(`Dish ${dish.available ? "disabled" : "enabled"}`);
      fetchDishes();
      onUpdate();
    } catch (error: any) {
      console.error("Error toggling availability:", error);
      toast.error(error.message || "Failed to update availability");
    }
  };

  const openEditDialog = (dish: Dish) => {
    setEditingDish(dish);
    setFormData({
      title: dish.title,
      description: dish.description,
      price: dish.price.toString(),
      category: dish.category,
      available: dish.available,
      image_url: dish.image_url || ""
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price: "",
      category: "main course",
      available: true,
      image_url: ""
    });
    setEditingDish(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">My Dishes</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Dish
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingDish ? "Edit Dish" : "Add New Dish"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Dish Name</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="available"
                  checked={formData.available}
                  onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
                />
                <Label htmlFor="available">Available</Label>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : editingDish ? "Update Dish" : "Add Dish"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {dishes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No dishes added yet. Click "Add Dish" to get started!
            </CardContent>
          </Card>
        ) : (
          dishes.map((dish) => (
            <Card key={dish.id}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {dish.image_url && (
                    <img 
                      src={dish.image_url} 
                      alt={dish.title}
                      className="w-24 h-24 object-cover rounded-md"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{dish.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {dish.description}
                        </p>
                      </div>
                      <Badge variant={dish.available ? "default" : "secondary"}>
                        {dish.available ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">₹{dish.price}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleAvailability(dish)}
                        >
                          {dish.available ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(dish)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(dish.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
