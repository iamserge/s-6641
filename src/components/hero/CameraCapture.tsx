
import { useState, useRef, useCallback } from "react";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface CameraCaptureProps {
  isCameraOpen: boolean;
  handleCameraSnap: () => void;
  stopCamera: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const CameraCapture = ({ 
  isCameraOpen, 
  handleCameraSnap, 
  stopCamera, 
  videoRef 
}: CameraCaptureProps) => {
  if (!isCameraOpen) return null;

  return (
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
  );
};

export default CameraCapture;
