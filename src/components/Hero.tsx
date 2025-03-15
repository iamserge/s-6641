/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Import components
import TaglineAnimation from "./hero/TaglineAnimation";
import AnimatedSteps from "./hero/AnimatedSteps";
import SearchForm from "./hero/SearchForm";
import CameraCapture from "./hero/CameraCapture";
import ProcessingModal from "./hero/ProcessingModal";
import { useMessageVariations } from "./hero/useMessageVariations";

const Hero = () => {
  // State
  const [searchText, setSearchText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [progressMessage, setProgressMessage] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [detectedProduct, setDetectedProduct] = useState(null);
  const [productError, setProductError] = useState(null);
  
  // Refs
  const eventSourceRef = useRef(null);
  
  // Hooks
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const { getRandomVariation } = useMessageVariations();

  const taglineWords = "Outsmart the Beauty Industry, One Dupe at a Time 🧠".split(" ");
  
  // Cleanup function to close EventSource if it exists
  const cleanupEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  // Handlers
  const handleSearch = async (e, productData) => {
    if (e) e.preventDefault();
    
    let searchData = {};
    
    // Build request data based on input type
    if (productData) {
      const formattedText = `${productData.brand || ''} ${productData.name || ''}`.trim();
      searchData = { searchText: formattedText };
    } else if (previewImage) {
      searchData = { imageData: previewImage.replace(/^data:image\/\w+;base64,/, '') };
    } else if (searchText.trim()) {
      searchData = { searchText: searchText.trim() };
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a search term or use image search",
      });
      return;
    }
    
    try {
      // Clean up any existing event source
      cleanupEventSource();
      
      // Set UI state
      setIsProcessing(true);
      setSearchTriggered(true);
      setDetectedProduct(null);
      setProductError(null);
      setProgressMessage(getRandomVariation("Looking for dupes! 🎨"));
      
      // Get authentication info
      const { data: { session } } = await supabase.auth.getSession();
      const apikey = (supabase as any).supabaseKey;
      const baseUrl = `${(supabase as any).supabaseUrl}/functions/v1/search-dupes`;
      
      // Send the POST request to initiate the search
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apikey,
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify(searchData)
      });
      
      // Check for immediate response (not SSE)
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.success && data.data?.slug) {
          setProgressMessage("Ta-da! Your dupes are ready to shine! 🌟");
          setTimeout(() => {
            navigate(`/dupes/for/${data.data.slug}`);
            setIsProcessing(false);
            setSearchTriggered(false);
          }, 1500);
          return;
        } else if (data.error) {
          throw new Error(data.error);
        }
      }
      
      // If we didn't get a direct JSON response, set up SSE connection
      eventSourceRef.current = new EventSource(`${baseUrl}?apikey=${apikey}`);
      
      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case "productIdentified":
              setDetectedProduct(data.data);
              break;
              
            case "progress":
              setProgressMessage(getRandomVariation(data.message));
              break;
              
            case "notRelevant":
              setProductError({
                type: "notRelevant",
                message: data.message || "This doesn't appear to be a beauty product we can find dupes for."
              });
              cleanupEventSource();
              setIsProcessing(false);
              setSearchTriggered(false);
              break;
              
            case "result":
              if (data.data.success && data.data.data.slug) {
                setProgressMessage("Ta-da! Your dupes are ready to shine! 🌟");
                setTimeout(() => {
                  cleanupEventSource();
                  navigate(`/dupes/for/${data.data.data.slug}`);
                  setIsProcessing(false);
                  setSearchTriggered(false);
                }, 1500);
              } else {
                throw new Error("No product data returned");
              }
              break;
              
            case "error":
              throw new Error(data.error);
              
            default:
              console.warn("Unknown event type:", data.type);
          }
        } catch (error) {
          console.error("Error parsing SSE message:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Something went wrong processing the search results."
          });
          cleanupEventSource();
          setIsProcessing(false);
          setSearchTriggered(false);
        }
      };
      
      eventSourceRef.current.onerror = (error) => {
        console.error("EventSource error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Connection lost. Please try again."
        });
        cleanupEventSource();
        setIsProcessing(false);
        setSearchTriggered(false);
      };
      
    } catch (error) {
      console.error("Search error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to search for products. Please try again."
      });
      cleanupEventSource();
      setIsProcessing(false);
      setSearchTriggered(false);
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
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject;
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

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgressMessage("Analyzing your makeup muse... 📸");

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const imageDataUrl = reader.result;
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
    cleanupEventSource();
    setIsProcessing(false);
    setPreviewImage(null);
    setSearchText("");
    setSearchTriggered(false);
    setDetectedProduct(null);
    setProductError(null);
  };

  const confirmProduct = () => {
    // Continue with the search using the detected product
    if (detectedProduct) {
      handleSearch(null, detectedProduct);
    }
    setDetectedProduct(null);
  };

  // Cleanup on component unmount
  React.useEffect(() => {
    return () => {
      cleanupEventSource();
    };
  }, [cleanupEventSource]);

  return (
    <section className="container mx-auto px-4 pt-8 mt-20 min-h-screen flex flex-col items-center justify-center font-urbanist">
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
        <TaglineAnimation taglineWords={taglineWords} />
      </motion.div>

      <SearchForm
        searchText={searchText}
        setSearchText={setSearchText}
        previewImage={previewImage}
        clearPreview={clearPreview}
        isProcessing={isProcessing}
        isCameraOpen={isCameraOpen}
        handleCameraSearch={handleCameraSearch}
        handleSearch={handleSearch}
        fileInputRef={fileInputRef}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.8 }}
        className="w-full max-w-3xl mt-6 mb-12"
      >
        <AnimatedSteps />
      </motion.div>

      <CameraCapture
        isCameraOpen={isCameraOpen}
        handleCameraSnap={handleCameraSnap}
        stopCamera={stopCamera}
        videoRef={videoRef}
      />

      <ProcessingModal
        isProcessing={isProcessing}
        detectedProduct={detectedProduct}
        productError={productError}
        previewImage={previewImage}
        progressMessage={progressMessage}
        searchTriggered={searchTriggered}
        searchText={searchText}
        cancelSearch={cancelSearch}
        confirmProduct={confirmProduct}
      />

      <canvas ref={canvasRef} className="hidden" />
      
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleImageUpload}
        className="hidden"
      />
    </section>
  );
};

export default Hero;