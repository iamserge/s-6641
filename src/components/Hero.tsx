
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Mic, Camera } from "lucide-react";

const Hero = () => {
  const [searchText, setSearchText] = useState("");

  const handleVoiceSearch = () => {
    // TODO: Implement voice search
    console.log("Voice search triggered");
  };

  const handleCameraSearch = () => {
    // TODO: Implement camera search
    console.log("Camera search triggered");
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
            className="hover:bg-pink-50"
          >
            <Mic className="w-5 h-5 text-pink-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCameraSearch}
            className="hover:bg-pink-50"
          >
            <Camera className="w-5 h-5 text-pink-500" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
