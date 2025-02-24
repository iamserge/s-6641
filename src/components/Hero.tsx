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
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

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
      const { data, error } = await supabase.functions.invoke('search-dupes', {
        body: { searchText },
      });

      if (error) throw error;

      if (data?.success && data?.data?.slug) {
        navigate(`/dupes/for/${data.data.slug}`);
      } else {
        throw new Error('No product data returned');
      }

    } catch (error) {
      console.error('Search error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to search for products. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceSearch = async () => {
    try {
      setIsProcessing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      return new Promise<void>((resolve, reject) => {
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          try {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();

            reader.onload = async () => {
              try {
                const base64Audio = (reader.result as string).split(',')[1];
                console.log('Sending audio to process-voice function...');
                
                const { data, error } = await supabase.functions.invoke('process-voice', {
                  body: { audio: base64Audio },
                });

                if (error) {
                  console.error('Supabase function error:', error);
                  throw error;
                }

                if (!data || !data.text) {
                  throw new Error('No text returned from voice processing');
                }

                setSearchText(data.text);
                toast({
                  title: "Voice processed!",
                  description: `Detected text: "${data.text}"`,
                });
                await handleSearch();
                resolve();
              } catch (error) {
                console.error('Error processing voice in reader:', error);
                reject(error);
              }
            };

            reader.onerror = (error) => {
              console.error('FileReader error:', error);
              reject(error);
            };

            reader.readAsDataURL(audioBlob);
          } catch (error) {
            console.error('Error in mediaRecorder.onstop:', error);
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
        description: error instanceof Error 
          ? error.message 
          : "Could not access microphone. Please check permissions.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCameraSearch = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);

      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const base64Image = reader.result as string;
          console.log('Sending image to analyze-image function...');

          const { data: imageAnalysis, error: imageError } = await supabase.functions.invoke(
            'analyze-image',
            {
              body: { image: base64Image },
            }
          );

          if (imageError) {
            console.error('Image analysis error:', imageError);
            throw imageError;
          }

          console.log('Image analysis result:', imageAnalysis);
          
          setSearchText(imageAnalysis);
          
          await handleSearch();
        } catch (error) {
          console.error('Error in reader.onload:', error);
          throw error;
        }
      };

      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        throw error;
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : "Could not process the image. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearPreview = () => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section className="container mx-auto px-4 min-h-screen flex flex-col items-center justify-center font-urbanist">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.8,
          ease: [0.6, -0.05, 0.01, 0.99]
        }}
        className="mb-16 text-center"
      >
        <motion.img 
          src="/lovable-uploads/52ac84d3-c972-4947-9aab-008fcc78be99.png" 
          alt="Dupe Academy Logo" 
          className="h-32 md:h-40 mb-8 mx-auto"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ 
            duration: 0.6,
            ease: [0.6, -0.05, 0.01, 0.99],
            delay: 0.2
          }}
        />
        <div className="text-2xl md:text-3xl text-gray-600 font-extralight flex justify-center gap-2 md:gap-3">
          {["Smart", "Dupes,", "Stunning", "You"].map((word, index) => (
            <motion.span
              key={word}
              initial={{ 
                opacity: 0, 
                scale: 1.1,
                filter: "blur(5px)"
              }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                filter: "blur(0px)"
              }}
              transition={{
                duration: 0.5,
                delay: 0.8 + (index * 0.15),
                ease: [0.6, -0.05, 0.01, 0.99]
              }}
            >
              {word}
            </motion.span>
          ))}
        </div>
      </motion.div>
      
      <motion.form 
        className="relative w-full max-w-3xl"
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
            className={`w-full h-16 pr-48 text-xl rounded-full border-2 border-pink-100 focus:border-pink-300 focus:ring-pink-200 font-light ${
              previewImage ? 'pl-16' : 'pl-8'
            }`}
          />
        </div>
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2 items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleVoiceSearch}
            disabled={isProcessing}
            className="h-12 w-12 hover:bg-pink-50"
          >
            <Mic className="w-6 h-6 text-pink-500" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCameraSearch}
            disabled={isProcessing}
            className="h-12 w-12 hover:bg-pink-50"
          >
            <Camera className="w-6 h-6 text-pink-500" />
          </Button>
          <div className="w-px h-8 bg-pink-100" />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            disabled={isProcessing}
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
    </section>
  );
};

export default Hero;
