
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageFile: File) => void;
}

const CameraCapture = ({ isOpen, onClose, onCapture }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const setupCamera = async () => {
      try {
        if (isOpen && videoRef.current) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setDeviceError(null);
          }
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setDeviceError(
          "Could not access camera. Please ensure you've granted camera access permissions."
        );
      }
    };

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to match the video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to the canvas
    const context = canvas.getContext("2d");
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert the canvas to a file
      canvas.toBlob((blob) => {
        if (blob) {
          const imageFile = new File([blob], "camera-capture.jpg", {
            type: "image/jpeg",
          });
          onCapture(imageFile);
        }
      }, "image/jpeg");
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center"
    >
      <div className="relative w-full max-w-lg max-h-[80vh] bg-black rounded-lg overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
          onClick={onClose}
        >
          <X />
        </Button>

        {deviceError ? (
          <div className="p-8 text-white text-center">
            <p className="mb-4">{deviceError}</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <Button
                variant="secondary"
                size="lg"
                className="rounded-full w-16 h-16 bg-white hover:bg-gray-200"
                onClick={captureImage}
              >
                <Camera className="h-6 w-6 text-black" />
              </Button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default CameraCapture;
