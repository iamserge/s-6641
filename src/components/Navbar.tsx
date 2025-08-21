import { useState, useEffect } from "react";
import { motion, useScroll } from "framer-motion";
import { User } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/useCurrency";

const CurrencySelector = () => {
  const { 
    selectedCurrency, 
    setSelectedCurrency,
    currencies
  } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
        >
          <span className="text-base font-medium">{selectedCurrency.symbol}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-24 bg-white border shadow-lg z-[200]">
        {currencies.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-100"
            onClick={() => setSelectedCurrency(currency)}
          >
            <span>{currency.symbol}</span>
            <span>{currency.code}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Navbar = () => {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const unsubscribe = scrollY.onChange(value => {
      setIsScrolled(value > 50);
    });
    return () => unsubscribe();
  }, [scrollY]);

  const navLinks = [
    { name: "Dupes", href: "/dupes" },
    { name: "Ingredients", href: "/ingredients" },
    { name: "Brands", href: "/brands" },
  ];

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-sm' 
          : 'bg-transparent'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-[1200px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="relative z-10">
            <img 
              src="/lovable-uploads/52ac84d3-c972-4947-9aab-008fcc78be99.png" 
              alt="Dupe Academy Logo" 
              className="h-8 w-auto"
            />
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8 relative z-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`font-medium transition-colors relative z-10 ${
                  isScrolled 
                    ? 'text-gray-900 hover:text-gray-600' 
                    : 'text-gray-800 hover:text-gray-600'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center gap-3 relative z-10">
            <CurrencySelector />
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;