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
  const [originalProgressMessage, setOriginalProgressMessage] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [showRecentProducts, setShowRecentProducts] = useState(false);
  const [tip, setTip] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false); // Tracks if search has started after detection
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  // **Client-side Message Variations**
  const messageVariations = {
    "Heyyy! We're on the hunt for the perfect dupes for you! 🎨": [
      "Obsessed with finding your makeup twin rn 💄",
      "BRB, snatching dupes that hit different ✨",
      "Your wallet's about to thank us so hard 💸",
      "On a mission to serve looks on a budget 👀",
    ],
    "Oh, we already know this one! Let's show you the dupes... 🌟": [
      "This one's giving main character energy—dupes loading 💅",
      "Bestie we already know this vibe—check these out ☕",
      "Living for this pick—here's the tea on alternatives 💯",
      "Core product alert—matches incoming ⚡",
    ],
    "Scouring the beauty universe for your perfect match... 💄": [
      "First one to ask for this—we're on a whole journey rn 🏄‍♀️",
      "New to our algorithm—breaking the internet for you 🔥",
      "Giving our AI rizz to find this for you 💯",
      "No cap, hunting every corner of beauty TikTok for this 🫶",
    ],
    "Found some gems! Let's doll them up with more details... 💎": [
      "Caught some serious dupes—they ate 🔥",
      "These matches are so valid—just perfecting the vibe 💫",
      "The girlies came through—adding the juicy details 💅",
      "It's a slay—making sure it's giving everything 💯",
    ],
    "Putting together your beauty dossier... 📋": [
      "Manifest your new go-to's in 3, 2, 1... ✨",
      "Dropping your beauty rotation upgrade 💁‍♀️",
      "Your dupe era starts now—finalizing the drop 🔄",
      "This is about to hit different—just watch 🤌",
    ],
  };

  // **Makeup Tips**
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
    return variations && variations.length > 0
      ? variations[Math.floor(Math.random() * variations.length)]
      : serverMessage;
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
    let tipTimer;
    let productsTimer;

    if (isProcessing) {
      // Show tip after 10 seconds
      tipTimer = setTimeout(() => {
        setShowTip(true);
        setTip(getRandomTip());
      }, 10000); // 10 seconds

      // Show recent products after 20 seconds
      productsTimer = setTimeout(() => {
        setShowRecentProducts(true);
      }, 20000); // 20 seconds
    }

    return () => {
      clearTimeout(tipTimer);
      clearTimeout(productsTimer);
      if (!isProcessing) {
        setShowTip(false);
        setShowRecentProducts(false);
      }
    };
  }, [isProcessing]);

  // **Handle Search**
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!searchText.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a search term or use image search",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setSearchTriggered(true); // Indicate search has started
      setProgressMessage(getRandomVariation("Heyyy! We're on the hunt for the perfect dupes for you! 🎨"));

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
          setProgressMessage(getRandomVariation(data.message));
          setOriginalProgressMessage(data.message);
        } else if (data.type === "result") {
          if (data.data.success && data.data.data.slug) {
            setProgressMessage("Ta-da! Your dupes are ready to shine! 🌟");
            setTimeout(() => {
              setProgressMessage("Almost ready... 🚀");
              setTimeout(() => {
                eventSource.close();
                navigate(`/dupes/for/${data.data.data.slug}`);
                setIsProcessing(false); // Close modal on redirect
                setSearchTriggered(false); // Reset search trigger
              }, 1000);
            }, 1500);
          } else {
            throw new Error("No product data returned");
          }
        } else if (data.type === "error") {
          throw new Error(data.error);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setIsProcessing(false);
        setSearchTriggered(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Something went wrong. Please try again.",
        });
      };

      return () => eventSource.close();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to search for products. Please try again.",
      });
      setIsProcessing(false);
      setSearchTriggered(false);
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
    if (!videoRef.current || !canvasRef.current) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Camera not ready. Please try again.",
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Camera not fully loaded. Please try again.",
      });
      stopCamera();
      return;
    }

    setIsProcessing(true);
    setProgressMessage("Analyzing your snapshot... 📸");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to capture image. Please try again.",
      });
      stopCamera();
      setIsProcessing(false);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setPreviewImage(imageDataUrl);
    stopCamera();

    try {
      const { data, error } = await supabase.functions.invoke("analyze-image", {
        body: { image: imageDataUrl },
      });

      if (error) throw error;
      if (!data?.product) throw new Error("No product detected in image");

      const cleanedProduct = data.product.replace(/["']/g, "").trim();
      setSearchText(cleanedProduct);
      toast({
        title: "Product Detected!",
        description: `Found: "${cleanedProduct}"`,
      });
      setTimeout(() => handleSearch(), 100); // Trigger search after setting text
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not process the image.",
      });
      setIsProcessing(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setProgressMessage("Analyzing your makeup muse... 📸");
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);

      const reader = new FileReader();
      reader.onload = async () => {
        const base64Image = reader.result as string;
        const { data, error } = await supabase.functions.invoke("analyze-image", {
          body: { image: base64Image },
        });

        if (error) throw error;
        if (!data?.product) throw new Error("No product detected in image");

        const cleanedProduct = data.product.replace(/["']/g, "").trim();
        setSearchText(cleanedProduct);
        toast({
          title: "Product Detected!",
          description: `Found: "${cleanedProduct}"`,
        });
        setTimeout(() => handleSearch(), 100);
      };

      reader.onerror = () => {
        throw new Error("Failed to read image file");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not process the image.",
      });
      setIsProcessing(false);
    }
  };

  const handleCameraSearch = () => startCamera();

  const clearPreview = () => {
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // **JSX Rendering**
  return (
    <section className="container mx-auto px-4 min-h-screen flex flex-col items-center justify-center font-urbanist">
      {/* Logo and Tagline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
        className="mb-16 text-center"
      >
        <motion.img
          src="/lovable-uploads/52ac84d3-c972-4947-9aab-008fcc78be99.png"
          alt="Dupe Academy Logo"
          className="h-32 md:h-40 mb-8 mx-auto"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99], delay: 0.2 }}
        />
        <div className="text-2xl md:text-3xl text-gray-600 font-extralight flex justify-center gap-2 md:gap-3">
          {["Smart", "Dupes,", "Stunning", "You"].map((word, index) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, scale: 1.1, filter: "blur(5px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.5, delay: 0.8 + index * 0.15, ease: [0.6, -0.05, 0.01, 0.99] }}
            >
              {word}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* Search Form */}
      <motion.form
        className="relative w-full max-w-3xl hero-search-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        onSubmit={handleSearch}
      >
        <div className="relative">
          {previewImage && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 group">
              <img
                src={previewImage}
                alt="Preview"
                className="h-10 w-10 rounded-full object-cover border-2 border-pink-100"
              />
              <button
                type="button"
                onClick={clearPreview}
                className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-gray-500" />
              </button>
            </div>
          )}
          <Input
            type="text"
            placeholder="Search for your favorite makeup product..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={`w-full h-16 pr-32 text-xl rounded-full border-2 border-pink-100 focus:border-pink-300 focus:ring-pink-200 font-light ${
              previewImage ? "pl-16" : "pl-8"
            }`}
          />
        </div>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2 items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCameraSearch}
            disabled={isProcessing || isCameraOpen}
            className="h-12 w-12 hover:bg-pink-50"
          >
            <Camera className="w-6 h-6 text-pink-500" />
          </Button>
          <div className="w-px h-8 bg-pink-100" />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            disabled={isProcessing || isCameraOpen}
            className="h-12 w-12 hover:bg-pink-50 ml-2"
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
            ) : (
              <Search className="w-6 h-6 text-pink-500" />
            )}
          </Button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleImageUpload}
          className="hidden"
        />
      </motion.form>

      {/* Camera Modal */}
      {isCameraOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        >
          <div className="relative bg-white p-4 rounded-lg">
            <video ref={videoRef} className="w-full max-w-md rounded" autoPlay playsInline />
            <Button
              onClick={handleCameraSnap}
              className="mt-4 w-full bg-pink-500 hover:bg-pink-600 text-white"
            >
              Snap Photo
            </Button>
            <Button onClick={stopCamera} variant="outline" className="mt-2 w-full">
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Processing Modal */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 rounded-lg shadow-xl text-center max-h-[90vh] overflow-y-auto relative"
          >
            {/* Header: Show only after product detection and search triggered */}
            {previewImage && searchTriggered && searchText && (
              <div className="mb-4 pb-4 border-b border-gray-100 relative">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-pink-100">
                    <img
                      src={previewImage}
                      alt="Detected product"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-500">We detected:</p>
                    <p className="font-medium text-gray-800">{searchText}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsProcessing(false);
                    setPreviewImage(null);
                    setSearchText("");
                    setSearchTriggered(false);
                  }}
                  className="absolute right-0 top-0 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Cancel search"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Not what you're looking for? Click the X to try again.
                </p>
              </div>
            )}

            {/* Progress Message */}
            <p className="text-2xl font-light text-gray-800 mb-4">{progressMessage}</p>

            {/* Tips Section */}
            {showTip && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeIn" }}
                className="mt-4"
              >
                <p className="text-sm text-gray-600 italic">{tip}</p>
              </motion.div>
            )}

            {/* Recent Products Section */}
            {showRecentProducts && recentProducts && recentProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeIn" }}
                className="mt-6"
              >
                <p className="text-lg font-light text-gray-800 mb-2">
                  Here are some dupes to vibe with...
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
              </motion.div>
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