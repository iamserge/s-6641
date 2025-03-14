
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SearchForm from "./hero/SearchForm";
import TaglineAnimation from "./hero/TaglineAnimation";
import BeautyTip from "./hero/BeautyTip";
import ProcessingModal from "./hero/ProcessingModal";
import AnimatedSteps from "@/components/hero/AnimatedSteps";
import RecentProductsDisplay from "@/components/hero/RecentProductsDisplay";
import ProductConfirmation from "@/components/hero/ProductConfirmation";
import CameraCapture from "@/components/hero/CameraCapture";

const Hero = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedProduct, setConfirmedProduct] = useState(null);
  const [beautyTip, setBeautyTip] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleSearch = (searchTerm) => {
    console.log("Search term:", searchTerm);
  };

  const handleImageUpload = async (imageFile) => {
    setIsProcessing(true);
    setBeautyTip(null);

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsProcessing(false);
    setConfirmedProduct({
      name: "Example Product",
      imageUrl: URL.createObjectURL(imageFile),
    });
    setPreviewImage(URL.createObjectURL(imageFile));
    setBeautyTip({
      title: "Hydration Boost",
      content:
        "Use a hydrating serum with hyaluronic acid to keep your skin plump and moisturized.",
    });
  };

  const handleConfirmation = () => {
    navigate("/product-details");
  };

  const handleCameraOpen = () => {
    setIsCameraOpen(true);
  };

  const handleCameraClose = () => {
    setIsCameraOpen(false);
  };

  const handleCameraCapture = async (imageFile) => {
    setIsCameraOpen(false);
    handleImageUpload(imageFile);
  };

  const clearPreview = () => {
    setPreviewImage(null);
    setConfirmedProduct(null);
  };

  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto px-4 py-12 sm:py-20">
        <div className="flex flex-col items-center justify-center text-center pt-6 md:pt-8">
          {/* Added padding-top (pt-6 md:pt-8) to the logo container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center gap-2 mb-4"
          >
            <img
              src="/logo.svg"
              alt="Dupe Logo"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <span className="font-semibold text-2xl text-gray-800">
              Beauty<span className="text-violet-600">Dupes</span>
            </span>
          </motion.div>
          
          <TaglineAnimation />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md mb-8"
          >
            <SearchForm 
              searchText={searchText}
              setSearchText={setSearchText}
              previewImage={previewImage}
              clearPreview={clearPreview}
              isProcessing={isProcessing}
              isCameraOpen={isCameraOpen}
              fileInputRef={fileInputRef}
              onSearch={handleSearch} 
              onImageUpload={handleImageUpload} 
              onCameraOpen={handleCameraOpen} 
            />
          </motion.div>

          {beautyTip && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <BeautyTip tip={beautyTip.content} showTip={true} />
            </motion.div>
          )}

          <AnimatedSteps />
        </div>

        <RecentProductsDisplay showRecentProducts={false} recentProducts={[]} />

        {isProcessing && <ProcessingModal isProcessing={isProcessing} />}
        
        {confirmedProduct && (
          <ProductConfirmation
            confirmProduct={confirmedProduct}
            onConfirm={handleConfirmation}
          />
        )}

        <CameraCapture
          isOpen={isCameraOpen}
          onClose={handleCameraClose}
          onCapture={handleCameraCapture}
        />
      </div>
    </section>
  );
};

export default Hero;
