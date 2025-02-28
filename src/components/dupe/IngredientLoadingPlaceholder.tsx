
import { Skeleton } from "@/components/ui/skeleton";

export const IngredientLoadingPlaceholder = () => {
  return (
    <div className="p-4 flex flex-col">
      <Skeleton className="w-40 h-5 mb-3" />
      <div className="flex flex-wrap gap-2">
        {Array(12).fill(0).map((_, i) => (
          <Skeleton key={i} className="w-24 h-8 rounded-full" />
        ))}
      </div>
    </div>
  );
};
