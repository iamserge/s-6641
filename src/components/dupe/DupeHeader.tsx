
import { Loader2 } from 'lucide-react';

interface DupeHeaderProps {
  isLoadingDupes: boolean;
  dupeCount: number;
}

export const DupeHeader = ({ isLoadingDupes, dupeCount }: DupeHeaderProps) => {
  return (
    <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-gray-800">
      {isLoadingDupes ? (
        <div className="flex items-center justify-center gap-2">
          <span>Finding Dupes</span>
          <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
        </div>
      ) : (
        dupeCount > 0 
          ? `${dupeCount} Dupes Found`
          : "No Dupes Found"
      )}
    </h2>
  );
};

export default DupeHeader;
