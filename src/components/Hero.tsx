
import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Mic, Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";
import { motion } from "framer-motion";

const Hero = () => {
  const [searchText, setSearchText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const base64Image = reader.result as string;
          console.log('Sending image to analyze-image function...');

          // Analyze image with OpenAI
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

          // Find dupes using Perplexity
          const { data: dupes, error: dupesError } = await supabase.functions.invoke(
            'find-dupes',
            {
              body: { productInfo: imageAnalysis },
            }
          );

          if (dupesError) {
            console.error('Dupes search error:', dupesError);
            throw dupesError;
          }

          console.log('Found dupes:', dupes);
          
          toast({
            title: "Success!",
            description: "Found similar products. Check the results below.",
          });
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
        <motion.p 
          className="text-2xl md:text-3xl text-gray-600 font-extralight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Where luxury meets affordability
        </motion.p>
      </motion.div>
      
      <motion.div 
        className="relative w-full max-w-3xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <Input
          type="text"
          placeholder="Search for your favorite makeup product..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full h-16 pl-8 pr-36 text-xl rounded-full border-2 border-pink-100 focus:border-pink-300 focus:ring-pink-200 font-light"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleVoiceSearch}
            disabled={isProcessing}
            className="h-12 w-12 hover:bg-pink-50"
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
            ) : (
              <Mic className="w-6 h-6 text-pink-500" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCameraSearch}
            disabled={isProcessing}
            className="h-12 w-12 hover:bg-pink-50"
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-pink-500" />
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
      </motion.div>
    </section>
  );
};

export default Hero;
