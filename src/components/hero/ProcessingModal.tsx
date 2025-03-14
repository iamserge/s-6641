
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import ProductConfirmation from "./ProductConfirmation";
import BeautyTip from "./BeautyTip";
import RecentProductsDisplay from "./RecentProductsDisplay";

interface ProcessingModalProps {
  isProcessing: boolean;
  showProductConfirmation: boolean;
  detectedProduct: any;
  previewImage: string | null;
  progressMessage: string;
  searchTriggered: boolean;
  searchText: string;
  showTip: boolean;
  tip: string;
  showRecentProducts: boolean;
  recentProducts: any[] | undefined;
  cancelSearch: () => void;
  setShowProductConfirmation: (show: boolean) => void;
}

const ProcessingModal = ({
  isProcessing,
  showProductConfirmation,
  detectedProduct,
  previewImage,
  progressMessage,
  searchTriggered,
  searchText,
  showTip,
  tip,
  showRecentProducts,
  recentProducts,
  cancelSearch,
  setShowProductConfirmation
}: ProcessingModalProps) => {
  if (!isProcessing) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-8 rounded-lg shadow-xl text-center max-h-[90vh] overflow-y-auto relative"
      >
        <ProductConfirmation
          showProductConfirmation={showProductConfirmation}
          detectedProduct={detectedProduct}
          previewImage={previewImage}
          searchTriggered={searchTriggered}
          searchText={searchText}
          cancelSearch={cancelSearch}
          setShowProductConfirmation={setShowProductConfirmation}
        />

        <p className="text-2xl font-light text-gray-800 mb-4">{progressMessage}</p>

        <BeautyTip showTip={showTip} tip={tip} />
        
        <RecentProductsDisplay 
          showRecentProducts={showRecentProducts} 
          recentProducts={recentProducts} 
        />

        <Loader2 className="w-12 h-12 text-pink-500 animate-spin mx-auto mt-6" />
      </motion.div>
    </motion.div>
  );
};

export default ProcessingModal;
