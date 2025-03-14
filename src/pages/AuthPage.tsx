
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Instagram, Google, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/');
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error.message || "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInstagramLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'instagram',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error.message || "Could not sign in with Instagram. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-pink-50/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-xl shadow-md p-8"
      >
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-violet-800 to-purple-600">
            Sign in to BeautyDupes
          </h1>
          <p className="text-gray-600">
            Access your favorites and join the community
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-gray-800 border border-gray-300 hover:bg-gray-50"
            variant="outline"
          >
            <Google className="mr-2 h-5 w-5" />
            Sign in with Google
          </Button>
          
          <Button 
            onClick={handleInstagramLogin} 
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            <Instagram className="mr-2 h-5 w-5" />
            Sign in with Instagram
          </Button>
        </div>

        <div className="mt-6">
          <Separator className="my-4" />
          <Link to="/">
            <Button variant="ghost" className="w-full text-gray-600">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
