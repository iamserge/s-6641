
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useToast } from "@/components/ui/use-toast";

export interface Currency {
  code: string;
  symbol: string;
  rate?: number;
}

interface CurrencyContextType {
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
  currencies: Currency[];
  convertPrice: (priceInUSD: number) => string;
  isLoading: boolean;
}

const defaultCurrencies: Currency[] = [
  { code: 'USD', symbol: '$', rate: 1 },
  { code: 'GBP', symbol: '£' },
  { code: 'EUR', symbol: '€' },
];

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [currencies, setCurrencies] = useState<Currency[]>(defaultCurrencies);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(() => {
    const savedCurrency = localStorage.getItem('selectedCurrency');
    if (savedCurrency) {
      try {
        return JSON.parse(savedCurrency);
      } catch (e) {
        return defaultCurrencies[0];
      }
    }
    return defaultCurrencies[0];
  });

  // When the selected currency changes, save it to localStorage
  useEffect(() => {
    localStorage.setItem('selectedCurrency', JSON.stringify(selectedCurrency));
  }, [selectedCurrency]);

  // Fetch exchange rates when component mounts
  useEffect(() => {
    const fetchExchangeRates = async () => {
      if (selectedCurrency.code === 'USD') return; // No need to fetch rates for USD
      if (selectedCurrency.rate) return; // Don't fetch if we already have rates

      setIsLoading(true);
      try {
        const response = await fetch(`https://open.er-api.com/v6/latest/USD`);
        const data = await response.json();
        
        if (data.rates) {
          // Update rates for all currencies
          const updatedCurrencies = currencies.map(currency => ({
            ...currency,
            rate: data.rates[currency.code] || 1
          }));
          
          setCurrencies(updatedCurrencies);
          
          // Also update the selected currency if needed
          setSelectedCurrency(prev => ({
            ...prev,
            rate: data.rates[prev.code] || 1
          }));
        }
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
        toast({
          title: "Currency rates unavailable",
          description: "Could not load currency rates. Using default values.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchExchangeRates();
  }, [selectedCurrency.code]);

  // Function to convert prices
  const convertPrice = (priceInUSD: number): string => {
    if (!priceInUSD) return '~0';
    
    const rate = selectedCurrency.rate || 1;
    const convertedPrice = Math.round(priceInUSD * rate);
    return `~${selectedCurrency.symbol}${convertedPrice}`;
  };

  return (
    <CurrencyContext.Provider 
      value={{ 
        selectedCurrency, 
        setSelectedCurrency, 
        currencies,
        convertPrice,
        isLoading
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
