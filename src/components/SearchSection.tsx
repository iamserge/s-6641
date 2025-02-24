
import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { ImagePlus, Mic, Search } from "lucide-react";

const SearchSection = () => {
  const [searchMode, setSearchMode] = useState<"text" | "image" | "voice">("text");
  const [searchText, setSearchText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setSearchMode("image");
    }
  };

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log("Searching with:", { searchMode, searchText, imageUrl });
  };

  return (
    <section className="container mx-auto px-4 py-12">
      <Card className="p-6 max-w-2xl mx-auto">
        <div className="space-y-4">
          <div className="flex gap-2 justify-center mb-6">
            <Button
              variant={searchMode === "text" ? "default" : "outline"}
              onClick={() => setSearchMode("text")}
            >
              <Search className="w-4 h-4 mr-2" />
              Text Search
            </Button>
            <Button
              variant={searchMode === "image" ? "default" : "outline"}
              onClick={() => setSearchMode("image")}
            >
              <ImagePlus className="w-4 h-4 mr-2" />
              Image Upload
            </Button>
            <Button
              variant={searchMode === "voice" ? "default" : "outline"}
              onClick={() => setSearchMode("voice")}
            >
              <Mic className="w-4 h-4 mr-2" />
              Voice Search
            </Button>
          </div>

          {searchMode === "text" && (
            <Textarea
              placeholder="Describe the makeup product you're looking for..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="min-h-[100px]"
            />
          )}

          {searchMode === "image" && (
            <div className="space-y-4">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="block w-full h-40 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Uploaded product"
                    className="max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <ImagePlus className="w-8 h-8 mx-auto mb-2" />
                    <p>Click to upload product image</p>
                  </div>
                )}
              </label>
            </div>
          )}

          {searchMode === "voice" && (
            <div className="text-center p-8">
              <Button variant="outline" size="lg" className="rounded-full w-16 h-16">
                <Mic className="w-6 h-6" />
              </Button>
              <p className="mt-4">Click to start voice search</p>
            </div>
          )}

          <Button onClick={handleSearch} className="w-full">
            Find Dupes
          </Button>
        </div>
      </Card>
    </section>
  );
};

export default SearchSection;
