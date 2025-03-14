
import { useState, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Camera, Loader2, Search, X } from "lucide-react";
import { motion } from "framer-motion";

interface SearchFormProps {
  searchText: string;
  setSearchText: (text: string) => void;
  previewImage: string | null;
  clearPreview: () => void;
  isProcessing: boolean;
  isCameraOpen: boolean;
  handleCameraSearch: () => void;
  handleSearch: (e?: React.FormEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const SearchForm = ({
  searchText,
  setSearchText,
  previewImage,
  clearPreview,
  isProcessing,
  isCameraOpen,
  handleCameraSearch,
  handleSearch,
  fileInputRef
}: SearchFormProps) => {
  return (
    <motion.form
      className="relative w-full max-w-3xl hero-search-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.6, duration: 0.8 }}
      onSubmit={handleSearch}
    >
      <div className="relative">
        {previewImage && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 group">
            <img
              src={previewImage}
              alt="Preview"
              className="h-10 w-10 rounded-full object-cover border-2 border-pink-100"
            />
            <button
              type="button"
              onClick={clearPreview}
              className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          </div>
        )}
        <Input
          type="text"
          placeholder="Search for your favorite makeup product..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className={`w-full h-16 pr-32 text-xl rounded-full border-2 border-pink-100 focus:border-pink-300 focus:ring-pink-200 font-light ${
            previewImage ? "pl-16" : "pl-8"
          }`}
        />
      </div>

      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2 items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleCameraSearch}
          disabled={isProcessing || isCameraOpen}
          className="h-12 w-12 hover:bg-pink-50"
        >
          <Camera className="w-6 h-6 text-pink-500" />
        </Button>
        <div className="w-px h-8 bg-pink-100" />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          disabled={isProcessing || isCameraOpen}
          className="h-12 w-12 hover:bg-pink-50 ml-2"
        >
          {isProcessing ? (
            <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
          ) : (
            <Search className="w-6 h-6 text-pink-500" />
          )}
        </Button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={() => {}}
        className="hidden"
      />
    </motion.form>
  );
};

export default SearchForm;
