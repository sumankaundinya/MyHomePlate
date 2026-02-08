import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SlidersHorizontal, Calendar, Utensils, Leaf, Users } from "lucide-react";

interface MealFiltersProps {
  onFilterChange?: (filters: FilterState) => void;
}

export interface FilterState {
  availability: string[];
  cuisine: string[];
  dietary: string[];
  bulkFriendly: boolean;
}

const availabilityOptions = [
  { id: "lunch-today", label: "Lunch Today", icon: <Utensils className="h-4 w-4" /> },
  { id: "dinner-today", label: "Dinner Today", icon: <Utensils className="h-4 w-4" /> },
  { id: "tomorrow", label: "Tomorrow", icon: <Calendar className="h-4 w-4" /> },
  { id: "preorder", label: "Pre-Order Only", icon: <Calendar className="h-4 w-4" /> }
];

const cuisineOptions = [
  "North Indian",
  "South Indian",
  "Bengali",
  "Gujarati",
  "Punjabi",
  "Maharashtrian",
  "Continental",
  "Chinese"
];

const dietaryOptions = [
  { id: "veg", label: "Vegetarian", icon: <Leaf className="h-4 w-4 text-success" /> },
  { id: "non-veg", label: "Non-Vegetarian", icon: <Utensils className="h-4 w-4 text-accent" /> },
  { id: "vegan", label: "Vegan", icon: <Leaf className="h-4 w-4 text-success" /> },
  { id: "jain", label: "Jain", icon: <Leaf className="h-4 w-4 text-success" /> }
];

export const MealFilters = ({ onFilterChange }: MealFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    availability: [],
    cuisine: [],
    dietary: [],
    bulkFriendly: false
  });

  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const handleFilterChange = (category: keyof FilterState, value: string | boolean) => {
    const newFilters = { ...filters };
    
    if (category === "bulkFriendly") {
      newFilters[category] = value as boolean;
    } else {
      const array = newFilters[category] as string[];
      const index = array.indexOf(value as string);
      if (index > -1) {
        array.splice(index, 1);
      } else {
        array.push(value as string);
      }
    }
    
    setFilters(newFilters);
    const count = newFilters.availability.length + newFilters.cuisine.length + 
                  newFilters.dietary.length + (newFilters.bulkFriendly ? 1 : 0);
    setActiveFiltersCount(count);
    onFilterChange?.(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      availability: [],
      cuisine: [],
      dietary: [],
      bulkFriendly: false
    };
    setFilters(emptyFilters);
    setActiveFiltersCount(0);
    onFilterChange?.(emptyFilters);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative thumb-zone">
          <SlidersHorizontal className="h-5 w-5 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 bg-primary text-white h-5 w-5 p-0 flex items-center justify-center rounded-full">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl">Filters</SheetTitle>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Availability */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Available For
            </h3>
            <div className="space-y-3">
              {availabilityOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={option.id}
                    checked={filters.availability.includes(option.id)}
                    onCheckedChange={() => handleFilterChange("availability", option.id)}
                  />
                  <Label
                    htmlFor={option.id}
                    className="text-base font-normal cursor-pointer flex items-center gap-2"
                  >
                    {option.icon}
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Dietary Preferences */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Leaf className="h-5 w-5 text-success" />
              Dietary Preferences
            </h3>
            <div className="space-y-3">
              {dietaryOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={option.id}
                    checked={filters.dietary.includes(option.id)}
                    onCheckedChange={() => handleFilterChange("dietary", option.id)}
                  />
                  <Label
                    htmlFor={option.id}
                    className="text-base font-normal cursor-pointer flex items-center gap-2"
                  >
                    {option.icon}
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Cuisine */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              Cuisine
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {cuisineOptions.map((cuisine) => (
                <div key={cuisine} className="flex items-center space-x-2">
                  <Checkbox
                    id={cuisine}
                    checked={filters.cuisine.includes(cuisine)}
                    onCheckedChange={() => handleFilterChange("cuisine", cuisine)}
                  />
                  <Label
                    htmlFor={cuisine}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {cuisine}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Bulk Orders */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Special Options
            </h3>
            <div className="flex items-center space-x-3">
              <Checkbox
                id="bulk-friendly"
                checked={filters.bulkFriendly}
                onCheckedChange={(checked) => handleFilterChange("bulkFriendly", checked as boolean)}
              />
              <Label
                htmlFor="bulk-friendly"
                className="text-base font-normal cursor-pointer"
              >
                Bulk Orders Available
              </Label>
            </div>
          </div>
        </div>

        {/* Apply button */}
        <div className="sticky bottom-0 left-0 right-0 bg-background pt-6 pb-4 mt-6 border-t">
          <Button className="w-full thumb-zone shadow-warm">
            Apply Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
