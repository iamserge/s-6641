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
  const [originalProgressMessage, setOriginalProgressMessage] = useState(""); // Store server message
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [showRecentProducts, setShowRecentProducts] = useState(false);
  const [tip, setTip] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  // **Client-side variations mapped to server-sent messages**
  const messageVariations = {
    "Heyyy! We're on the hunt for the perfect dupes for you! 🎨": [
      "Let’s track down some amazing dupes for you! ✨",
      "Hold tight, we’re searching for your perfect matches! 🔎",
      "Your dupe quest is officially underway! 🚀",
      "We’re digging into the beauty vault for you! 🗝️",
    ],
    "Oh, we already know this one! Let's show you the dupes... 🌟": [
      "Good news! We’ve got this one covered—dupes incoming! 🌈",
      "This one’s in our books—showing you the dupes now! 📖",
      "No need to search far, we’ve got dupes ready! ⚡",
      "We recognize this beauty—dupes on the way! 🎉",
    ],
    "Scouring the beauty universe for your perfect match... 💄": [
      "Exploring the makeup galaxy for your match... 🌌",
      "Sweeping the beauty world for your dupes... 🌍",
      "Diving deep into the cosmetic cosmos... 🪐",
      "Searching high and low for your perfect find... 🕵️‍♀️",
    ],
    "Found some gems! Let's doll them up with more details... 💎": [
      "We’ve struck gold—polishing your dupes now! 💰",
      "Dupes spotted—adding some sparkle to them! ✨",
      "Treasures found—making them picture-perfect! 🎨",
      "Got some keepers—enhancing the details! 💅",
    ],
    "Putting together your beauty dossier... 📋": [
      "Assembling your dupe masterpiece... 📜",
      "Crafting your personalized beauty file... 📑",
      "Finalizing your dupe lineup—almost there! 🎯",
      "Packaging your beauty finds with care... 🎁",
    ],
  };

  // **Array of 10 makeup tips**
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

  // **Utility Functions**
  const getRandomVariation = (serverMessage) => {
    const variations = messageVariations[serverMessage];
    if (variations && variations.length > 0) {
      return variations[Math.floor(Math.random() * variations.length)];
    }
    return serverMessage; // Fallback to original if no variations
  };

  const getRandomTip = () => tips[Math.floor(Math.random() * tips.length)];

  // **Fetch Recent Products**
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
        return { ...product, dupesCount: count, maxSavings };
      })
    );

    return productsWithDetails;
  };

  const { data: recentProducts } = useQuery({
    queryKey: ["recentProductsForModal"],
    queryFn: fetchRecentProducts,
    enabled: showRecentProducts,
  });

  // **Timers for Tips and Recent Products**
  useEffect(() => {
    if (isProcessing) {
      const tipTimer = setTimeout(() => {
        setShowTip(true);
        setTip(getRandomTip());
        setOriginalProgressMessage(progressMessage); // Save current message
        setProgressMessage(`While you wait, here’s a tip: ${getRandomTip()}`);
      }, 5000);

      const productsTimer = setTimeout(() => {
        setShowRecentProducts(true);
        setOriginalProgressMessage(progressMessage); // Save current message
        setProgressMessage("Still searching... Check out these recent dupes!");
      }, 20000);

      return () => {
        clearTimeout(tipTimer);
        clearTimeout(productsTimer);
        if (showTip) setProgressMessage(originalProgressMessage); // Revert when done
        if (showRecentProducts) setProgressMessage(originalProgressMessage);
        setShowTip(false);
        setShowRecentProducts(false);
      };
    }
  }, [isProcessing, showTip, showRecentProducts, progressMessage]);

  // **Handle Search with Variations and Delay**
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!searchText) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a search term or use image search" });
      return;
    }

    try {
      setIsProcessing(true);
      setProgressMessage(getRandomVariation("Heyyy! We're on the hunt for the perfect dupes for you! 🎨")); // Initial random message

      const { data: { session } } = await supabase.auth.getSession();
      const apikey = (supabase as any).supabaseKey;

      const baseUrl = `${(supabase as any).supabaseUrl}/functions/v1/search-dupes`;
      const url = new URL(baseUrl);
      url.searchParams.append("searchText", searchText);
      url.searchParams.append("apikey", apikey);
      if (session?.access_token) url.searchParams.append("authorization", `Bearer ${session.access_token}`);

      const eventSource = new EventSource(url.toString());

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "progress") {
          // Use server message to get a random variation
          const randomVariation = getRandomVariation(data.message);
          setProgressMessage(randomVariation);
          setOriginalProgressMessage(data.message); // Store original for reversion
        } else if (data.type === "result") {
          if (data.data.success && data.data.data.slug) {
            setProgressMessage("Ta-da! Your dupes are ready to shine! 🌟");
            setTimeout(() => {
              setProgressMessage("Almost ready... 🚀"); // 3-second delay message
              setTimeout(() => {
                eventSource.close();
                navigate(`/dupes/for/${data.data.data.slug}`);
                setIsProcessing(false);
              }, 3000); // 3-second delay
            }, 1500); // Show final message briefly
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

      return () => eventSource.close();
    } catch (error) {
      console.error("Search error:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to search for products. Please try again." });
      setIsProcessing(false);
    }
  };

  // **Camera and Image Handling**
  const startCamera = useCallback(async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not access camera. Please check permissions." });
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
    // Placeholder: Add camera snap logic if needed
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Placeholder: Add image upload logic if needed
  };

  const handleCameraSearch = () => startCamera();
  const clearPreview = () => {
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // **JSX Rendering**
  return (
    <section className="container mx-auto px-4 min-h-screen flex flex-col items-center justify-center font-urbanist">
      <motion.form
        className="relative w-full max-w-3xl hero-search-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        onSubmit={handleSearch}
      >
        <Input
          type="text"
          placeholder="Search for a product to find dupes..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pr-24 py-6 text-lg bg-white/90 backdrop-blur-sm border-pink-200 focus:border-pink-400"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
          <Button type="button" variant="ghost" size="icon" onClick={handleCameraSearch}>
            <Camera className="w-5 h-5 text-pink-500" />
          </Button>
          <Button type="submit" variant="ghost" size="icon">
            <Search className="w-5 h-5 text-pink-500" />
          </Button>
        </div>
      </motion.form>

      {isCameraOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        >
          <div className="relative bg-white p-4 rounded-lg">
            <video ref={videoRef} className="w-full max-w-md" />
            <Button onClick={stopCamera} className="absolute top-2 right-2">
              <X />
            </Button>
          </div>
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