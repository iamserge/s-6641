
import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { CircleDollarSign, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Currency {
  code: string;
  symbol: string;
}

const currencies: Currency[] = [
  { code: 'USD', symbol: '$' },
  { code: 'GBP', symbol: '£' },
  { code: 'EUR', symbol: '€' },
];

const CurrencySelector = ({ selectedCurrency, setSelectedCurrency, className = "" }) => (
  <DropdownMenu>
    <DropdownMenuTrigger className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors">
      <span className="text-base font-medium">{selectedCurrency.symbol}</span>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-24 bg-white">
      {currencies.map((currency) => (
        <DropdownMenuItem
          key={currency.code}
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setSelectedCurrency(currency)}
        >
          <span>{currency.symbol}</span>
          <span>{currency.code}</span>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

const Navbar = () => {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);

  useEffect(() => {
    const searchElement = document.querySelector('.hero-search-section');
    if (!searchElement) return;

    const unsubscribe = scrollY.onChange(value => {
      const searchBottom = searchElement.getBoundingClientRect().bottom;
      setIsScrolled(value > searchBottom);
    });
    return () => unsubscribe();
  }, [scrollY]);

  return (
    <>
      {/* Static top navbar */}
      <div className="absolute top-0 left-0 right-0 z-40 px-6 py-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/52ac84d3-c972-4947-9aab-008fcc78be99.png" 
                alt="Dupe Academy Logo" 
                className="h-8"
              />
            </div>
            <div className="flex items-center gap-4">
              <CurrencySelector
                selectedCurrency={selectedCurrency}
                setSelectedCurrency={setSelectedCurrency}
              />
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30">
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky navbar that appears on scroll */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: isScrolled ? 0 : -100, opacity: isScrolled ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed w-full z-50 px-6 py-4 backdrop-blur-[5px] bg-white/20"
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/52ac84d3-c972-4947-9aab-008fcc78be99.png" 
                alt="Dupe Academy Logo" 
                className="h-8"
              />
            </div>
            <div className="flex items-center gap-4">
              <CurrencySelector
                selectedCurrency={selectedCurrency}
                setSelectedCurrency={setSelectedCurrency}
              />
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30">
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>
    </>
  );
};

export default Navbar;
