
import { Loader2 } from 'lucide-react';
import AnimatedBackground from '@/components/AnimatedBackground';

export const DupeLoading = ({ message = "Loading product details..." }: { message?: string }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50 to-pink-50">
      <AnimatedBackground />
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-violet-600 mb-4 mx-auto" />
        <p className="text-xl text-gray-700">{message}</p>
      </div>
    </div>
  );
};

export default DupeLoading;
