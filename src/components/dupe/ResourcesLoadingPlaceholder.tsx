
import { Skeleton } from "@/components/ui/skeleton";

export const ResourcesLoadingPlaceholder = () => {
  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden">
            <Skeleton className="w-full h-40" />
            <div className="p-3">
              <Skeleton className="w-full h-5 mb-2" />
              <Skeleton className="w-1/2 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
