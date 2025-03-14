
import { useState, useRef, useCallback } from "react";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface CameraCaptureProps {
  isCameraOpen?: boolean;
  handleCameraSnap?: () => void;
  stopCamera?: () => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
  isOpen?: boolean;
  onClose?: () => void;
  onCapture?: (imageFile: any) => Promise<void>;
}

const CameraCapture = ({ 
  isCameraOpen, 
  handleCameraSnap, 
  stopCamera, 
  videoRef,
  isOpen = false,
  onClose = () => {},
  onCapture = async () => {}
}: CameraCaptureProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const actualVideoRef = videoRef || localVideoRef;
  
  // Use the prop that's provided, defaulting to isCameraOpen
  const isActive = isOpen || isCameraOpen;
  
  if (!isActive) return null;

  const handleSnap = () => {
    if (handleCameraSnap) {
      handleCameraSnap();
    } else if (onCapture && actualVideoRef.current) {
      // Create a canvas element to capture the image
      const canvas = document.createElement('canvas');
      canvas.width = actualVideoRef.current.videoWidth;
      canvas.height = actualVideoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx && actualVideoRef.current) {
        ctx.drawImage(actualVideoRef.current, 0, 0);
        
        // Convert the canvas to a Blob
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            onCapture(file);
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleClose = () => {
    if (stopCamera) {
      stopCamera();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
    >
      <div className="relative bg-white p-4 rounded-lg">
        <video ref={actualVideoRef} className="w-full max-w-md rounded" autoPlay playsInline />
        <Button
          onClick={handleSnap}
          className="mt-4 w-full bg-pink-500 hover:bg-pink-600 text-white"
        >
          Snap Photo
        </Button>
        <Button onClick={handleClose} variant="outline" className="mt-2 w-full">
          Cancel
        </Button>
      </div>
    </motion.div>
  );
};

export default CameraCapture;
