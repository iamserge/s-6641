
import { useState, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Camera, Loader2, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const [searchText, setSearchText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

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
      url.searchParams.append('searchText', searchText);

      url.searchParams.append('apikey', apikey);
      if (session?.access_token) {
        url.searchParams.append('authorization', `Bearer ${session.access_token}`);
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
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play(); // Ensure video is playing before snapping
        console.log('Camera started, video dimensions:', videoRef.current.videoWidth, videoRef.current.videoHeight);
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
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    console.log('Camera stopped');
  }, []);

  const handleCameraSnap = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref is null');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Camera not ready. Please try again.",
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Ensure video has loaded metadata and has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Video dimensions not available:', video.videoWidth, video.videoHeight);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Camera not fully loaded. Please try again.",
      });
      stopCamera();
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    setProgressMessage("Analyzing your snapshot... 📸");

    // Set canvas dimensions and capture the frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D context from canvas');
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
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8); // Quality set to 0.8
    console.log('Snapshot captured, image data URL length:', imageDataUrl.length);
    setPreviewImage(imageDataUrl);

    stopCamera();

    try {
      console.log('Sending image to Supabase, preview URL length:', imageDataUrl.length);
      const { data, error } = await supabase.functions.invoke('analyze-image', {
        body: { image: imageDataUrl },
      });

      console.log('Supabase response:', { data, error });

      if (error) throw error;
      if (!data?.product) throw new Error('No product detected in image');

      setSearchText(data.product);
      toast({
        title: "Product Detected!",
        description: `Found: "${data.product}"`,
      });
      await handleSearch();
    } catch (error) {
      console.error('Error processing camera image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not process the image.",
      });
    } finally {
      setTimeout(() => setIsProcessing(false), 1000);
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
        console.log('Uploaded image base64 length:', base64Image.length);
        const { data, error } = await supabase.functions.invoke('analyze-image', {
          body: { image: base64Image },
        });

        console.log('Supabase response for upload:', { data, error });

        if (error) throw error;
        if (!data?.product) throw new Error('No product detected in image');

        setSearchText(data.product);
        await handleSearch();
      };

      reader.onerror = (error) => { throw error; };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not process the image.",
      });
    } finally {
      setTimeout(() => setIsProcessing(false), 1000);
    }
  };

  const handleCameraSearch = () => {
    startCamera();
  };

  const clearPreview = () => {
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    console.log('Preview cleared');
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
        <div className="text-2xl md:text-3xl text-gray-600 font-extralight flex justify-center gap-2 md:gap-3">
          {["Smart", "Dupes,", "Stunning", "You"].map((word, index) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, scale: 1.1, filter: "blur(5px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.5, delay: 0.8 + (index * 0.15), ease: [0.6, -0.05, 0.01, 0.99] }}
            >
              {word}
            </motion.span>
          ))}
        </div>
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
                onError={() => console.error('Preview image failed to load')}
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
            className={`w-full h-16 pr-32 text-xl rounded-full border-2 border-pink-100 focus:border-pink-300 focus:ring-pink-200 font-light ${previewImage ? 'pl-16' : 'pl-8'}`}
          />
        </div>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2 items-center">
          <Button type="button" variant="ghost" size="icon" onClick={handleCameraSearch} disabled={isProcessing || isCameraOpen} className="h-12 w-12 hover:bg-pink-50">
            <Camera className="w-6 h-6 text-pink-500" />
          </Button>
          <div className="w-px h-8 bg-pink-100" />
          <Button type="submit" variant="ghost" size="icon" disabled={isProcessing || isCameraOpen} className="h-12 w-12 hover:bg-pink-50 ml-2">
            {isProcessing ? <Loader2 className="w-6 h-6 text-pink-500 animate-spin" /> : <Search className="w-6 h-6 text-pink-500" />}
          </Button>
        </div>
        <input type="file" ref={fileInputRef} accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
      </motion.form>

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
            <Button
              onClick={stopCamera}
              variant="outline"
              className="mt-2 w-full"
            >
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
            className="bg-white p-8 rounded-lg shadow-xl text-center"
          >
            <p className="text-2xl font-light text-gray-800 mb-4">{progressMessage}</p>
            <Loader2 className="w-12 h-12 text-pink-500 animate-spin mx-auto" />
          </motion.div>
        </motion.div>
      )}
      
      <canvas ref={canvasRef} className="hidden" />
    </section>
  );
};

export default Hero;
