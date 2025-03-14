
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error during auth callback:", error);
          throw error;
        }
        
        // Redirect to home page after successful authentication
        navigate("/", { replace: true });
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate("/auth", { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-violet-600" />
        <h2 className="text-2xl font-medium">Finalizing your login...</h2>
        <p className="text-gray-500">Please wait while we set up your account</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
