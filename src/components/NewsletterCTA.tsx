
import { useState } from "react";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const NewsletterCTA = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you would add the logic to subscribe the user
    toast({
      title: "Subscribed!",
      description: "Thanks for subscribing to our newsletter.",
      duration: 3000,
    });
    
    setEmail("");
  };

  return (
    <section className="py-24 px-6 bg-gradient-to-r from-violet-500 to-pink-500 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/20">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-2/3">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Stay Updated with the Latest Dupes
              </h2>
              <p className="text-white/80 mb-8">
                Subscribe to our newsletter and never miss a dupe again. Get weekly updates on new dupes, beauty tips, and exclusive offers.
              </p>
              
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white border-0 text-gray-800 placeholder:text-gray-400 h-12"
                    required
                  />
                </div>
                <Button type="submit" className="bg-violet-900 hover:bg-violet-800 text-white h-12 px-6">
                  Subscribe
                </Button>
              </form>
              
              <p className="text-xs text-white/60 mt-4">
                By subscribing you agree to our Privacy Policy. We'll never spam you.
              </p>
            </div>
            
            <div className="md:w-1/3 flex justify-center">
              <div className="rounded-full bg-white/20 p-6">
                <div className="rounded-full bg-white/30 p-8">
                  <Mail className="w-16 h-16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterCTA;
