
import { Skeleton } from "@/components/ui/skeleton";

export const ReviewLoadingPlaceholder = () => {
  return (
    <div className="p-4 space-y-4">
      {Array(3).fill(0).map((_, i) => (
        <div key={i} className="p-4 bg-white/70 rounded-xl">
          <div className="flex justify-between items-start mb-3">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-16 h-4" />
          </div>
          <Skeleton className="w-full h-20" />
        </div>
      ))}
    </div>
  );
};
