import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const MealCardSkeleton = () => {
  return (
    <Card className="overflow-hidden animate-pulse">
      <Skeleton className="aspect-video skeleton-shimmer" />
      <CardHeader>
        <Skeleton className="h-6 w-3/4 skeleton-shimmer" />
        <Skeleton className="h-4 w-1/2 skeleton-shimmer" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-1/3 skeleton-shimmer" />
      </CardContent>
    </Card>
  );
};

export const ChefCardSkeleton = () => {
  return (
    <Card className="min-w-[320px] animate-pulse">
      <CardHeader className="flex flex-row items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full skeleton-shimmer" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-32 skeleton-shimmer" />
          <Skeleton className="h-4 w-24 skeleton-shimmer" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-6 w-28 mb-3 skeleton-shimmer" />
        <Skeleton className="h-4 w-full skeleton-shimmer" />
      </CardContent>
    </Card>
  );
};

export const CategoryCardSkeleton = () => {
  return (
    <Card className="min-w-[280px] animate-pulse">
      <div className="p-6">
        <Skeleton className="h-16 w-16 rounded-2xl mb-4 skeleton-shimmer" />
        <Skeleton className="h-6 w-3/4 mb-2 skeleton-shimmer" />
        <Skeleton className="h-4 w-full skeleton-shimmer" />
        <Skeleton className="h-4 w-2/3 mt-1 skeleton-shimmer" />
      </div>
    </Card>
  );
};

interface SkeletonLoaderProps {
  type: "meal" | "chef" | "category";
  count?: number;
  className?: string;
}

export const SkeletonLoader = ({ type, count = 4, className }: SkeletonLoaderProps) => {
  const SkeletonComponent = {
    meal: MealCardSkeleton,
    chef: ChefCardSkeleton,
    category: CategoryCardSkeleton
  }[type];

  return (
    <div className={className}>
      {[...Array(count)].map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
};
