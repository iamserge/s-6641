import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Camera, Loader2, Search, X, DollarSign, Timer, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, stagger } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

interface ProductProgress {
  status: 'pending' | 'loading' | 'success' | 'error';
  message: string;
}

interface SearchResults {
  name: string;
  brand: string;
  slug: string;
}

interface StepIndicator {
  step: number;
  label: string;
  description?: string;
}

const Hero = () => {
  const [searchText, setSearchText] = useState('');
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [productProgress, setProductProgress] = useState<ProductProgress | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const messageVariations = useMemo(() => [
    "Searching for the best dupes...",
    "Analyzing product ingredients...",
    "Comparing prices across retailers...",
    "Finding the perfect match for you...",
    "Almost there, just a few more seconds...",
  ], []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const clearSearchText = () => {
    setSearchText('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchText.trim()) {
      toast({
        title: "Please enter a product name",
        description: "We need something to search for!",
      });
      return;
    }

    setProductProgress({
      status: 'loading',
      message: 'Starting the search...'
    });

    try {
      const response = await fetch('/api/search-dupes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is empty');
      }

      let partialData = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        partialData += new TextDecoder().decode(value);

        // Process each complete SSE message
        let messageBoundary = partialData.indexOf('\n\n');
        while (messageBoundary !== -1) {
          const message = partialData.substring(0, messageBoundary);
          partialData = partialData.substring(messageBoundary + 2); // Move past the boundary

          try {
            const data = JSON.parse(message.replace('data: ', ''));

            if (data.type === 'progress') {
              setProductProgress({
                status: 'loading',
                message: data.message
              });
            } else if (data.type === 'result') {
              if (data.data.success) {
                setSearchResults({
                  name: data.data.data.name,
                  brand: data.data.data.brand,
                  slug: data.data.data.slug
                });
              } else {
                setProductProgress({
                  status: 'error',
                  message: 'No dupes found for this product.'
                });
              }
            } else if (data.type === 'error') {
              setProductProgress({
                status: 'error',
                message: data.error
              });
            }
          } catch (e) {
            console.error("Error parsing SSE message", e, message);
          }

          messageBoundary = partialData.indexOf('\n\n');
        }
      }
    } catch (error: any) {
      console.error("Search failed", error);
      setProductProgress({
        status: 'error',
        message: error.message || 'Search failed. Please try again.'
      });
    }
  };

  useEffect(() => {
    if (searchResults) {
      setProductProgress({
        status: 'success',
        message: 'Dupes found! Redirecting...'
      });

      // Redirect after a short delay to allow the message to be displayed
      const redirectTimeout = setTimeout(() => {
        navigate(`/product/${searchResults.slug}`);
      }, 1500);

      return () => clearTimeout(redirectTimeout);
    }
  }, [searchResults, navigate]);

  // Camera functions
  const openCameraModal = () => {
    setIsCameraModalOpen(true);
    setTimeout(() => {
      startWebcamStream();
    }, 500);
  };

  const closeCameraModal = () => {
    setIsCameraModalOpen(false);
    stopWebcamStream();
    setCapturedImage(null);
  };

  const startWebcamStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing the camera", err);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to use this feature.",
        variant: "destructive",
      });
      closeCameraModal();
    }
  }, [toast]);

  const stopWebcamStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  const captureImageFromWebcam = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopWebcamStream();
      }
    }
  };

  const uploadCapturedImage = async () => {
    if (capturedImage) {
      setIsCameraModalOpen(false);
      setProductProgress({
        status: 'loading',
        message: 'Analyzing image...'
      });

      try {
        const base64Image = capturedImage.split(',')[1]; // Remove prefix
        const response = await fetch('/api/search-dupes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageData: base64Image }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is empty');
        }

        let partialData = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          partialData += new TextDecoder().decode(value);

          // Process each complete SSE message
          let messageBoundary = partialData.indexOf('\n\n');
          while (messageBoundary !== -1) {
            const message = partialData.substring(0, messageBoundary);
            partialData = partialData.substring(messageBoundary + 2); // Move past the boundary

            try {
              const data = JSON.parse(message.replace('data: ', ''));

              if (data.type === 'progress') {
                setProductProgress({
                  status: 'loading',
                  message: data.message
                });
              } else if (data.type === 'result') {
                if (data.data.success) {
                  setSearchResults({
                    name: data.data.data.name,
                    brand: data.data.data.brand,
                    slug: data.data.data.slug
                  });
                } else {
                  setProductProgress({
                    status: 'error',
                    message: 'No dupes found for this product.'
                  });
                }
              } else if (data.type === 'error') {
                setProductProgress({
                  status: 'error',
                  message: data.error
                });
              }
            } catch (e) {
              console.error("Error parsing SSE message", e, message);
            }

            messageBoundary = partialData.indexOf('\n\n');
          }
        }
      } catch (error: any) {
        console.error("Image upload failed", error);
        setProductProgress({
          status: 'error',
          message: error.message || 'Image analysis failed. Please try again.'
        });
      }
    }
  };

  const taglineWords = "Outsmart the Beauty Industry, One Dupe at a Time 🧠".split(" ");

  const wordAnimation = {
    hidden: { opacity: 0, filter: "blur(10px)", scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      filter: "blur(0px)",
      scale: 1,
      transition: {
        delay: 0.7 + (i * 0.1),
        duration: 0.4,
        ease: [0.6, -0.05, 0.01, 0.99]
      }
    })
  };

  // Step animation variants
  const stepAnimation = {
    hidden: { opacity: 0, filter: "blur(8px)", scale: 0.95, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      filter: "blur(0px)",
      scale: 1,
      y: 0,
      transition: {
        delay: 1.5 + (i * 0.3), // Start after tagline animation with larger gaps
        duration: 0.5,
        ease: [0.6, -0.05, 0.01, 0.99]
      }
    })
  };

  return (
    <div className="pb-10 pt-6 lg:pb-20 lg:pt-10 container mx-auto px-4 relative">
      {isCameraModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 max-w-md w-full relative">
            <button
              onClick={closeCameraModal}
              className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300 rounded-full p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold mb-2">Take a photo</h2>
            <div className="relative w-full aspect-video overflow-hidden rounded-md">
              <video ref={videoRef} className="w-full" autoPlay muted playsInline style={{ display: isStreaming ? 'block' : 'none' }} />
              <canvas ref={canvasRef} className="absolute inset-0" style={{ display: !isStreaming && capturedImage ? 'block' : 'none' }} />
              {!isStreaming && capturedImage && (
                <img src={capturedImage} alt="Captured" className="absolute inset-0 w-full h-full object-cover" />
              )}
            </div>
            <div className="mt-4 flex justify-between">
              <Button type="button" variant="secondary" onClick={captureImageFromWebcam} disabled={!isStreaming}>
                Capture
              </Button>
              <Button type="button" onClick={uploadCapturedImage} disabled={!capturedImage}>
                Use Image
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <motion.div
        className="text-center mb-8"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.6, -0.05, 0.01, 0.99], delay: 0.1 }}
      >
        <motion.img
          src="/lovable-uploads/52ac84d3-c972-4947-9aab-008fcc78be99.png"
          alt="Dupe Academy Logo"
          className="h-16 md:h-20 mx-auto mb-4"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99], delay: 0.2 }}
        />
        <div className="mb-4 flex flex-wrap justify-center">
          {taglineWords.map((word, i) => (
            <motion.span
              key={i}
              className="text-2xl md:text-3xl text-gray-800 font-light tracking-wide inline-block mx-1"
              custom={i}
              initial="hidden"
              animate="visible"
              variants={wordAnimation}
            >
              {word}
            </motion.span>
          ))}
        </div>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl mx-auto bg-white bg-opacity-70 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-lg relative z-10 border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99], delay: 0.6 }}
      >
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={stepAnimation}
          className="mb-8"
        >
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center font-semibold mr-3">
              1
            </div>
            <h2 className="text-xl font-medium text-gray-800">
              Enter the name of any beauty product
            </h2>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2 relative">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="e.g. NARS blush"
                value={searchText}
                onChange={handleInputChange}
                ref={inputRef}
                className="rounded-full bg-white shadow-sm border-gray-200 focus-visible:ring-1 focus-visible:ring-violet-500 pr-12"
              />
              {searchText && (
                <button
                  onClick={clearSearchText}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full p-1"
                  aria-label="Clear search text"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button type="submit" className="rounded-full ml-2 flex-shrink-0">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="rounded-full flex-shrink-0"
              onClick={openCameraModal}
            >
              <Camera className="w-4 h-4 mr-2" />
              Camera
            </Button>
          </div>
        </motion.div>

        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={stepAnimation}
          className="mb-8"
        >
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-semibold mr-3">
              2
            </div>
            <h2 className="text-xl font-medium text-gray-800">
              Our AI finds affordable alternatives
            </h2>
          </div>
          <p className="text-sm ml-11 text-gray-500">
            new products need ~1min for our beauty AI to perfect-match
          </p>
        </motion.div>

        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={stepAnimation}
          className="mb-4"
        >
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-semibold mr-3">
              3
            </div>
            <h2 className="text-xl font-medium text-gray-800">
              Save up to 80% on premium beauty
            </h2>
          </div>
          <div className="flex flex-wrap ml-11 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg inline-flex items-center">
              <DollarSign className="w-4 h-4 text-emerald-700 mr-1.5" />
              <span className="text-sm text-emerald-800">Save Money</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg inline-flex items-center">
              <Timer className="w-4 h-4 text-blue-700 mr-1.5" />
              <span className="text-sm text-blue-800">Save Time</span>
            </div>
            <div className="bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-lg inline-flex items-center">
              <Gift className="w-4 h-4 text-violet-700 mr-1.5" />
              <span className="text-sm text-violet-800">Same Quality</span>
            </div>
          </div>
        </motion.div>
        
        {productProgress && productProgress.status === 'loading' && (
          <div className="text-center mt-4">
            <Loader2 className="w-6 h-6 animate-spin text-violet-600 mx-auto mb-2" />
            <p className="text-gray-600">{productProgress.message}</p>
            {productProgress.message === messageVariations[0] && (
              <p className="text-sm text-gray-500 mt-1">
                This might take a minute or two...
              </p>
            )}
          </div>
        )}

        {productProgress && productProgress.status === 'error' && (
          <div className="text-center mt-4 text-red-500">
            <p>{productProgress.message}</p>
          </div>
        )}
      </motion.form>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default Hero;
