import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ProcessingModal = ({
  isProcessing,
  detectedProduct,
  productError,
  previewImage,
  progressMessage,
  searchTriggered,
  searchText,
  cancelSearch,
  confirmProduct
}) => {
  return (
    <AnimatePresence>
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white/95 rounded-2xl p-6 md:p-8 max-w-md w-full mx-4 shadow-xl relative overflow-hidden"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 rounded-full"
              onClick={cancelSearch}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="space-y-6">
              {/* Processing spinner and message */}
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <Loader2 className="h-10 w-10 animate-spin text-violet-700" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Processing</h3>
                <p className="text-gray-600">{progressMessage}</p>
              </div>
              
              {/* Product identification confirmation */}
              {detectedProduct && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-violet-50 p-4 rounded-xl border border-violet-200 mt-4"
                >
                  <div className="flex items-center gap-2 mb-2 text-violet-700">
                    <CheckCircle className="h-5 w-5" />
                    <h4 className="font-medium">Product Identified</h4>
                  </div>
                  <p className="text-gray-800 mb-3">
                    We detected: <span className="font-semibold">{detectedProduct.name}</span> 
                    {detectedProduct.brand && <span> by <span className="font-semibold">{detectedProduct.brand}</span></span>}
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={cancelSearch}
                    >
                      That's not right
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={confirmProduct}
                    >
                      Yes, that's it!
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Error message if product is not relevant or couldn't be identified */}
              {productError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-50 p-4 rounded-xl border border-amber-200 mt-4"
                >
                  <div className="flex items-center gap-2 mb-2 text-amber-700">
                    <AlertTriangle className="h-5 w-5" />
                    <h4 className="font-medium">Not a Beauty Product</h4>
                  </div>
                  <p className="text-gray-800 mb-3">
                    {productError.message || "We couldn't identify a beauty product. Please try a different search."}
                  </p>
                  <div className="flex justify-end">
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={cancelSearch}
                    >
                      Try Again
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Show preview image if available */}
              {previewImage && (
                <div className="mt-4 rounded-lg overflow-hidden border border-gray-200">
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    className="w-full h-auto object-cover" 
                  />
                </div>
              )}

              {/* Search information */}
              {searchTriggered && searchText && !previewImage && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  <p>Searching for: <span className="font-semibold">{searchText}</span></p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProcessingModal;