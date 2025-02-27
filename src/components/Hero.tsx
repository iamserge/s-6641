import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Camera, Loader2, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

const Hero = () => {
  const [searchText, setSearchText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [showRecentProducts, setShowRecentProducts] = useState(false);
  const [tip, setTip] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  // Array of 10 makeup tips for randomization
  const tips = [
    "Did you know? Applying foundation with a damp sponge can give a more natural finish.",
    "Pro tip: Use a lip liner to prevent lipstick from bleeding.",
    "Fun fact: The average woman owns 40 makeup products.",
    "Beauty hack: Use a white eyeliner as a base to make eyeshadow colors pop.",
    "Skincare tip: Always apply sunscreen as the last step in your morning routine.",
    "Try this: Set your makeup with a light mist for longer wear.",
    "Did you know? Blending blush upwards can lift your face.",
    "Pro tip: Warm up your eyelash curler for a better curl.",
    "Fun fact: Mascara wands can change the whole look of your lashes.",
    "Beauty hack: Use a spoon to shield your skin while applying mascara.",
  ];

  // Function to get a random tip
  const getRandomTip = () => tips[Math.floor(Math.random() * tips.length)];

  // Function to fetch 3 recent products with dupes (inspired by RecentDupes)
  const fetchRecentProducts = async () => {
    const { data: productsWithDupes } = await supabase
      .from("product_dupes")
      .select("original_product_id, savings_percentage")
      .order("savings_percentage", { ascending: false })
      .limit(3);

    const productIds = productsWithDupes.map((item) => item.original_product_id);

    const { data: products } = await supabase
      .from("products")
      .select("id, name, brand, image_url, slug")
      .in("id", productIds);

    const productsWithDetails = await Promise.all(
      products.map(async (product) => {
        const { data: dupes, count } = await supabase
          .from("product_dupes")
          .select("savings_percentage", { count: "exact" })
          .eq("original_product_id", product.id);

        const maxSavings = Math.max(...dupes.map((d) => d.savings_percentage));
        return {
          ...product,
          dupesCount: count,
          maxSavings,
        };
      })
    );

    return productsWithDetails;
  };

  // UseQuery to fetch recent products when showRecentProducts is true
  const { data: recentProducts } = useQuery({
    queryKey: ["recentProductsForModal"],
    queryFn: fetchRecentProducts,
    enabled: showRecentProducts,
  });

  // Set up timers for tips and recent products when processing starts
  useEffect(() => {
    if (isProcessing) {
      const tipTimer = setTimeout(() => {
        setShowTip(true);
        setTip(getRandomTip());
      }, 5000); // 5 seconds

      const productsTimer = setTimeout(() => {
        setShowRecentProducts(true);
      }, 20000); // 20 seconds

      return () => {
        clearTimeout(tipTimer);
        clearTimeout(productsTimer);
        setShowTip(false);
        setShowRecentProducts(false);
      };
    }
  }, [isProcessing]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!searchText) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a search term or use image search",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setProgressMessage("Connecting to the beauty lab... 🔬");

      const { data: { session } } = await supabase.auth.getSession();
      const apikey = (supabase as any).supabaseKey;

      const baseUrl = `${(supabase as any).supabaseUrl}/functions/v1/search-dupes`;
      const url = new URL(baseUrl);
      url.searchParams.append("searchText", searchText);
      url.searchParams.append("apikey", apikey);
      if (session?.access_token) {
        url.searchParams.append("authorization", `Bearer ${session.access_token}`);
      }

      const eventSource = new EventSource(url.toString());

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "progress") {
          setProgressMessage(data.message);
        } else if (data.type === "result") {
          if (data.data.success && data.data.data.slug) {
            setProgressMessage("Ta-da! Your dupes are ready to shine! 🌟");
            setTimeout(() => {
              eventSource.close();
              navigate(`/dupes/for/${data.data.data.slug}`);
              setIsProcessing(false);
            }, 1500);
          } else {
            throw new Error("No product data returned");
          }
        } else if (data.type === "error") {
          throw new Error(data.error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE error:", error);
        eventSource.close();
        setIsProcessing(false);
        throw new Error("Failed to receive updates from the server");
      };

      return () => {
        eventSource.close();
      };
    } catch (error) {
      console.error("Search error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to search for products. Please try again.",
      });
      setIsProcessing(false);
    }
  };

  const startCamera = useCallback(async () => {
    // Camera logic remains unchanged
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not access camera. Please check permissions.",
      });
      setIsCameraOpen(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  }, []);

  const handleCameraSnap = async () => {
    // Camera snap logic remains unchanged
    // ...
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Image upload logic remains unchanged
    // ...
  };

  const handleCameraSearch = () => {
    startCamera();
  };

  const clearPreview = () => {
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <section className="container mx-auto px-4 min-h-screen flex flex-col items-center justify-center font-urbanist">
      {/* Existing form and camera modal remain unchanged */}
      <motion.form
        className="relative w-full max-w-3xl hero-search-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        onSubmit={handleSearch}
      >
        {/* Form content unchanged */}
      </motion.form>

      {isCameraOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        >
          {/* Camera modal content unchanged */}
        </motion.div>
      )}

      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 rounded-lg shadow-xl text-center max-h-[90vh] overflow-y-auto"
          >
            <p className="text-2xl font-light text-gray-800 mb-4">{progressMessage}</p>

            {showTip && (
              <p className="mt-4 text-sm text-gray-600 italic">{tip}</p>
            )}

            {showRecentProducts && recentProducts && recentProducts.length > 0 && (
              <div className="mt-6">
                <p className="text-lg font-light text-gray-800 mb-2">
                  Hey, still waiting for "{searchText}"? Meanwhile, check out these other products with dupes we found:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {recentProducts.map((product) => (
                    <div key={product.id} className="border rounded-lg p-2 bg-gray-50">
                      <img
                        src={product.image_url || "/placeholder-image.png"}
                        alt={product.name}
                        className="w-full h-24 object-cover rounded mb-2"
                      />
                      <p className="text-sm font-medium">
                        <a
                          href={`/dupes/for/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-500 hover:underline"
                        >
                          {product.name}
                        </a>
                      </p>
                      <p className="text-xs text-gray-600">{product.brand}</p>
                      <p className="text-xs text-gray-600">{product.dupesCount} dupes</p>
                      <p className="text-xs text-gray-600">Max saving: {product.maxSavings}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Loader2 className="w-12 h-12 text-pink-500 animate-spin mx-auto mt-6" />
          </motion.div>
        </motion.div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </section>
  );
};

export default Hero;