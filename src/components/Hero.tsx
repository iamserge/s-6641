
import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Mic, Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";

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
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const reader = new FileReader();

          reader.onload = async () => {
            try {
              const base64Audio = (reader.result as string).split(',')[1];
              const { data, error } = await supabase.functions.invoke('process-voice', {
                body: { audio: base64Audio },
              });

              if (error) throw error;
              setSearchText(data.text);
              resolve();
            } catch (error) {
              console.error('Error processing voice:', error);
              reject(error);
            }
          };

          reader.readAsDataURL(audioBlob);
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
        description: "Could not access microphone. Please check permissions.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCameraSearch = async () => {
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
        const base64Image = reader.result as string;

        // Analyze image with OpenAI
        const { data: imageAnalysis, error: imageError } = await supabase.functions.invoke(
          'analyze-image',
          {
            body: { image: base64Image },
          }
        );

        if (imageError) throw imageError;

        // Find dupes using Perplexity
        const { data: dupes, error: dupesError } = await supabase.functions.invoke(
          'find-dupes',
          {
            body: { productInfo: imageAnalysis },
          }
        );

        if (dupesError) throw dupesError;

        // TODO: Update UI with dupes
        console.log('Found dupes:', dupes);
        
        toast({
          title: "Success!",
          description: "Found similar products. Check the results below.",
        });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not process the image. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="container mx-auto px-4 min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-12 bg-gradient-to-r from-pink-500 to-violet-500 text-transparent bg-clip-text">
        Find Your Perfect Makeup Dupe
      </h1>
      
      <div className="relative w-full max-w-2xl">
        <Input
          type="text"
          placeholder="Search for your favorite makeup product..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full h-14 pl-6 pr-32 text-lg rounded-full border-2 border-pink-100 focus:border-pink-300 focus:ring-pink-200"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleVoiceSearch}
            disabled={isProcessing}
            className="hover:bg-pink-50"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 text-pink-500 animate-spin" />
            ) : (
              <Mic className="w-5 h-5 text-pink-500" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCameraSearch}
            disabled={isProcessing}
            className="hover:bg-pink-50"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 text-pink-500 animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-pink-500" />
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
      </div>
    </section>
  );
};

export default Hero;
