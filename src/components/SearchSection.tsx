
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function SearchSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('https://cnoqknkqvygbrbzgnswn.supabase.co/functions/v1/search-dupes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchText: searchQuery }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to search for dupes');
      }

      // Redirect to the dupe details page
      navigate(`/dupes/for/${data.data.slug}`);

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to search for dupes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-purple-50 to-white">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500">
              Find Your Perfect Dupe
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
              Enter the name of your favorite high-end beauty product and we'll find affordable alternatives that work just as well.
            </p>
          </div>
          <div className="w-full max-w-2xl mx-auto">
            <form 
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-2"
            >
              <Input
                type="text"
                placeholder="E.g., Charlotte Tilbury Hollywood Flawless Filter"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Find Dupes"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
