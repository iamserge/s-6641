
import { Button } from "../ui/button";
import { X } from "lucide-react";

interface ProductConfirmationProps {
  showProductConfirmation: boolean;
  detectedProduct: any;
  previewImage: string | null;
  searchTriggered: boolean;
  searchText: string;
  cancelSearch: () => void;
  setShowProductConfirmation: (show: boolean) => void;
}

const ProductConfirmation = ({
  showProductConfirmation,
  detectedProduct,
  previewImage,
  searchTriggered,
  searchText,
  cancelSearch,
  setShowProductConfirmation
}: ProductConfirmationProps) => {
  if (showProductConfirmation && detectedProduct) {
    return (
      <div className="mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-center gap-2">
          {previewImage && (
            <div className="w-12 h-12 rounded-full overflow-hidden border border-pink-100">
              <img
                src={previewImage}
                alt="Detected product"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="text-left">
            <p className="text-sm text-gray-500">We detected:</p>
            <p className="font-medium text-gray-800">
              {detectedProduct.brand ? `${detectedProduct.brand} ` : ''}
              {detectedProduct.name}
            </p>
            {detectedProduct.category && (
              <p className="text-xs text-gray-500">{detectedProduct.category}</p>
            )}
          </div>
        </div>
        <div className="mt-3 flex justify-center space-x-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={cancelSearch}
          >
            Not what I'm looking for
          </Button>
          <Button 
            size="sm"
            onClick={() => setShowProductConfirmation(false)}
          >
            Yes, that's right
          </Button>
        </div>
      </div>
    );
  }

  if (!showProductConfirmation && previewImage && searchTriggered && searchText) {
    return (
      <div className="mb-4 pb-4 border-b border-gray-100 relative">
        <div className="flex items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-pink-100">
            <img
              src={previewImage}
              alt="Detected product"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-left">
            <p className="text-sm text-gray-500">We detected:</p>
            <p className="font-medium text-gray-800">{searchText}</p>
          </div>
        </div>
        <button
          onClick={cancelSearch}
          className="absolute right-0 top-0 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Cancel search"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Not what you're looking for? Click the X to try again.
        </p>
      </div>
    );
  }

  return null;
};

export default ProductConfirmation;
