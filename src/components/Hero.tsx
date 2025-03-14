
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Camera, Loader2, Search, X, DollarSign, Timer, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [detectedProduct, setDetectedProduct] = useState<any>(null);
  const [showProductConfirmation, setShowProductConfirmation] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  const messageVariations = useMemo(() => ({
    "Analyzing your input...": [
      "Reading your makeup vibes... 👀",
      "Decoding your beauty DNA... 🔍",
      "Translating your beauty language... 💬"
    ],
    "We detected: ": [
      "Found your beauty match: ",
      "I'm seeing: ",
      "Got it, you're looking for: "
    ],
    "Heyyy! We're on the hunt for the perfect dupes for you! 🎨": [
      "Obsessed with finding your makeup twin rn 💄",
      "BRB, snatching dupes that hit different ✨",
      "Your wallet's about to thank us so hard 💸",
    ],
    "Oh, we already know this one! Let's show you the dupes... 🌟": [
      "This one's giving main character energy—dupes loading 💅",
      "Bestie we already know this vibe—check these out ☕",
    ],
    "Scouring the beauty universe for your perfect match... 💄": [
      "First one to ask for this—we're on a whole journey rn 🏄‍♀️",
      "New to our algorithm—breaking the internet for you 🔥",
    ],
    "Found some matches! Creating initial entries...": [
      "Caught some serious dupes—they ate 🔥",
      "These matches are so valid—just perfecting the vibe 💫",
    ],
    "Putting together your beauty dossier... 📋": [
      "Manifest your new go-to's in 3, 2, 1... ✨",
      "Dropping your beauty rotation upgrade 💁‍♀️",
    ],
    "Checking our database for existing dupes...": [
      "Scouring our beauty vault for matches... 💼",
      "Checking if we've already found this gem... 💎",
    ],
    "Gathering detailed information in the background...": [
      "Summoning all the tea on these dupes... ☕",
      "Deep diving for those hidden details... 🔍",
    ],
    "Your dupes are ready! Loading details...": [
      "Dupes served hot and fresh! 🔥",
      "Dupe mission accomplished! 🚀",
    ]
  }), []);

  const tips = useMemo(() => [
    "Apply foundation with a damp sponge for a natural finish.",
    "Use lip liner to prevent lipstick bleeding.",
    "Set makeup with a light mist for longer wear.",
    "Store mascara horizontally for better formula consistency.",
    "When using cream products, apply before powder for better blending.",
    "Concealer should be one shade lighter than your foundation for brightening.",
    "Use a highlighter in the inner corners of eyes to look more awake.",
    "Warm up your eyelash curler for 5 seconds with a hairdryer for better curl.",
    "Powder your face before applying blush to help it last longer.",
    "Use a setting spray to make your makeup last all day long."
  ], []);

  const getRandomVariation = useCallback((serverMessage) => {
    for (const prefix in messageVariations) {
      if (serverMessage.startsWith(prefix) && messageVariations[prefix]) {
        const variations = messageVariations[prefix];
        const randomPrefix = variations[Math.floor(Math.random() * variations.length)];
        return randomPrefix + serverMessage.substring(prefix.length);
      }
    }
    
    const variations = messageVariations[serverMessage];
    return variations?.length > 0
      ? variations[Math.floor(Math.random() * variations.length)]
      : serverMessage;
  }, [messageVariations]);

  const getRandomTip = useCallback(() => tips[Math.floor(Math.random() * tips.length)], [tips]);

  const fetchRecentProducts = useCallback(async () => {
    try {
      const { data: productsWithDupes } = await supabase
        .from("product_dupes")
        .select("original_product_id, savings_percentage")
        .order("savings_percentage", { ascending: false })
        .limit(3);

      if (!productsWithDupes || productsWithDupes.length === 0) return [];

      const productIds = productsWithDupes.map((item) => item.original_product_id);
      const { data: products } = await supabase
        .from("products")
        .select("id, name, brand, image_url, slug")
        .in("id", productIds);

      if (!products || products.length === 0) return [];

      const productsWithDetails = await Promise.all(
        products.map(async (product) => {
          const { data: dupes, count } = await supabase
            .from("product_dupes")
            .select("savings_percentage", { count: "exact" })
            .eq("original_product_id", product?.id);
          const maxSavings = Math.max(...(dupes?.map((d) => d.savings_percentage) || [0]));
          return { ...product, dupesCount: count, maxSavings };
        })
      );
      return productsWithDetails;
    } catch (error) {
      console.error("Error fetching recent products:", error);
      return [];
    }
  }, []);

  const { data: recentProducts } = useQuery({
    queryKey: ["recentProductsForModal"],
    queryFn: fetchRecentProducts,
    enabled: showRecentProducts,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    let tipTimer, productsTimer;
    if (isProcessing) {
      tipTimer = setTimeout(() => {
        setShowTip(true);
        setTip(getRandomTip());
      }, 10000);
      productsTimer = setTimeout(() => setShowRecentProducts(true), 20000);
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

  const handleSearch = async (e?: React.FormEvent, productData?: any) => {
    if (e) e.preventDefault();
    
    let searchData: { searchText?: string; imageData?: string } = {};
    let bodyMethod = 'GET';
    const url = new URL(`${(supabase as any).supabaseUrl}/functions/v1/search-dupes`);
    
    if (productData) {
      const formattedText = `${productData.brand || ''} ${productData.name || ''}`.trim();
      searchData = { searchText: formattedText };
      url.searchParams.append("searchText", formattedText);
    } else if (previewImage) {
      searchData = { imageData: previewImage.replace(/^data:image\/\w+;base64,/, '') };
      bodyMethod = 'POST';
    } else if (searchText.trim()) {
      searchData = { searchText: searchText.trim() };
      url.searchParams.append("searchText", searchText.trim());
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a search term or use image search",
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      setSearchTriggered(true);
      setShowProductConfirmation(false);
      setDetectedProduct(null);
      setProgressMessage(getRandomVariation("Heyyy! We're on the hunt for the perfect dupes for you! 🎨"));
      
      const { data: { session } } = await supabase.auth.getSession();
      const apikey = (supabase as any).supabaseKey;
      
      url.searchParams.append("apikey", apikey);
      if (session?.access_token) url.searchParams.append("authorization", `Bearer ${session.access_token}`);
      
      const eventSource = new EventSource(url.toString());
      
      if (bodyMethod === 'POST') {
        fetch(url.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(searchData)
        }).catch(error => {
          console.error("Error initiating search:", error);
        });
      }
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === "productIdentified") {
          setDetectedProduct(data.data);
          setShowProductConfirmation(true);
        } else if (data.type === "progress") {
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
                setIsProcessing(false);
                setSearchTriggered(false);
                setShowProductConfirmation(false);
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
        setShowProductConfirmation(false);
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
      setShowProductConfirmation(false);
    }
  };

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
    if (videoRef.current?.srcObject) {
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
      handleSearch(undefined, undefined);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not process the image.",
      });
      setIsProcessing(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgressMessage("Analyzing your makeup muse... 📸");

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const imageDataUrl = reader.result as string;
        setPreviewImage(imageDataUrl);
        
        handleSearch(undefined, undefined);
      };

      reader.onerror = () => {
        throw new Error("Failed to read image file");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not process the image.",
      });
      setIsProcessing(false);
    }
  };

  const handleCameraSearch = () => startCamera();

  const clearPreview = () => {
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cancelSearch = () => {
    setIsProcessing(false);
    setPreviewImage(null);
    setSearchText("");
    setSearchTriggered(false);
    setShowProductConfirmation(false);
    setDetectedProduct(null);
  };

  return (
    <section className="container mx-auto px-4 min-h-screen flex flex-col items-center justify-center font-urbanist">
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
        <h1 className="text-2xl md:text-3xl text-gray-800 font-light mb-4 tracking-wide">
          Outsmart the Beauty Industry, One Dupe at a Time 🧠
        </h1>
      </motion.div>

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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.8 }}
        className="w-full max-w-3xl mt-6 mb-12"
      >
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <div className="text-xs text-pink-500 font-medium">Step 1</div>
                <p className="text-sm text-gray-700">Get makeup price shock 😱 (we've all been there)</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Timer className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <div className="text-xs text-purple-500 font-medium">Step 2</div>
                <p className="text-sm text-gray-700">Sit pretty while we find your affordable twins 👯‍♀️</p>
                <p className="text-xs text-gray-500">new products need ~1min for our beauty AI to perfect-match</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                <Gift className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <div className="text-xs text-pink-500 font-medium">Finally</div>
                <p className="text-sm text-gray-700">Keep your look, lose the cost, win at life 🏆</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

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
            {showProductConfirmation && detectedProduct && (
              <div className="mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-center gap-2">
                  {previewImage && (
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-pink-100">
                      <img
                        src={previewImage}
                        alt="Detected product"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-sm text-gray-500">We detected:</p>
                    <p className="font-medium text-gray-800">
                      {detectedProduct.brand ? `${detectedProduct.brand} ` : ''}
                      {detectedProduct.name}
                    </p>
                    {detectedProduct.category && (
                      <p className="text-xs text-gray-500">{detectedProduct.category}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex justify-center space-x-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={cancelSearch}
                  >
                    Not what I'm looking for
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => setShowProductConfirmation(false)}
                  >
                    Yes, that's right
                  </Button>
                </div>
              </div>
            )}

            {!showProductConfirmation && previewImage && searchTriggered && searchText && (
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
                  onClick={cancelSearch}
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

            <p className="text-2xl font-light text-gray-800 mb-4">{progressMessage}</p>

            {showTip && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeIn" }}
                className="mt-4"
              >
                <p className="text-lg font-light text-gray-800 mb-2">Beauty Tip</p>
                <p className="text-sm text-gray-600 italic">{tip}</p>
              </motion.div>
            )}

            {showRecentProducts && recentProducts?.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeIn" }}
                className="mt-6"
              >
                <p className="text-lg font-light text-gray-800 mb-2">
                  Trending Dupe Finds
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {recentProducts.map((product) => (
                    <div key={product?.id} className="border rounded-lg p-2 bg-gray-50">
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
