
import AnimatedBackground from '@/components/AnimatedBackground';

interface ErrorMessageProps {
  error: string | null;
}

export const ErrorMessage = ({ error }: ErrorMessageProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50 to-pink-50">
      <AnimatedBackground />
      <div className="text-center max-w-lg p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops!</h1>
        <p className="text-xl text-gray-700 mb-2">{error || "Product could not be loaded"}</p>
        <p className="text-gray-500">Please try searching for a different product</p>
      </div>
    </div>
  );
};

export default ErrorMessage;
