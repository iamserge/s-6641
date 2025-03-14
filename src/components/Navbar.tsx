import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import UserMenu from "./UserMenu";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { pathname } = location;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <motion.img
                src="/logo-dupes.svg"
                alt="Beauty Dupes Logo"
                width={32}
                height={32}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              />
              <span className="font-bold text-xl">BeautyDupes</span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-4 ml-4">
              <Link
                to="/"
                className={cn(
                  "text-sm transition-colors hover:text-primary",
                  pathname === "/" ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                Home
              </Link>
              <Link
                to="/dupes"
                className={cn(
                  "text-sm transition-colors hover:text-primary",
                  pathname.includes("/dupes") ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                Dupes
              </Link>
              <Link
                to="/brands"
                className={cn(
                  "text-sm transition-colors hover:text-primary",
                  pathname === "/brands" ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                Brands
              </Link>
              <Link
                to="/ingredients"
                className={cn(
                  "text-sm transition-colors hover:text-primary",
                  pathname === "/ingredients" ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                Ingredients
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Replace search button with UserMenu component */}
            <UserMenu />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      
      <motion.div
        className="md:hidden absolute top-full left-0 w-full bg-white shadow-md border-b border-gray-100"
        style={{ display: isMobileMenuOpen ? 'block' : 'none' }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: isMobileMenuOpen ? 1 : 0, y: isMobileMenuOpen ? 0 : -10 }}
        transition={{ duration: 0.2 }}
      >
        <nav className="flex flex-col p-4 space-y-2">
          <Link
            to="/"
            className={cn(
              "block text-sm transition-colors hover:text-primary",
              pathname === "/" ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            Home
          </Link>
          <Link
            to="/dupes"
            className={cn(
              "block text-sm transition-colors hover:text-primary",
              pathname.includes("/dupes") ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            Dupes
          </Link>
          <Link
            to="/brands"
            className={cn(
              "block text-sm transition-colors hover:text-primary",
              pathname === "/brands" ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            Brands
          </Link>
          <Link
            to="/ingredients"
            className={cn(
              "block text-sm transition-colors hover:text-primary",
              pathname === "/ingredients" ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            Ingredients
          </Link>
        </nav>
      </motion.div>
    </header>
  );
};

export default Navbar;
