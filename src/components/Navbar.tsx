import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Globe, CircleDollarSign } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface Currency {
  code: string;
  symbol: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

const currencies: Currency[] = [
  { code: 'USD', symbol: '$' },
  { code: 'GBP', symbol: '£' },
  { code: 'EUR', symbol: '€' },
];

const SelectorsGroup = ({ selectedLanguage, selectedCurrency, setSelectedLanguage, setSelectedCurrency, className = "" }) => (
  <div className={`flex items-center gap-4 ${className}`}>
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm">
        <span className="text-lg">{selectedLanguage.flag}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 bg-white">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setSelectedLanguage(lang)}
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>

    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-gray-50 transition-colors shadow-sm">
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
  </div>
);

const Navbar = () => {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
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

  const backgroundColor = useTransform(
    scrollY,
    [0, window.innerHeight - 100],
    ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.9)"]
  );

  const borderOpacity = useTransform(
    scrollY,
    [0, window.innerHeight - 100],
    [0, 1]
  );

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
            <SelectorsGroup
              selectedLanguage={selectedLanguage}
              selectedCurrency={selectedCurrency}
              setSelectedLanguage={setSelectedLanguage}
              setSelectedCurrency={setSelectedCurrency}
            />
          </div>
        </div>
      </div>

      {/* Sticky navbar that appears on scroll */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: isScrolled ? 0 : -100 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="fixed w-full z-50 px-6 py-4 backdrop-blur-sm"
        style={{ 
          backgroundColor,
          borderBottom: borderOpacity.get() > 0 ? "1px solid rgba(236, 72, 153, 0.1)" : "none"
        }}
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
            <SelectorsGroup
              selectedLanguage={selectedLanguage}
              selectedCurrency={selectedCurrency}
              setSelectedLanguage={setSelectedLanguage}
              setSelectedCurrency={setSelectedCurrency}
            />
          </div>
        </div>
      </motion.nav>
    </>
  );
};

export default Navbar;
