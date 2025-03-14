
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import DupePage from "./pages/DupePage";
import DupesPage from "./pages/DupesPage";
import BrandPage from "./pages/BrandPage";
import IngredientPage from "./pages/IngredientPage";
import BrandsDirectory from "./pages/BrandsDirectory";
import IngredientsDirectory from "./pages/IngredientsDirectory";
import { CurrencyProvider } from "./hooks/useCurrency";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CurrencyProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dupes" element={<DupesPage />} />
            <Route path="/dupes/for/:slug" element={<DupePage />} />
            <Route path="/brands/:slug" element={<BrandPage />} />
            <Route path="/ingredients/:slug" element={<IngredientPage />} />
            <Route path="/brands" element={<BrandsDirectory />} />
            <Route path="/ingredients" element={<IngredientsDirectory />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CurrencyProvider>
  </QueryClientProvider>
);

export default App;
