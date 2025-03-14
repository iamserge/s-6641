
import { useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Twitter, Facebook, Youtube, Mail } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

interface Language {
  code: string;
  name: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'ru', name: 'Русский' },
];

const Footer = () => {
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would handle the subscription logic
    console.log(`Subscribing email: ${email}`);
    setEmail("");
    // You could add a toast notification here
  };

  return (
    <footer className="bg-violet-900 text-white pt-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-3">
            <div className="flex items-center gap-2 mb-6">
              <img 
                src="/lovable-uploads/52ac84d3-c972-4947-9aab-008fcc78be99.png" 
                alt="Dupe Academy Logo" 
                className="h-8 brightness-0 invert"
              />
            </div>
            <p className="text-violet-200 text-sm mb-6">
              Your ultimate resource for discovering affordable alternatives to high-end beauty and skincare products.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-violet-200 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-violet-200 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-violet-200 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-violet-200 hover:text-white transition-colors">
                <Youtube size={20} />
              </a>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <h3 className="font-medium mb-4">Explore</h3>
            <ul className="space-y-3 text-violet-200">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/ingredients" className="hover:text-white transition-colors">Ingredients</Link></li>
              <li><Link to="/brands" className="hover:text-white transition-colors">Brands</Link></li>
            </ul>
          </div>
          
          <div className="md:col-span-2">
            <h3 className="font-medium mb-4">Resources</h3>
            <ul className="space-y-3 text-violet-200">
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Guides</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>
          
          <div className="md:col-span-2">
            <h3 className="font-medium mb-4">Company</h3>
            <ul className="space-y-3 text-violet-200">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div className="md:col-span-3">
            <h3 className="font-medium mb-4">Subscribe to our newsletter</h3>
            <p className="text-violet-200 text-sm mb-4">
              Get the latest beauty dupes and deals straight to your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-violet-800 border-violet-700 text-white placeholder:text-violet-400"
                required
              />
              <Button type="submit" className="bg-pink-500 hover:bg-pink-600">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
        
        <Separator className="my-8 bg-violet-800" />
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-8 text-violet-300 text-sm">
          <p>© 2024 Dupe Academy. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="text-sm hover:text-white transition-colors">
                  {selectedLanguage.name}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-violet-950 border-violet-800 text-violet-200">
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      className="cursor-pointer hover:bg-violet-900 hover:text-white"
                      onClick={() => setSelectedLanguage(lang)}
                    >
                      {lang.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
