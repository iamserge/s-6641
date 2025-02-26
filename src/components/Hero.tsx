import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Mic, Camera, Loader2, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const [searchText, setSearchText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  
      // Connect to the Supabase function endpoint
      const supabaseUrl = "https://your-supabase-project.supabase.co"; // Replace with your Supabase project URL
      const eventSource = new EventSource(
        `${supabaseUrl}/functions/v1/search-dupes?searchText=${encodeURIComponent(searchText)}`
      );
  
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "progress") {
          // Update progress message from backend
          setProgressMessage(data.message);
        } else if (data.type === "result") {
          if (data.data.success && data.data.data.slug) {
            // Handle successful result
            setProgressMessage("Ta-da! Your dupes are ready to shine! 🌟");
            setTimeout(() => {
              navigate(`/dupes/for/${data.data.data.slug}`);
              eventSource.close();
            }, 1000);
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
        throw new Error("Failed to receive updates from the server");
      };
    } catch (error) {
      console.error("Search error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to search for products. Please try again.",
      });
    } finally {
      setTimeout(() => setIsProcessing(false), 1000);
    }
  };

  const handleVoiceSearch = async () => {
    try {
      setIsProcessing(true);
      setProgressMessage("Listening to your beauty wishes... 💬");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      return new Promise<void>((resolve, reject) => {
        mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);

        mediaRecorder.onstop = async () => {
          try {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();

            reader.onload = async () => {
              const base64Audio = (reader.result as string).split(',')[1];
              const { data, error } = await supabase.functions.invoke('process-voice', {
                body: { audio: base64Audio },
              });

              if (error) throw error;
              if (!data?.text) throw new Error('No text returned from voice processing');

              setSearchText(data.text);
              toast({
                title: "Voice processed!",
                description: `Detected text: "${data.text}"`,
              });
              await handleSearch();
              resolve();
            };

            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(audioBlob);
          } catch (error) {
            reject(error);
          }
        };

        mediaRecorder.start();
        toast({
          title: "Recording...",
          description: "Speak now. Recording will stop after 5 seconds.",
        });

        setTimeout(() => {
          mediaRecorder.stop();
          stream.getTracks().forEach(track => track.stop());
        }, 5000);
      });
    } catch (error) {
      console.error('Error in voice search:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not access microphone.",
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
        const { data, error } = await supabase.functions.invoke('analyze-image', {
          body: { image: base64Image },
        });

        if (error) throw error;

        setSearchText(data);
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

  const handleCameraSearch = () => fileInputRef.current?.click();
  const clearPreview = () => {
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
            className={`w-full h-16 pr-48 text-xl rounded-full border-2 border-pink-100 focus:border-pink-300 focus:ring-pink-200 font-light ${previewImage ? 'pl-16' : 'pl-8'}`}
          />
        </div>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2 items-center">
          <Button type="button" variant="ghost" size="icon" onClick={handleVoiceSearch} disabled={isProcessing} className="h-12 w-12 hover:bg-pink-50">
            <Mic className="w-6 h-6 text-pink-500" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={handleCameraSearch} disabled={isProcessing} className="h-12 w-12 hover:bg-pink-50">
            <Camera className="w-6 h-6 text-pink-500" />
          </Button>
          <div className="w-px h-8 bg-pink-100" />
          <Button type="submit" variant="ghost" size="icon" disabled={isProcessing} className="h-12 w-12 hover:bg-pink-50 ml-2">
            {isProcessing ? <Loader2 className="w-6 h-6 text-pink-500 animate-spin" /> : <Search className="w-6 h-6 text-pink-500" />}
          </Button>
        </div>
        <input type="file" ref={fileInputRef} accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
      </motion.form>

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
    </section>
  );
};

export default Hero;