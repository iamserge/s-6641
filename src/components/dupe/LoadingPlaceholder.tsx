
import { Skeleton } from "@/components/ui/skeleton";

export const LoadingPlaceholder = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center">
        <Skeleton className="w-32 h-32 rounded-full mb-4" />
        <Skeleton className="w-48 h-6 mb-2" />
        <Skeleton className="w-32 h-4 mb-8" />
        <div className="flex gap-2 mb-6">
          <Skeleton className="w-20 h-8 rounded-full" />
          <Skeleton className="w-20 h-8 rounded-full" />
          <Skeleton className="w-20 h-8 rounded-full" />
        </div>
        <Skeleton className="w-full max-w-2xl h-24 mb-6" />
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {Array(8).fill(0).map((_, i) => (
            <Skeleton key={i} className="w-20 h-8 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
};
